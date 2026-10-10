import type { Account } from '../types/account';
import { extractSkinAvatar, getDefaultSteveAvatar } from './skinRenderer';

const STORAGE_ACCOUNTS_KEY = 'launcher_accounts';
const STORAGE_ACTIVE_ID_KEY = 'launcher_active_account_id';

/**
 * Loads accounts from local storage
 */
export function getSavedAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any legacy platforms like tlauncher if they existed
        const filtered = parsed.filter((a) => a.type === 'elyby' || a.type === 'offline');
        if (filtered.length > 0) return filtered;
      }
    }
  } catch {}

  // Fallback default initial offline account
  const defaultAccount: Account = {
    id: 'default-offline-player',
    username: 'Player',
    type: 'offline',
    skinAvatarUrl: getDefaultSteveAvatar(),
    createdAt: Date.now(),
  };

  saveAccounts([defaultAccount]);
  saveActiveAccountId(defaultAccount.id);
  return [defaultAccount];
}

/**
 * Saves all accounts to local storage
 */
export function saveAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts:', err);
  }
}

/**
 * Gets active account ID from storage
 */
export function getActiveAccountId(): string {
  try {
    const activeId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
    if (activeId) return activeId;
  } catch {}
  return 'default-offline-player';
}

/**
 * Sets active account ID in storage
 */
export function saveActiveAccountId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_ID_KEY, id);
  } catch {}
}

/**
 * Ely.by official skin texture URL
 */
export function getElyBySkinUrl(username: string): string {
  return `https://skinsystem.ely.by/skins/${encodeURIComponent(username)}.png`;
}

/**
 * Downloads the real skin texture from Ely.by and converts to Base64 Data URL
 * to prevent any CORS issues, tainted canvases, or network dropouts
 */
