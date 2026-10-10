import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Plus,
  Trash2,
  Check,
  Upload,
  ExternalLink,
  RotateCw,
  X,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Copy,
} from 'lucide-react';
import type { Account, AccountType } from '../types/account';
import {
  validateSkinFile,
  extractSkinAvatar,
  getDefaultSteveAvatar,
} from '../utils/skinRenderer';
import {
  authenticateElyBy,
  createOfflineAccount,
  syncElyByAccountSkin,
  fetchElyBySkinDataUrl,
} from '../utils/accountService';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';
import { playPalateClick } from '../utils/sound';

export function ElyByIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <img
      src="/elyby-logo.png"
      alt="Ely.by"
      className={`${className} object-contain rounded-[3px] shrink-0 select-none shadow-xs`}
    />
  );
}

export function OfflineIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z" />
    </svg>
  );
}

/**
 * Dynamic 3D Isometric / Layered Avatar renderer for accounts
 * Automatically pulls texture and generates 3D Minecraft head cube
 */
export function AccountAvatar({
  account,
  size = 64,
  className = "w-full h-full object-cover [image-rendering:pixelated]",
  onAvatarGenerated,
}: {
  account: Account;
  size?: number;
  className?: string;
  onAvatarGenerated?: (newAvatar: string) => void;
}) {
  const [avatar, setAvatar] = useState<string>(() => account.skinAvatarUrl || getDefaultSteveAvatar());
  const isGenerating = useRef(false);

  useEffect(() => {
    if (account.skinAvatarUrl && account.skinAvatarUrl.length > 200) {
      setAvatar(account.skinAvatarUrl);
    }
  }, [account.skinAvatarUrl]);

  useEffect(() => {
    let cancelled = false;

    const generateAvatar = async () => {
      if (isGenerating.current) return;
      isGenerating.current = true;

      try {
        let skinSource = account.skinUrl;
        if (!skinSource || !skinSource.startsWith('data:')) {
          if (account.type === 'elyby' || !account.skinUrl) {
            skinSource = (await fetchElyBySkinDataUrl(account.username)) || skinSource;
          }
        }

        if (skinSource) {
          const renderedHead = await extractSkinAvatar(skinSource, size);
          if (renderedHead && renderedHead.length > 200 && !cancelled) {
            setAvatar(renderedHead);
            if (renderedHead !== account.skinAvatarUrl) {
              onAvatarGenerated?.(renderedHead);
            }
            return;
          }
        }

        // If no skin source was found or extraction failed, fallback to Steve avatar
        if (!cancelled && (!account.skinAvatarUrl || account.skinAvatarUrl.length <= 200)) {
          const defaultAvatar = getDefaultSteveAvatar();
          setAvatar(defaultAvatar);
        }
      } catch (e) {
        console.warn('AccountAvatar generation error:', e);
      } finally {
        isGenerating.current = false;
      }
    };

    generateAvatar();

    return () => {
      cancelled = true;
    };
  }, [account.id, account.username, account.type, account.skinUrl, size, onAvatarGenerated]);

  return (
    <img
      src={avatar || getDefaultSteveAvatar()}
      alt={account.username}
      onError={(e) => {
        const target = e.currentTarget;
        const fallback = getDefaultSteveAvatar();
        if (target.src !== fallback) {
          target.src = fallback;
        }
      }}
      className={className}
    />
  );
}

interface AccountsViewProps {
  accounts: Account[];
  activeAccountId: string;
  language?: Language;
  onSelectAccount: (id: string) => void;
  onAddAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateAccount: (account: Account) => void;
}