export async function fetchElyBySkinDataUrl(username: string): Promise<string | null> {
  const cleanUser = username.trim();
  if (!cleanUser) return null;

  // 1. Electron IPC handler (fastest, direct node fetch with no CORS)
  if (typeof window !== 'undefined' && window.electronAPI?.fetchElyBySkin) {
    try {
      const res = await window.electronAPI.fetchElyBySkin(cleanUser);
      if (res && res.startsWith('data:image')) {
        return res;
      }
    } catch {}
  }

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location?.origin?.includes('localhost') || window.location?.origin?.includes('127.0.0.1'));

  // 2. Direct skin PNG endpoint via Vite proxy or direct
  const endpoints = [
    isLocalhost
      ? `${window.location.origin}/api/elyby-skins/skins/${encodeURIComponent(cleanUser)}.png`
      : `https://skinsystem.ely.by/skins/${encodeURIComponent(cleanUser)}.png`,
    `https://skinsystem.ely.by/skins/${encodeURIComponent(cleanUser)}.png`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 100) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          if (dataUrl && dataUrl.startsWith('data:image')) {
            return dataUrl;
          }
        }
      }
    } catch {}
  }

  // 3. Ely.by profile JSON metadata endpoint (fallback)
  try {
    const profileUrl = isLocalhost
      ? `${window.location.origin}/api/elyby-skins/profile/${encodeURIComponent(cleanUser)}`
      : `https://skinsystem.ely.by/profile/${encodeURIComponent(cleanUser)}`;
    const res = await fetch(profileUrl);
    if (res.ok) {
      const data = await res.json();
      const texturesProp = data?.properties?.find((p: any) => p.name === 'textures');
      if (texturesProp?.value) {
        const decoded = JSON.parse(atob(texturesProp.value));
        const skinUrl = decoded?.textures?.SKIN?.url;
        if (skinUrl) {
          const skinRes = await fetch(skinUrl);
          if (skinRes.ok) {
            const blob = await skinRes.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            if (dataUrl && dataUrl.startsWith('data:image')) {
              return dataUrl;
            }
          }
        }
      }
    }
  } catch {}

  // 4. Fallback to Minotar skin CDN
  try {
    const minotarRes = await fetch(`https://minotar.net/skin/${encodeURIComponent(cleanUser)}`);
    if (minotarRes.ok) {
      const blob = await minotarRes.blob();
      if (blob.size > 100) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (dataUrl && dataUrl.startsWith('data:image')) {
          return dataUrl;
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Syncs Ely.by account skin from skinsystem.ely.by and updates head avatar
 */
export async function syncElyByAccountSkin(account: Account): Promise<Account> {
  if (account.type !== 'elyby') return account;
  try {
    let skinDataUrl = await fetchElyBySkinDataUrl(account.username);
    if (!skinDataUrl && account.skinUrl) {
      skinDataUrl = account.skinUrl;
    }
    if (skinDataUrl) {
      const avatarUrl = await extractSkinAvatar(skinDataUrl, 64);
      if (avatarUrl && avatarUrl.length > 200) {
        return {
          ...account,
          skinUrl: skinDataUrl,
          skinAvatarUrl: avatarUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to sync Ely.by skin for:', account.username, err);
  }
  return account;
}

export interface ElyByAuthResult {
  success: boolean;
  account?: Account;
  error?: string;
  requires2FA?: boolean;
  canOpenBrowser?: boolean;
  attempt?: number;
}

/**
 * Authenticate with Ely.by API with automatic 3-attempt retry on network issues.
 * Browser fallback is strictly reserved only for 3 failed attempts or 2FA.
 */
export async function authenticateElyBy(
  usernameOrEmail: string,
  password?: string,
  totpCode?: string,
  onAttempt?: (attempt: number, maxAttempts: number) => void
): Promise<ElyByAuthResult> {
  const cleanInput = usernameOrEmail.trim();
  if (!cleanInput) {
    return { success: false, error: 'Введите никнейм или email от Ely.by', canOpenBrowser: false };
  }

  if (!password || !password.trim()) {
    return {
      success: false,
      error: 'Для входа в аккаунт Ely.by обязательно требуется пароль.',
      canOpenBrowser: false,
    };
  }

  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    onAttempt?.(attempt, MAX_ATTEMPTS);

    try {
      // 1. Primary path: Use Electron IPC main-process handler (if available)
      if (window.electronAPI?.authElyBy) {
        try {
          const res = await window.electronAPI.authElyBy({
            username: cleanInput,
            password: password.trim(),
            totpCode: totpCode?.trim() || undefined,
          });

          if (res && res.success && res.profile) {
            let skinDataUrl = res.profile.skinDataUrl || null;
            if (!skinDataUrl) {
              skinDataUrl = await fetchElyBySkinDataUrl(res.profile.username);
            }

            const avatarUrl = skinDataUrl ? await extractSkinAvatar(skinDataUrl, 64) : '';

            const account: Account = {
              id: `elyby-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              username: res.profile.username,
              uuid: res.profile.uuid,
              accessToken: res.profile.accessToken,
              clientToken: res.profile.clientToken,
              type: 'elyby',
              skinUrl: skinDataUrl || `https://skinsystem.ely.by/skins/${encodeURIComponent(res.profile.username)}.png`,
              skinAvatarUrl: avatarUrl || getDefaultSteveAvatar(),
              email: cleanInput.includes('@') ? cleanInput : undefined,
              createdAt: Date.now(),
            };

            return { success: true, account };
          }

          if (res && res.requires2FA) {
            return {
              success: false,
              requires2FA: true,
              canOpenBrowser: true,
              error: 'В аккаунте включена двухфакторная проверка (2FA). Введите код 2FA или авторизуйтесь на сайте.',
            };
          }

          if (res && res.error) {
            const errLower = res.error.toLowerCase();
            if (
              errLower.includes('invalid credentials') ||
              errLower.includes('неверный логин') ||
              errLower.includes('forbidden')
            ) {
              // Direct credential typo — no retries, no browser link
              return {
                success: false,
                canOpenBrowser: false,
                error: 'Неверный логин или пароль на Ely.by.',
              };
            }
          }
        } catch (ipcErr) {
          console.warn('IPC auth attempt failed, trying proxy path:', ipcErr);
        }
      }

      // 2. High-reliability Proxy / Direct path (works in dev and browser)
      const clientToken = `elyby-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let finalPass = password.trim();
      if (totpCode && totpCode.trim()) {
        finalPass = `${finalPass}:${totpCode.trim()}`;
      }

      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location?.origin?.includes('localhost') || window.location?.origin?.includes('127.0.0.1'));
      const authEndpoint = isLocalhost
        ? `${window.location.origin}/api/elyby-auth/auth/authenticate`
        : 'https://authserver.ely.by/auth/authenticate';

      const res = await fetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ELauncher/1.0.0',
        },
        body: JSON.stringify({
          username: cleanInput,
          password: finalPass,
          clientToken,
          requestUser: true,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.selectedProfile?.name) {
        const username = data.selectedProfile.name;
        const uuid = data.selectedProfile.id || data.user?.id;
        const accessToken = data.accessToken;

        // Fetch real skin texture in base64 dataUrl
        const skinDataUrl = await fetchElyBySkinDataUrl(username);
        const avatarUrl = skinDataUrl ? await extractSkinAvatar(skinDataUrl, 64) : '';

        const account: Account = {
          id: `elyby-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          username,
          uuid,
          accessToken,
          clientToken,
          type: 'elyby',
          skinUrl: skinDataUrl || `https://skinsystem.ely.by/skins/${encodeURIComponent(username)}.png`,
          skinAvatarUrl: avatarUrl || getDefaultSteveAvatar(),
          email: cleanInput.includes('@') ? cleanInput : undefined,
          createdAt: Date.now(),
        };

        return { success: true, account };
      }

      const errMsg = (data?.errorMessage || data?.error || '').toLowerCase();
      if (
        errMsg.includes('two factor') ||
        errMsg.includes('2fa') ||
        errMsg.includes('totp') ||
        data?.error === '2fa_required'
      ) {
        return {
          success: false,
          requires2FA: true,
          canOpenBrowser: true,
          error: 'В аккаунте включена двухфакторная аутентификация (2FA). Введите код 2FA или авторизуйтесь на сайте.',
        };
      }

      if (
        res.status === 403 ||
        res.status === 401 ||
        errMsg.includes('invalid credentials') ||
        errMsg.includes('invalid username or password')
      ) {
        // Credential error: STOP retrying, do NOT offer browser
        return {
          success: false,
          canOpenBrowser: false,
          error: 'Неверный логин или пароль на Ely.by.',
        };
      }
    } catch (netErr) {
      console.warn(`Ely.by attempt ${attempt}/${MAX_ATTEMPTS} network failure:`, netErr);
    }

    // Delay before next attempt
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  // All 3 attempts exhausted: Only now show browser fallback and restart notice
  return {
    success: false,
    canOpenBrowser: true,
    error: 'Не удалось связаться с сервером Ely.by после 3 попыток подключения. Если не помогло, перезапустите лаунчер.',
  };
}

/**
 * Create an Offline account with custom PNG skin or Steve
 */
export async function createOfflineAccount(
  username: string,
  skinDataUrl?: string
): Promise<Account> {
  const cleanUsername = username.trim();
  let avatarUrl = '';

  if (skinDataUrl) {
    try {
      avatarUrl = await extractSkinAvatar(skinDataUrl, 64);
    } catch {}
  }

  if (!avatarUrl) {
    avatarUrl = getDefaultSteveAvatar();
  }

  const account: Account = {
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    username: cleanUsername,
    type: 'offline',
    skinUrl: skinDataUrl,
    skinAvatarUrl: avatarUrl,
    createdAt: Date.now(),
  };

  return account;
}