export function AccountsView({
  accounts,
  activeAccountId,
  language = 'ru',
  onSelectAccount,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccount,
}: AccountsViewProps) {
  const t = translations[language];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<AccountType>('elyby');

  // Form inputs: username/email, password, and optional 2FA totp code
  const [modalInput, setModalInput] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalTotpCode, setModalTotpCode] = useState('');
  const [modalSkinDataUrl, setModalSkinDataUrl] = useState<string | null>(null);

  // Status and error handling
  const [authError, setAuthError] = useState<string | null>(null);
  const [canOpenBrowser, setCanOpenBrowser] = useState(false);
  const [connectionAttempt, setConnectionAttempt] = useState<number | null>(null);
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [skinUploadError, setSkinUploadError] = useState<string | null>(null);
  const [refreshingAccountId, setRefreshingAccountId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const [targetAccountForSkin, setTargetAccountForSkin] = useState<Account | null>(null);

  // Profile modal state
  const [profileAccount, setProfileAccount] = useState<Account | null>(null);
  const [profileCopied, setProfileCopied] = useState(false);

  // Track which account IDs we've already synced this session to avoid infinite loops
  const syncedAccountIds = useRef<Set<string>>(new Set());

  // Auto-sync Ely.by skins periodically and whenever window gains focus (real-time skin updates)
  useEffect(() => {
    const syncAllElyBy = () => {
      accounts.forEach((acc) => {
        if (acc.type === 'elyby') {
          syncElyByAccountSkin(acc)
            .then((updated) => {
              if (updated.skinAvatarUrl !== acc.skinAvatarUrl || updated.skinUrl !== acc.skinUrl) {
                onUpdateAccount(updated);
                setProfileAccount((curr) => (curr && curr.id === updated.id ? updated : curr));
              }
            })
            .catch(() => {});
        }
      });
    };

    // Immediate sync on mount
    syncAllElyBy();

    // Sync on window focus (e.g. user changed skin in browser or Ely.by cabinet and switched back)
    const handleFocus = () => {
      syncAllElyBy();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic polling every 30 seconds
    const interval = setInterval(syncAllElyBy, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [accounts, onUpdateAccount]);

  const handleRefreshElyBySkin = async (acc: Account) => {
    playPalateClick(0.2);
    setRefreshingAccountId(acc.id);
    // Allow re-sync even if this account was already synced this session
    syncedAccountIds.current.delete(acc.id);
    try {
      const updated = await syncElyByAccountSkin(acc);
      syncedAccountIds.current.add(acc.id);
      onUpdateAccount(updated);
    } catch {
      // leave out of synced set so user can try again
    } finally {
      setRefreshingAccountId(null);
    }
  };

  const handleOpenExternal = (url: string) => {
    playPalateClick(0.24);
    try {
      if (window.electronAPI?.openExternal) {
        window.electronAPI.openExternal(url).catch(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Upload or replace skin for an offline account
  const handleSkinFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetAccountForSkin) return;

    const validation = await validateSkinFile(file);
    if (!validation.isValid || !validation.dataUrl) {
      setSkinUploadError(validation.error || 'Ошибка загрузки скина');
      return;
    }

    const avatarUrl = await extractSkinAvatar(validation.dataUrl, 64);
    const updated: Account = {
      ...targetAccountForSkin,
      skinUrl: validation.dataUrl,
      skinAvatarUrl: avatarUrl || targetAccountForSkin.skinAvatarUrl,
    };
    onUpdateAccount(updated);
    setTargetAccountForSkin(null);
    e.target.value = '';
  };

  const handleModalSkinSelect = async (file: File) => {
    const validation = await validateSkinFile(file);
    if (!validation.isValid || !validation.dataUrl) {
      setAuthError(validation.error || 'Неверный файл скина');
      return;
    }
    setModalSkinDataUrl(validation.dataUrl);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setCanOpenBrowser(false);

    const val = modalInput.trim();

    if (modalType === 'elyby') {
      if (!val) {
        setAuthError(language === 'ru' ? 'Введите никнейм или email от Ely.by' : 'Enter your Ely.by username or email');
        usernameInputRef.current?.focus();
        return;
      }
      if (!modalPassword.trim()) {
        setAuthError(language === 'ru' ? 'Для входа на Ely.by необходимо ввести пароль' : 'Password is required to login to Ely.by');
        return;
      }

      // Check if this Ely.by account is already in the list
      const cleanVal = val.toLowerCase();
      const duplicateElyBy = accounts.find(
        (a) =>
          a.type === 'elyby' &&
          (a.username.toLowerCase() === cleanVal || (a.email && a.email.toLowerCase() === cleanVal))
      );
      if (duplicateElyBy) {
        setAuthError(
          language === 'ru'
            ? `Аккаунт "${duplicateElyBy.username}" уже добавлен в лаунчер.`
            : `Account "${duplicateElyBy.username}" is already added.`
        );
        return;
      }

      setIsSubmitting(true);
      setConnectionAttempt(1);
      try {
        const result = await authenticateElyBy(
          val,
          modalPassword,
          modalTotpCode,
          (attempt) => setConnectionAttempt(attempt)
        );
        if (result.success && result.account) {
          // Double check against returned real username from Ely.by
          const realUser = result.account.username.toLowerCase();
          const alreadyAdded = accounts.find(
            (a) => a.type === 'elyby' && a.username.toLowerCase() === realUser
          );
          if (alreadyAdded) {
            onSelectAccount(alreadyAdded.id);
            setIsAddModalOpen(false);
            setModalInput('');
            setModalPassword('');
            setModalTotpCode('');
            setAuthError(null);
            return;
          }

          onAddAccount(result.account);
          onSelectAccount(result.account.id);
          setIsAddModalOpen(false);
          setModalInput('');
          setModalPassword('');
          setModalTotpCode('');
          setAuthError(null);
          setIs2FARequired(false);
          setCanOpenBrowser(false);
          setConnectionAttempt(null);
        } else {
          setAuthError(
            result.error ||
              (language === 'ru' ? 'Неверный логин или пароль на Ely.by.' : 'Invalid Ely.by username or password.')
          );
          setCanOpenBrowser(result.canOpenBrowser || false);
          if (result.requires2FA) {
            setIs2FARequired(true);
          }
        }
      } catch (err: any) {
        setAuthError(
          err?.message || (language === 'ru' ? 'Ошибка подключения к серверу Ely.by' : 'Connection error to Ely.by')
        );
        setCanOpenBrowser(false);
      } finally {
        setIsSubmitting(false);
        setConnectionAttempt(null);
      }
    } else {
      // Offline account
      if (!val) {
        setAuthError('Введите никнейм игрока');
        return;
      }
      if (!/^[a-zA-Z0-9_]{3,16}$/.test(val)) {
        setAuthError('Никнейм должен содержать от 3 до 16 символов (только английские буквы, цифры и _)');
        return;
      }

      // Check if offline account with this exact username already exists
      const cleanNick = val.toLowerCase();
      const duplicateOffline = accounts.find(
        (a) => a.type === 'offline' && a.username.toLowerCase() === cleanNick
      );
      if (duplicateOffline) {
        setAuthError(
          language === 'ru'
            ? `Оффлайн аккаунт с ником "${val}" уже существует.`
            : `Offline account "${val}" already exists.`
        );
        return;
      }

      setIsSubmitting(true);
      try {
        const newAcc = await createOfflineAccount(val, modalSkinDataUrl || undefined);
        onAddAccount(newAcc);
        onSelectAccount(newAcc.id);
        setIsAddModalOpen(false);
        setModalInput('');
        setModalPassword('');
        setModalSkinDataUrl(null);
        setAuthError(null);
      } catch (err: any) {
        setAuthError(err?.message || 'Ошибка создания оффлайн профиля');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 overflow-hidden select-none">
      {/* Hidden file input for updating offline skin */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png"
        onChange={handleSkinFileChange}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-5 border-b border-[#181a24] shrink-0">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif] flex items-center gap-2.5">
            <User className="w-5 h-5 text-[#94a3b8]" />
            <span>{t.accountsTitle}</span>
          </h2>
          <p className="text-xs text-[#71788e] font-mono mt-0.5">
            {t.accountsSubtitle}
          </p>
        </div>

        {/* Add Account Button */}
        <button
          onClick={() => {
            playPalateClick(0.24);
            setAuthError(null);
            setIs2FARequired(false);
            setModalInput('');
            setModalPassword('');
            setModalTotpCode('');
            setModalSkinDataUrl(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white hover:bg-[#e2e6f0] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t.accountsAddBtn}</span>
        </button>
      </div>

      {/* Accounts List (Only Clean List - No Previews) */}
      <div className="flex-1 min-h-0 pt-5 overflow-y-auto pr-1">
        {accounts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#64748b]">
            <span className="text-xs font-mono">{t.accountsNoAccounts}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => {
              const isActive = acc.id === activeAccountId;
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    playPalateClick(0.18);
                    setProfileAccount(acc);
                  }}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-[#131620] border-[#38435f] shadow-lg ring-1 ring-[#415074]/30'
                      : 'bg-[#0f1118] hover:bg-[#141722] border-[#1d212d] hover:border-[#2b3245]'
                  }`}
                >
                  {/* Account Header: Avatar, Username, Platform */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Pixelated Minecraft 3D Face Avatar */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#171b26] border border-[#272e40] shrink-0 [image-rendering:pixelated]">
                        <AccountAvatar
                          account={acc}
                          size={64}
                          className="w-full h-full object-cover [image-rendering:pixelated]"
                          onAvatarGenerated={(newAvatar) => {
                            onUpdateAccount({
                              ...acc,
                              skinAvatarUrl: newAvatar,
                            });
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white tracking-wide truncate font-['Barlow_Condensed',sans-serif]">
                            {acc.username}
                          </span>
                        </div>

                        {/* Platform indicator */}
                        <div className="flex items-center gap-2 mt-0.5">
                          {acc.type === 'elyby' ? (
                            <span className="flex items-center gap-1.5 text-xs font-mono text-[#34d399] font-medium">
                              <ElyByIcon className="w-3.5 h-3.5 text-[#10b981]" />
                              <span>Ely.by</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs font-mono text-[#94a3b8] font-medium">
                              <OfflineIcon className="w-3.5 h-3.5 text-[#64748b]" />
                              <span>{t.accountTypeOffline}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Select button if not active */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPalateClick(0.2);
                            onSelectAccount(acc.id);
                          }}
                          className="px-3 h-8 rounded-xl bg-[#151924] hover:bg-[#202738] border border-[#283248] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                        >
                          {t.accountsSelectBtn}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account Footer: Skin Info & Actions */}
                  <div className="pt-3 border-t border-[#1a1d29] flex items-center justify-between text-xs font-mono text-[#788298]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748b]">{t.accountSkinStatus}:</span>
                      {acc.type === 'elyby' ? (
                        <span className="text-[#34d399]">{t.accountSkinElyBy}</span>
                      ) : acc.skinUrl ? (
                        <span className="text-[#cbd5e1]">{t.accountSkinCustom}</span>
                      ) : (
                        <span className="text-[#818a9f]">{t.accountSkinDefault}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Profile link */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPalateClick(0.18);
                          setProfileAccount(acc);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141822] hover:bg-[#1a202e] border border-[#273248] text-xs font-mono text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
                      >
                        <User className="w-3 h-3" />
                        <span>{t.accountViewProfile}</span>
                      </button>

                      {/* Delete Account */}
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playPalateClick(0.2);
                            setAccountToDelete(acc);
                          }}
                          title={t.accountsDeleteBtn}
                          className="w-7 h-7 rounded-lg bg-transparent hover:bg-rose-950/40 text-[#64748b] hover:text-rose-400 border border-transparent hover:border-rose-900/50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Centered Modal: Add / Connect Account */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[#222534] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="h-14 px-6 border-b border-[#1c1f2b] flex items-center justify-between bg-[#10121a]">
                <span className="text-sm font-bold uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif]">
                  {t.accountModalTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#171924] hover:bg-[#282d3e] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Platform Selector Tabs: Ely.by vs Offline only */}
              <div className="px-6 pt-4 pb-2 bg-[#0e1017] border-b border-[#181a24] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.18);
                    setModalType('elyby');
                    setAuthError(null);
                    setIs2FARequired(false);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer ${
                    modalType === 'elyby'
                      ? 'bg-[#15271d] border-[#296841] text-[#34d399]'
                      : 'bg-[#10121a] border-[#1f2330] text-[#788298] hover:text-white'
                  }`}
                >
                  <ElyByIcon className="w-4 h-4 text-[#10b981]" />
                  <span>Ely.by</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.18);
                    setModalType('offline');
                    setAuthError(null);
                    setIs2FARequired(false);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all cursor-pointer ${
                    modalType === 'offline'
                      ? 'bg-[#1a1d28] border-[#38415c] text-white'
                      : 'bg-[#10121a] border-[#1f2330] text-[#788298] hover:text-white'
                  }`}
                >
                  <OfflineIcon className="w-4 h-4 text-[#94a3b8]" />
                  <span>{t.accountTypeOffline}</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                {/* 2FA Alert Notice & Actions */}
                {is2FARequired && (
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs font-mono space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{t.accountModal2FANotice}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenExternal('https://account.ely.by/login')}
                      className="w-full h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-['Barlow_Condensed',sans-serif]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.accountOpenInSysBrowser}</span>
                    </button>
                  </div>
                )}

                {/* Error Banner with Registration / Browser Action */}
                {authError && !is2FARequired && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>

                    {modalType === 'elyby' && canOpenBrowser && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenExternal('https://account.ely.by')}
                          className="w-full h-8 rounded-lg bg-[#141620] hover:bg-[#1c2030] border border-[#262c40] text-[#cbd5e1] hover:text-white text-[11px] font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#64748b]" />
                          <span>{t.accountOpenInSysBrowser}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-mono text-[#8b92a5] mb-1.5">
                    {modalType === 'elyby' ? t.accountModalUsernameOrEmail : 'Игровой никнейм'}
                  </label>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={modalInput}
                    onChange={(e) => {
                      setModalInput(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    placeholder={
                      modalType === 'offline'
                        ? 'Player123'
                        : language === 'ru'
                        ? 'Никнейм или email от Ely.by'
                        : 'Ely.by Username or Email'
                    }
                    className={`w-full h-10 px-3.5 rounded-xl bg-[#141620] border text-white text-xs font-mono outline-hidden transition-colors placeholder:text-[#50576e] ${
                      authError && !modalInput.trim()
                        ? 'border-rose-500/80 focus:border-rose-400'
                        : 'border-[#232738] focus:border-white/50'
                    }`}
                    autoFocus
                    required
                  />
                </div>

                {/* Password (for Ely.by) */}
                {modalType === 'elyby' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono text-[#8b92a5] flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-[#788298]" />
                        <span>{t.accountModalPassword}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleOpenExternal('https://account.ely.by/register')}
                        className="text-[11px] font-mono text-[#34d399] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>{t.accountModalRegisterElyBy}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </button>
                    </div>
                    <input
                      type="password"
                      value={modalPassword}
                      onChange={(e) => {
                        setModalPassword(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      placeholder={
                        language === 'ru'
                          ? 'Пароль от аккаунта Ely.by'
                          : 'Your Ely.by password'
                      }
                      className={`w-full h-10 px-3.5 rounded-xl bg-[#141620] border text-white text-xs font-mono outline-hidden transition-colors placeholder:text-[#50576e] ${
                        authError && !modalPassword.trim()
                          ? 'border-rose-500/80 focus:border-rose-400'
                          : 'border-[#232738] focus:border-white/50'
                      }`}
                      required
                    />
                  </div>
                )}

                {/* 2FA Code Input (when 2FA is active) */}
                {modalType === 'elyby' && is2FARequired && (
                  <div>
                    <label className="block text-xs font-mono text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Код 2FA (Google Authenticator)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={modalTotpCode}
                      onChange={(e) => setModalTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#1d1712] border border-amber-600/60 focus:border-amber-400 text-white text-sm font-mono tracking-widest outline-hidden transition-colors placeholder:text-[#6e5840]"
                      autoFocus
                    />
                  </div>
                )}

                {/* Offline Custom Skin Upload */}
                {modalType === 'offline' && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-mono text-[#8b92a5]">
                      {t.accountModalSkinFile}
                    </label>

                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept=".png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleModalSkinSelect(file);
                      }}
                      className="hidden"
                    />

                    <div
                      onClick={() => modalFileInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-dashed border-[#2d3448] hover:border-white/40 bg-[#12141e] hover:bg-[#161926] transition-all cursor-pointer flex items-center justify-center gap-2.5 text-center"
                    >
                      <Upload className="w-4 h-4 text-[#8b92a5]" />
                      <span className="text-xs font-mono text-[#cbd5e1]">
                        {modalSkinDataUrl ? 'Скин выбран (.PNG)' : t.accountModalDropSkin}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-98 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>
                          {connectionAttempt
                            ? (language === 'ru'
                                ? `Подключение (попытка ${connectionAttempt} из 3)...`
                                : `Connecting (attempt ${connectionAttempt} of 3)...`)
                            : (language === 'ru' ? 'Подключение к Ely.by...' : 'Connecting...')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          {modalType === 'offline'
                            ? t.accountModalCreateOffline
                            : t.accountModalConnect}
                        </span>
                      </>
                    )}
                  </button>

                  {modalType === 'elyby' && (
                    <p className="text-[11px] font-mono text-center text-[#64748b]">
                      {language === 'ru'
                        ? 'Введите ваш логин и пароль от Ely.by для привязки к лаунчеру.'
                        : 'Enter your Ely.by credentials to link your account to the launcher.'}
                    </p>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal: Delete Account */}
      <AnimatePresence>
        {accountToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccountToDelete(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border border-[#2b1f24] bg-[#0c0d12] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 pb-3 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center shrink-0 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif]">
                    {t.accountsConfirmDelete}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-300 truncate max-w-[180px]">
                      {accountToDelete.username}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#181a24] text-[#8b92a5] border border-[#262c3e]">
                      {accountToDelete.type === 'elyby' ? 'Ely.by' : 'Offline'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAccountToDelete(null)}
                  className="w-7 h-7 rounded-lg bg-[#141620] hover:bg-[#202434] text-[#8b92a5] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Message */}
              <div className="px-5 py-2 text-xs text-[#8c94a8] leading-relaxed">
                {language === 'ru'
                  ? 'Вы уверены, что хотите удалить этот аккаунт из лаунчера? Вы сможете подключить его снова в любое время.'
                  : 'Are you sure you want to remove this account? You can re-add it at any time.'}
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-3 mt-2 border-t border-[#181a24] bg-[#090a0f] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.18);
                    setAccountToDelete(null);
                  }}
                  className="px-4 h-9 rounded-xl bg-[#141620] hover:bg-[#1f2332] active:scale-95 border border-[#24293a] text-xs font-mono font-bold text-[#cbd5e1] hover:text-white transition-all cursor-pointer"
                >
                  {t.cancel}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.24);
                    onDeleteAccount(accountToDelete.id);
                    setAccountToDelete(null);
                  }}
                  className="px-5 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-md shadow-rose-950/50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.accountsDeleteBtn}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skin Upload Error Toast */}
      <AnimatePresence>
        {skinUploadError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#1c0f13] border border-rose-800/80 shadow-2xl flex items-center gap-3 text-xs text-rose-300 font-mono"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{skinUploadError}</span>
            <button
              type="button"
              onClick={() => setSkinUploadError(null)}
              className="ml-2 w-5 h-5 rounded hover:bg-rose-900/40 text-rose-400 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {profileAccount && (() => {
          const acc = profileAccount;
          const isActive = acc.id === activeAccountId;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProfileAccount(null)}
                className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md rounded-2xl border border-[#222534] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="h-14 px-5 border-b border-[#1c1f2b] flex items-center justify-between bg-[#10121a]">
                  <span className="text-sm font-black uppercase tracking-widest text-white font-['Barlow_Condensed',sans-serif]">
                    {t.accountProfileTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProfileAccount(null)}
                    className="w-8 h-8 rounded-lg bg-[#171924] hover:bg-[#282d3e] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Avatar + Name section */}
                <div className="p-5 flex items-center gap-4 border-b border-[#181a24]">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#171b26] border border-[#272e40] shrink-0 [image-rendering:pixelated]">
                    <AccountAvatar
                      account={acc}
                      size={96}
                      className="w-full h-full object-cover [image-rendering:pixelated]"
                      onAvatarGenerated={(newAvatar) => {
                        onUpdateAccount({ ...acc, skinAvatarUrl: newAvatar });
                        setProfileAccount({ ...acc, skinAvatarUrl: newAvatar });
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-white tracking-wide font-['Barlow_Condensed',sans-serif]">{acc.username}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e2e24] border border-[#2d553d] text-emerald-400">
                          {t.accountProfileCurrentlyActive}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {acc.type === 'elyby' ? (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-[#34d399]">
                          <ElyByIcon className="w-3.5 h-3.5" />
                          <span>Ely.by</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-mono text-[#94a3b8]">
                          <OfflineIcon className="w-3.5 h-3.5" />
                          <span>{t.accountTypeOffline}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info rows */}
                <div className="p-5 space-y-3">
                  {/* UUID */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#71788e]">{t.accountProfileUUID}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#c0c8d8] truncate max-w-[180px]" title={acc.id}>
                        {acc.id.slice(0, 8)}...{acc.id.slice(-4)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(acc.id).catch(() => {});
                          setProfileCopied(true);
                          setTimeout(() => setProfileCopied(false), 1800);
                        }}
                        title={t.accountProfileCopyUUID}
                        className="w-6 h-6 rounded-lg bg-[#141620] hover:bg-[#1d2130] border border-[#252a3b] flex items-center justify-center text-[#8b92a5] hover:text-white transition-colors cursor-pointer"
                      >
                        {profileCopied ? (
                          <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email (Ely.by only) */}
                  {acc.type === 'elyby' && acc.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#71788e]">{t.accountProfileEmail}</span>
                      <span className="text-xs font-mono text-[#c0c8d8]">{acc.email}</span>
                    </div>
                  )}

                  {/* Skin status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#71788e]">{t.accountSkinStatus}</span>
                    <span className={`text-xs font-mono ${
                      acc.type === 'elyby' ? 'text-[#34d399]' : acc.skinUrl ? 'text-[#cbd5e1]' : 'text-[#818a9f]'
                    }`}>
                      {acc.type === 'elyby' ? t.accountSkinElyBy : acc.skinUrl ? t.accountSkinCustom : t.accountSkinDefault}
                    </span>
                  </div>

                  {/* Skin note */}
                  <div className="p-3 rounded-xl bg-[#141620] border border-[#222534]">
                    <p className="text-[11px] font-mono text-[#71788e] leading-relaxed">
                      {acc.type === 'elyby' ? t.accountProfileSkinNote : t.accountProfileOfflineSkinNote}
                    </p>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="px-5 pb-5 pt-2 flex flex-col gap-2">
                  {/* Ely.by actions */}
                  {acc.type === 'elyby' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRefreshElyBySkin(acc)}
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-[#141822] hover:bg-[#1a202e] border border-[#273248] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${refreshingAccountId === acc.id ? 'animate-spin text-[#34d399]' : ''}`} />
                        <span>{t.accountRefreshSkin}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenExternal('https://account.ely.by')}
                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-[#141822] hover:bg-[#1a202e] border border-[#273248] text-xs font-mono text-[#34d399] hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <span>{t.accountProfileOpenCabinet}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </button>
                    </div>
                  )}

                  {/* Offline skin upload */}
                  {acc.type === 'offline' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetAccountForSkin(acc);
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center justify-center gap-2 h-9 rounded-xl bg-[#141622] hover:bg-[#1d2233] border border-[#252b3d] hover:border-white/40 text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#94a3b8]" />
                      <span>{acc.skinUrl ? t.accountChangeSkin : t.accountUploadSkin}</span>
                    </button>
                  )}

                  <div className="flex gap-2 pt-1">
                    {/* Make active */}
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => {
                          playPalateClick(0.2);
                          onSelectAccount(acc.id);
                          setProfileAccount(null);
                        }}
                        className="flex-1 h-10 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{t.accountProfileMakeActive}</span>
                      </button>
                    )}
                    {isActive && (
                      <div className="flex-1 h-10 rounded-xl bg-[#14231a] border border-[#214c33] text-emerald-400 font-black text-xs uppercase tracking-wider font-['Barlow_Condensed',sans-serif] flex items-center justify-center gap-2">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>{t.accountProfileCurrentlyActive}</span>
                      </div>
                    )}

                    {/* Delete */}
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          playPalateClick(0.2);
                          setProfileAccount(null);
                          setAccountToDelete(acc);
                        }}
                        className="w-10 h-10 rounded-xl bg-transparent hover:bg-rose-950/40 text-[#64748b] hover:text-rose-400 border border-[#1f212b] hover:border-rose-900/50 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
