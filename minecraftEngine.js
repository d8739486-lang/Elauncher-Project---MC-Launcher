import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { spawn } from 'child_process';
import https from 'https';
import http from 'http';
import zlib from 'zlib';
import { setupUniversalThemeAssets, injectUniversalThemeToInstance } from './scripts/universalTheme.js';

export function getDefaultInstancesPath() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.local/share'));
  return path.join(appData, '.minecraft');
}

export function getDefaultLauncherPath() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.local/share'));
  return path.join(appData, 'ELauncher');
}

let activeGameProcess = null;

/**
 * Downloads a file from url to destPath using streams with redirect support
 */
export function downloadFile(url, destPath, onByteProgress = null, maxRedirects = 8) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects while downloading: ' + url));
    }

    const parentDir = path.dirname(destPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    let resolved = false;
    let timeoutTimer = null;

    const resetTimeout = (ms = 90000) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      timeoutTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          req.destroy(new Error(`Inactivity timeout (no data for 90s): ${url}`));
        }
      }, ms);
    };

    resetTimeout(90000);

    const client = url.startsWith('https:') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'ELauncher/1.0.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        res.resume(); // consume any redirect body
        const nextUrl = new URL(res.headers.location, url).toString();
        return downloadFile(nextUrl, destPath, onByteProgress, maxRedirects - 1)
          .then((p) => { resolved = true; resolve(p); })
          .catch((e) => { resolved = true; reject(e); });
      }

      if (res.statusCode !== 200) {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        res.resume();
        resolved = true;
        return reject(new Error(`Download failed with status ${res.statusCode}: ${url}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;

      const fileStream = fs.createWriteStream(destPath);

      res.on('data', (chunk) => {
        resetTimeout(90000);
        downloadedBytes += chunk.length;
        if (onByteProgress && totalBytes > 0) {
          const percent = Math.min(99, Math.round((downloadedBytes / totalBytes) * 100));
          onByteProgress(percent, downloadedBytes, totalBytes);
        }
      });

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        resolved = true;
        fileStream.close();
        resolve(destPath);
      });

      fileStream.on('error', (err) => {
        if (timeoutTimer) clearTimeout(timeoutTimer);
        resolved = true;
        try { fs.unlinkSync(destPath); } catch {}
        reject(err);
      });
    });

    req.on('error', (err) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (!resolved) {
        resolved = true;
        try { fs.unlinkSync(destPath); } catch {}
        reject(err);
      }
    });
  });
}

/**
 * Checks if a Minecraft version's client.jar and version.json are installed locally
 */
export function checkMinecraftInstalled({ instancesPath, version, loader }) {
  if (!version) return false;
  const effectiveInstances = (instancesPath && typeof instancesPath === 'string' && instancesPath.trim())
    ? instancesPath.trim()
    : getDefaultInstancesPath();
  const versionJar = path.join(effectiveInstances, 'versions', version, `${version}.jar`);
  const versionJson = path.join(effectiveInstances, 'versions', version, `${version}.json`);
  if (!fs.existsSync(versionJar) || !fs.existsSync(versionJson)) {
    return false;
  }
  if (loader && typeof loader === 'string' && loader.toLowerCase() !== 'vanilla' && loader.toLowerCase() !== 'elauncher') {
    const ldr = loader.toLowerCase();
    const loaderJson = path.join(effectiveInstances, 'versions', `${version}-${ldr}`, `${version}-${ldr}.json`);
    if (!fs.existsSync(loaderJson)) {
      return false;
    }
  }
  return true;
}

/**
 * Converts a Maven coordinate (group:artifact:version[:classifier][@ext]) to relative jar path
 */
export function mavenCoordinateToPath(coord, classifier = null) {
  if (!coord || typeof coord !== 'string') return null;
  const parts = coord.split(':');
  if (parts.length < 3) return null;
  const group = parts[0].replace(/\./g, '/');
  const artifact = parts[1];
  const version = parts[2];
  let classif = classifier;
  let ext = 'jar';

  if (!classif && parts[3]) {
    const sub = parts[3].split('@');
    classif = sub[0];
    if (sub[1]) ext = sub[1];
  }

  let cleanVer = version;
  if (version.includes('@')) {
    const vParts = version.split('@');
    cleanVer = vParts[0];
    ext = vParts[1] || 'jar';
  }

  const suffix = classif ? `-${classif}` : '';
  return `${group}/${artifact}/${cleanVer}/${artifact}-${cleanVer}${suffix}.${ext}`;
}

/**
 * Checks OS rules for Minecraft libraries (Windows focus)
 */
function isLibraryAllowed(lib) {
  if (!lib.rules || !lib.rules.length) return true;
  let allowed = false;
  for (const rule of lib.rules) {
    if (rule.action === 'allow') {
      if (!rule.os || rule.os.name === 'windows') allowed = true;
    } else if (rule.action === 'disallow') {
      if (!rule.os || rule.os.name === 'windows') allowed = false;
    }
  }
  return allowed;
}

/**
 * Unzips native jar files into the natives folder
 */
export async function extractNativesJar(jarPath, nativesDir) {
  try {
    if (!fs.existsSync(nativesDir)) {
      fs.mkdirSync(nativesDir, { recursive: true });
    }
    // High-speed extraction with tar
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    try {
      await execFileAsync('tar', ['-xf', jarPath, '--exclude=META-INF', '-C', nativesDir]);
      return;
    } catch {}

    // Buffer parsing fallback
    const buf = fs.readFileSync(jarPath);
    let offset = 0;
    while (offset < buf.length - 30) {
      if (buf.readUInt32LE(offset) !== 0x04034b50) {
        offset++;
        continue;
      }
      const compression = buf.readUInt16LE(offset + 8);
      const compressedSize = buf.readUInt32LE(offset + 18);
      const nameLen = buf.readUInt16LE(offset + 26);
      const extraLen = buf.readUInt16LE(offset + 28);
      const name = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
      const dataOffset = offset + 30 + nameLen + extraLen;

      if (!name.endsWith('/') && !name.startsWith('META-INF/') && (name.endsWith('.dll') || name.endsWith('.so') || name.endsWith('.dylib'))) {
        const compressedData = buf.subarray(dataOffset, dataOffset + compressedSize);
        let decompressed = null;
        if (compression === 0) decompressed = compressedData;
        else if (compression === 8) {
          try { decompressed = zlib.inflateRawSync(compressedData); } catch {}
        }

        if (decompressed) {
          const outPath = path.join(nativesDir, path.basename(name));
          fs.writeFileSync(outPath, decompressed);
        }
      }
      offset = dataOffset + compressedSize;
    }
  } catch (err) {
    console.warn('Failed to extract natives from jar:', jarPath, err);
  }
}

/**
 * Ensures a library (artifact or maven-based) and its natives are downloaded
 */
export async function ensureLibrary(lib, instancesPath, nativesDir = null, defaultMavenUrl = 'https://libraries.minecraft.net/') {
  if (!lib || !isLibraryAllowed(lib)) return null;

  let downloadedPath = null;

  // 1. Artifact library
  if (lib.downloads?.artifact?.url && lib.downloads.artifact.path) {
    const dest = path.join(instancesPath, 'libraries', lib.downloads.artifact.path);
    if (!fs.existsSync(dest)) {
      try {
        await downloadFile(lib.downloads.artifact.url, dest);
      } catch (err) {
        console.warn('Artifact download error:', lib.name, err);
      }
    }
    if (fs.existsSync(dest)) downloadedPath = dest;
  } else if (lib.name) {
    // 2. Maven coordinate library
    const relPath = mavenCoordinateToPath(lib.name);
    if (relPath) {
      const dest = path.join(instancesPath, 'libraries', relPath);
      if (!fs.existsSync(dest)) {
        const baseUrl = lib.url || defaultMavenUrl;
        const fullUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${relPath}`;
        try {
          await downloadFile(fullUrl, dest);
        } catch {
          try {
            await downloadFile(`https://libraries.minecraft.net/${relPath}`, dest);
          } catch {
            try {
              await downloadFile(`https://repo1.maven.org/maven2/${relPath}`, dest);
            } catch {}
          }
        }
      }
      if (fs.existsSync(dest)) downloadedPath = dest;
    }
  }

  // 3. Natives
  if (nativesDir) {
    const nativesClassifier = lib.downloads?.classifiers?.['natives-windows'] ||
      (lib.natives?.windows && lib.downloads?.classifiers?.[lib.natives.windows.replace('${arch}', '64')]);

    if (nativesClassifier?.url) {
      const nativeJarPath = path.join(instancesPath, 'libraries', nativesClassifier.path || `natives-${lib.name.replace(/[:]/g, '_')}.jar`);
      try {
        if (!fs.existsSync(nativeJarPath)) {
          await downloadFile(nativesClassifier.url, nativeJarPath);
        }
        await extractNativesJar(nativeJarPath, nativesDir);
      } catch (err) {
        console.warn('Natives download error:', lib.name, err);
      }
    } else if (lib.natives?.windows) {
      const classifier = lib.natives.windows.replace('${arch}', '64');
      const relPath = mavenCoordinateToPath(lib.name, classifier);
      if (relPath) {
        const nativeJarPath = path.join(instancesPath, 'libraries', relPath);
        const baseUrl = lib.url || defaultMavenUrl;
        const fullUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${relPath}`;
        try {
          if (!fs.existsSync(nativeJarPath)) {
            await downloadFile(fullUrl, nativeJarPath);
          }
          if (fs.existsSync(nativeJarPath)) {
            await extractNativesJar(nativeJarPath, nativesDir);
          }
        } catch (err) {
          console.warn('Legacy natives download error:', lib.name, err);
        }
      }
    }
  }

  return downloadedPath;
}

/**
 * Downloads and configures Fabric loader
 */
export async function setupFabricLoader({ instancesPath, version }, onProgress) {
  onProgress({ percent: 92, phase: 'fabric', message: `Получение версии Fabric для ${version}...` });
  const fabricMetaRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`, {
    headers: { 'User-Agent': 'ELauncher/1.0.0' },
  });
  if (!fabricMetaRes.ok) throw new Error(`Fabric не найден для версии ${version}`);
  const fabricVersions = await fabricMetaRes.json();
  if (!fabricVersions || !fabricVersions.length) throw new Error(`Нет доступных загрузчиков Fabric для ${version}`);
  const loaderVer = fabricVersions[0].loader.version;

  onProgress({ percent: 94, phase: 'fabric', message: `Загрузка профиля Fabric ${loaderVer}...` });
  const profileRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVer}/profile/json`, {
    headers: { 'User-Agent': 'ELauncher/1.0.0' },
  });
  if (!profileRes.ok) throw new Error(`Не удалось загрузить профиль Fabric`);
  const profileData = await profileRes.json();

  const fabricDir = path.join(instancesPath, 'versions', `${version}-fabric`);
  fs.mkdirSync(fabricDir, { recursive: true });
  fs.writeFileSync(path.join(fabricDir, `${version}-fabric.json`), JSON.stringify(profileData, null, 2));

  // Download fabric libraries
  const libs = profileData.libraries || [];
  let dCount = 0;
  for (const fLib of libs) {
    await ensureLibrary(fLib, instancesPath, null, 'https://maven.fabricmc.net/');
    dCount++;
    onProgress({
      percent: 94 + Math.round((dCount / Math.max(1, libs.length)) * 5),
      phase: 'fabric',
      message: `Библиотеки Fabric (${dCount}/${libs.length})...`
    });
  }
  return profileData;
}

/**
 * Downloads and configures Forge loader (supports 1.2.5 up to 1.20.1)
 */
export async function setupForgeLoader({ instancesPath, version }, onProgress) {
  onProgress({ percent: 91, phase: 'forge', message: `Поиск совместимой версии Forge для ${version}...` });
  const promoRes = await fetch('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json', {
    headers: { 'User-Agent': 'ELauncher/1.0.0' },
  });
  if (!promoRes.ok) throw new Error('Не удалось получить список версий Forge');
  const promoData = await promoRes.json();
  const promos = promoData.promos || {};
  const forgeVer = promos[`${version}-recommended`] || promos[`${version}-latest`];
  if (!forgeVer) {
    throw new Error(`Для версии Minecraft ${version} не найден подходящий релиз Forge.`);
  }

  const forgeFullId = `${version}-${forgeVer}`;
  const forgeDir = path.join(instancesPath, 'versions', `${version}-forge`);
  fs.mkdirSync(forgeDir, { recursive: true });

  onProgress({ percent: 93, phase: 'forge', message: `Скачивание Forge ${forgeVer}...` });
  const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeFullId}/forge-${forgeFullId}-installer.jar`;
  const tempInstaller = path.join(forgeDir, `forge-${forgeFullId}-installer.jar`);

  await downloadFile(installerUrl, tempInstaller);

  onProgress({ percent: 95, phase: 'forge', message: `Извлечение профиля Forge...` });
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  try {
    await execFileAsync('tar', ['-xf', tempInstaller, 'version.json'], { cwd: forgeDir });
  } catch {
    try {
      await execFileAsync('powershell', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${tempInstaller.replace(/'/g, "''")}' -DestinationPath '${forgeDir.replace(/'/g, "''")}' -Force`
      ]);
    } catch {}
  }

  const extractedVersionJson = path.join(forgeDir, 'version.json');
  const targetForgeJson = path.join(forgeDir, `${version}-forge.json`);
  let forgeProfileData = null;

  if (fs.existsSync(extractedVersionJson)) {
    forgeProfileData = JSON.parse(fs.readFileSync(extractedVersionJson, 'utf8'));
    fs.renameSync(extractedVersionJson, targetForgeJson);
  } else {
    forgeProfileData = {
      id: `${version}-forge`,
      inheritsFrom: version,
      mainClass: 'net.minecraft.launchwrapper.Launch',
      libraries: [
        {
          name: `net.minecraftforge:forge:${forgeFullId}:universal`,
          url: 'https://maven.minecraftforge.net/'
        }
      ]
    };
    fs.writeFileSync(targetForgeJson, JSON.stringify(forgeProfileData, null, 2));
  }

  // Universal jar
  const universalJarDest = path.join(instancesPath, 'libraries', 'net', 'minecraftforge', 'forge', forgeFullId, `forge-${forgeFullId}-universal.jar`);
  if (!fs.existsSync(universalJarDest)) {
    try {
      await downloadFile(`https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeFullId}/forge-${forgeFullId}-universal.jar`, universalJarDest);
    } catch {}
  }

  // Download forge libraries
  const libs = forgeProfileData.libraries || [];
  let dCount = 0;
  for (const lib of libs) {
    await ensureLibrary(lib, instancesPath, null, 'https://maven.minecraftforge.net/');
    dCount++;
    onProgress({
      percent: 95 + Math.round((dCount / Math.max(1, libs.length)) * 4),
      phase: 'forge',
      message: `Библиотеки Forge (${dCount}/${libs.length})...`
    });
  }

  try { fs.unlinkSync(tempInstaller); } catch {}
  return forgeProfileData;
}

/**
 * Downloads and configures NeoForge loader (supports 1.20.2+)
 */
export async function setupNeoForgeLoader({ instancesPath, version }, onProgress) {
  onProgress({ percent: 91, phase: 'neoforge', message: `Поиск версии NeoForge для ${version}...` });
  const metaRes = await fetch('https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge', {
    headers: { 'User-Agent': 'ELauncher/1.0.0' },
  });
  if (!metaRes.ok) throw new Error('Не удалось получить список версий NeoForge');
  const metaData = await metaRes.json();
  const versions = metaData.versions || [];

  const m = version.match(/^1\.(\d+)(?:\.(\d+))?/);
  let prefix = '';
  if (m) {
    prefix = `${m[1]}.${m[2] || '0'}.`;
  } else if (version.startsWith('26.')) {
    prefix = '26.';
  } else {
    prefix = version + '.';
  }

  const matches = versions.filter((v) => v.startsWith(prefix));
  if (!matches.length) {
    throw new Error(`Для версии Minecraft ${version} не найден подходящий релиз NeoForge.`);
  }

  const neoVer = matches[matches.length - 1];
  const neoDir = path.join(instancesPath, 'versions', `${version}-neoforge`);
  fs.mkdirSync(neoDir, { recursive: true });

  onProgress({ percent: 93, phase: 'neoforge', message: `Скачивание NeoForge ${neoVer}...` });
  const installerUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVer}/neoforge-${neoVer}-installer.jar`;
  const tempInstaller = path.join(neoDir, `neoforge-${neoVer}-installer.jar`);

  await downloadFile(installerUrl, tempInstaller);

  onProgress({ percent: 95, phase: 'neoforge', message: `Извлечение профиля NeoForge...` });
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  try {
    await execFileAsync('tar', ['-xf', tempInstaller, 'version.json'], { cwd: neoDir });
  } catch {
    try {
      await execFileAsync('powershell', [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${tempInstaller.replace(/'/g, "''")}' -DestinationPath '${neoDir.replace(/'/g, "''")}' -Force`
      ]);
    } catch {}
  }

  const extractedVersionJson = path.join(neoDir, 'version.json');
  const targetNeoJson = path.join(neoDir, `${version}-neoforge.json`);
  let neoProfileData = null;

  if (fs.existsSync(extractedVersionJson)) {
    neoProfileData = JSON.parse(fs.readFileSync(extractedVersionJson, 'utf8'));
    fs.renameSync(extractedVersionJson, targetNeoJson);
  } else {
    neoProfileData = {
      id: `${version}-neoforge`,
      inheritsFrom: version,
      mainClass: 'cpw.mods.bootstraplauncher.BootstrapLauncher',
      libraries: [
        {
          name: `net.neoforged:neoforge:${neoVer}:universal`,
          url: 'https://maven.neoforged.net/releases/'
        }
      ]
    };
    fs.writeFileSync(targetNeoJson, JSON.stringify(neoProfileData, null, 2));
  }

  // Universal jar
  const universalJarDest = path.join(instancesPath, 'libraries', 'net', 'neoforged', 'neoforge', neoVer, `neoforge-${neoVer}-universal.jar`);
  if (!fs.existsSync(universalJarDest)) {
    try {
      await downloadFile(`https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVer}/neoforge-${neoVer}-universal.jar`, universalJarDest);
    } catch {}
  }

  // Download neoforge libraries
  const libs = neoProfileData.libraries || [];
  let dCount = 0;
  for (const lib of libs) {
    await ensureLibrary(lib, instancesPath, null, 'https://maven.neoforged.net/releases/');
    dCount++;
    onProgress({
      percent: 95 + Math.round((dCount / Math.max(1, libs.length)) * 4),
      phase: 'neoforge',
      message: `Библиотеки NeoForge (${dCount}/${libs.length})...`
    });
  }

  try { fs.unlinkSync(tempInstaller); } catch {}
  return neoProfileData;
}

/**
 * Universal game argument evaluator across ancient, legacy, and modern versions
 */
export function resolveMinecraftGameArguments(versionData, templateVars) {
  const replaceVars = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      return templateVars[key] !== undefined ? String(templateVars[key]) : '';
    });
  };

  const isRuleAllowed = (rule) => {
    if (!rule) return true;
    if (rule.action === 'disallow') {
      if (rule.os && rule.os.name !== 'windows') return true;
      if (rule.features) return true;
      return false;
    }
    if (rule.action === 'allow') {
      if (rule.os && rule.os.name !== 'windows') return false;
      if (rule.features) {
        // Disallow demo, custom resolution, and quickPlay unless specifically requested
        if (rule.features.is_demo_user) return false;
        if (rule.features.has_custom_resolution) return false;
        if (rule.features.has_quick_plays_support) return false;
        if (rule.features.is_quick_play_singleplayer) return false;
        if (rule.features.is_quick_play_multiplayer) return false;
        if (rule.features.is_quick_play_realms) return false;
      }
      return true;
    }
    return true;
  };

  const areRulesAllowed = (rules) => {
    if (!rules || !rules.length) return true;
    for (const r of rules) {
      if (!isRuleAllowed(r)) return false;
    }
    return true;
  };

  const args = [];

  // 1. Modern arguments format (1.13+)
  if (versionData?.arguments?.game && Array.isArray(versionData.arguments.game)) {
    const rawTokens = [];
    for (const item of versionData.arguments.game) {
      if (typeof item === 'string') {
        rawTokens.push(item);
      } else if (item && typeof item === 'object') {
        if (areRulesAllowed(item.rules)) {
          if (typeof item.value === 'string') {
            rawTokens.push(item.value);
          } else if (Array.isArray(item.value)) {
            for (const v of item.value) {
              if (typeof v === 'string') rawTokens.push(v);
            }
          }
        }
      }
    }

    // Process tokens and filter out empty paired flags like [--clientId, ''] or [--xuid, '']
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (token.startsWith('--') && i + 1 < rawTokens.length && !rawTokens[i + 1].startsWith('--')) {
        const nextVal = replaceVars(rawTokens[i + 1]).trim();
        if (nextVal) {
          args.push(token, nextVal);
        }
        i++; // skip next
      } else {
        const val = replaceVars(token).trim();
        if (val) args.push(val);
      }
    }
  } else if (versionData?.minecraftArguments && typeof versionData.minecraftArguments === 'string') {
    // 2. Legacy / Ancient format (1.12.2 and older, b1.7.3, etc.)
    const replaced = replaceVars(versionData.minecraftArguments);
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    let match;
    while ((match = regex.exec(replaced)) !== null) {
      const token = match[1] ?? match[2] ?? match[0];
      if (token) args.push(token);
    }
  } else {
    // 3. Fallback default arguments
    args.push(
      '--username', templateVars.auth_player_name || 'Player',
      '--version', templateVars.version_name || '1.20.4',
      '--gameDir', templateVars.game_directory,
      '--assetsDir', templateVars.assets_root,
      '--assetIndex', templateVars.assets_index_name,
      '--uuid', templateVars.auth_uuid,
      '--accessToken', templateVars.auth_access_token || '0',
      '--userType', templateVars.user_type || 'legacy',
      '--versionType', templateVars.version_type || 'ELauncher'
    );
  }

  return args;
}

/**
 * Full Minecraft Version Downloader with progress streaming
 */
export async function downloadMinecraftVersion({ instancesPath, version, loader }, onProgress) {
  if (!version || typeof version !== 'string' || !version.trim()) {
    throw new Error('Версия Minecraft не указана. Выберите версию в профиле.');
  }

  const effectiveInstances = (instancesPath && typeof instancesPath === 'string' && instancesPath.trim())
    ? instancesPath.trim()
    : getDefaultInstancesPath();

  onProgress({ percent: 5, phase: 'manifest', message: `Получение манифеста версий Mojang...` });

  // 1. Fetch Mojang version manifest
  const manifestRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json', {
    headers: { 'User-Agent': 'ELauncher/1.0.0' },
  });
  if (!manifestRes.ok) throw new Error('Failed to fetch Mojang version manifest');
  const manifest = await manifestRes.json();

  const versionEntry = manifest.versions.find((v) => v.id === version);
  if (!versionEntry) {
    throw new Error(`Версия «${version}» не найдена в официальном манифесте Mojang. Проверьте номер версии (например: 1.21.4, 1.21.1, 1.20.4).`);
  }

  onProgress({ percent: 12, phase: 'version_json', message: `Загрузка конфигурации Minecraft ${version}...` });

  // 2. Fetch specific version package JSON
  const versionRes = await fetch(versionEntry.url, {
    headers: { 'User-Agent': 'ELauncher/1.0.0' },
  });
  if (!versionRes.ok) throw new Error(`Failed to fetch version package JSON for ${version}`);
  const versionData = await versionRes.json();

  const versionDir = path.join(effectiveInstances, 'versions', version);
  fs.mkdirSync(versionDir, { recursive: true });
  fs.writeFileSync(path.join(versionDir, `${version}.json`), JSON.stringify(versionData, null, 2));

  // 3. Download Client JAR
  const clientDownload = versionData.downloads?.client;
  if (!clientDownload?.url) throw new Error('No client.jar download found in version data');

  const clientJarPath = path.join(versionDir, `${version}.jar`);
  onProgress({ percent: 20, phase: 'client_jar', message: `Скачивание client.jar (${version})...` });
  await downloadFile(clientDownload.url, clientJarPath);

  // 4. Download Libraries & Natives
  const libraries = (versionData.libraries || []).filter(isLibraryAllowed);
  const nativesDir = path.join(versionDir, 'natives');
  fs.mkdirSync(nativesDir, { recursive: true });

  const totalLibs = libraries.length;
  let downloadedLibs = 0;

  for (const lib of libraries) {
    await ensureLibrary(lib, effectiveInstances, nativesDir);
    downloadedLibs++;
    const libPercent = 25 + Math.round((downloadedLibs / Math.max(1, totalLibs)) * 35);
    onProgress({
      percent: libPercent,
      phase: 'libraries',
      message: `Библиотеки (${downloadedLibs}/${totalLibs}): ${lib.name?.split(':')?.slice(0, 2)?.join(':') || 'lib'}`,
    });
  }

  // 5. Download Asset Index & Game Assets
  if (versionData.assetIndex?.url) {
    onProgress({ percent: 65, phase: 'assets_index', message: `Получение индекса ассетов (${versionData.assetIndex.id})...` });
    const indexDir = path.join(effectiveInstances, 'assets', 'indexes');
    const indexPath = path.join(indexDir, `${versionData.assetIndex.id}.json`);
    await downloadFile(versionData.assetIndex.url, indexPath);

    const assetIndexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const objects = assetIndexData.objects || {};
    const objectEntries = Object.entries(objects);
    const totalAssets = objectEntries.length;

    const chunkSize = 25;
    let completedAssets = 0;

    for (let i = 0; i < objectEntries.length; i += chunkSize) {
      const chunk = objectEntries.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async ([, obj]) => {
          const hash = obj.hash;
          const prefix = hash.substring(0, 2);
          const objPath = path.join(effectiveInstances, 'assets', 'objects', prefix, hash);
          if (!fs.existsSync(objPath)) {
            const assetUrl = `https://resources.download.minecraft.net/${prefix}/${hash}`;
            try {
              await downloadFile(assetUrl, objPath);
            } catch {}
          }
          completedAssets++;
        })
      );

      const assetPercent = 65 + Math.round((completedAssets / Math.max(1, totalAssets)) * 25);
      if (completedAssets % 100 === 0 || completedAssets >= totalAssets) {
        onProgress({
          percent: assetPercent,
          phase: 'assets',
          message: `Скачивание ассетов (${completedAssets}/${totalAssets})...`,
        });
      }
    }
  }

  // 6. Handle Mod Loader if requested
  const ldr = (loader || 'Vanilla').toLowerCase();
  if (ldr === 'fabric') {
    await setupFabricLoader({ instancesPath: effectiveInstances, version }, onProgress);
  } else if (ldr === 'forge') {
    await setupForgeLoader({ instancesPath: effectiveInstances, version }, onProgress);
  } else if (ldr === 'neoforge') {
    await setupNeoForgeLoader({ instancesPath: effectiveInstances, version }, onProgress);
  }

  onProgress({ percent: 100, phase: 'done', message: `Minecraft ${version} (${loader || 'Vanilla'}) успешно установлен!` });
  return true;
}

/**
 * Automatically finds Java executable on system
 */
export function findSystemJava(customPath, targetMajor) {
  if (customPath && typeof customPath === 'string' && customPath.trim()) {
    const trimmed = customPath.trim();
    if (fs.existsSync(trimmed)) {
      try {
        const stat = fs.statSync(trimmed);
        if (stat.isFile()) {
          return trimmed;
        }
        if (stat.isDirectory()) {
          const binW = path.join(trimmed, 'bin', 'javaw.exe');
          const binJ = path.join(trimmed, 'bin', 'java.exe');
          const directW = path.join(trimmed, 'javaw.exe');
          const directJ = path.join(trimmed, 'java.exe');
          if (fs.existsSync(binW)) return binW;
          if (fs.existsSync(binJ)) return binJ;
          if (fs.existsSync(directW)) return directW;
          if (fs.existsSync(directJ)) return directJ;
        }
      } catch {}
      return trimmed;
    }
  }

  const javas = detectSystemJavas();
  if (javas.length > 0) {
    if (targetMajor) {
      const match = javas.find((j) => j.major === targetMajor)
        || javas.filter((j) => j.major >= targetMajor).sort((a, b) => a.major - b.major)[0]
        || javas[0];
      if (match) return match.path;
    }
    return javas[0].path;
  }

  return 'java'; // Fallback to PATH
}

/**
 * Generates an offline player UUID compliant with Java UUID.nameUUIDFromBytes
 */
export function generateOfflineUUID(username) {
  const clean = (username || 'Player').trim();
  const md5 = crypto.createHash('md5').update('OfflinePlayer:' + clean).digest();
  md5[6] = (md5[6] & 0x0f) | 0x30; // Version 3
  md5[8] = (md5[8] & 0x3f) | 0x80; // IETF variant
  return md5.toString('hex');
}

/**
 * Downloads and caches official authlib-injector for Ely.by
 */
export async function ensureAuthlibInjector({ launcherPath, instancesPath }) {
  const baseDir = (launcherPath && typeof launcherPath === 'string' && launcherPath.trim())
    ? launcherPath.trim()
    : ((instancesPath && typeof instancesPath === 'string' && instancesPath.trim()) ? instancesPath.trim() : getDefaultLauncherPath());
  const toolsDir = path.join(baseDir, 'tools');
  fs.mkdirSync(toolsDir, { recursive: true });
  const jarPath = path.join(toolsDir, 'authlib-injector.jar');

  if (fs.existsSync(jarPath) && fs.statSync(jarPath).size > 100000) {
    return jarPath;
  }

  const downloadUrl = 'https://github.com/yushijinhun/authlib-injector/releases/download/v1.2.8/authlib-injector-1.2.8.jar';
  try {
    await downloadFile(downloadUrl, jarPath);
    if (fs.existsSync(jarPath) && fs.statSync(jarPath).size > 100000) {
      return jarPath;
    }
  } catch (err) {
    console.warn('Failed to download authlib-injector:', err);
  }

  return fs.existsSync(jarPath) ? jarPath : null;
}

/**
 * Determines pack_format for Minecraft resourcepack across versions
 */
export function getPackFormatForVersion(version) {
  if (!version) return 15;
  const match = String(version).match(/^1\.(\d+)(?:\.(\d+))?/);
  if (!match) return 15;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2] || '0', 10);

  if (major <= 8) return 1;
  if (major <= 10) return 2;
  if (major <= 12) return 3;
  if (major <= 14) return 4;
  if (major === 15) return 5;
  if (major === 16) return minor <= 1 ? 5 : 6;
  if (major === 17) return 7;
  if (major === 18) return 8;
  if (major === 19) return 9;
  if (major === 20) {
    if (minor <= 1) return 15;
    if (minor === 2) return 18;
    if (minor <= 4) return 22;
    return 32;
  }
  if (major === 21) {
    if (minor <= 1) return 34;
    return 42;
  }
  return 42;
}

/**
 * Resolves skin PNG bytes from Base64 Data URL, remote URL, or local file
 */
export async function getSkinPngBuffer(skinDataUrl) {
  if (!skinDataUrl) return null;
  if (skinDataUrl.startsWith('data:image/')) {
    const base64Data = skinDataUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }
  if (skinDataUrl.startsWith('http://') || skinDataUrl.startsWith('https://')) {
    return new Promise((resolve) => {
      const client = skinDataUrl.startsWith('https') ? https : http;
      client.get(skinDataUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return getSkinPngBuffer(res.headers.location).then(resolve);
        }
        if (res.statusCode !== 200) return resolve(null);
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      }).on('error', () => resolve(null));
    });
  }
  if (fs.existsSync(skinDataUrl)) {
    return fs.readFileSync(skinDataUrl);
  }
  return null;
}

/**
 * Sets up system-level skin assets directly on the engine classpath (not visible in Resource Packs UI)
 */
export async function setupSystemSkinClasspath({ launcherPath, skinDataUrl, skinModel = 'classic' }) {
  if (!skinDataUrl) return null;
  const skinBuffer = await getSkinPngBuffer(skinDataUrl);
  if (!skinBuffer || skinBuffer.length < 50) return null;

  const baseDir = launcherPath || getDefaultLauncherPath();
  const skinCpDir = path.join(baseDir, 'tools', 'system-skin');
  const entityDir = path.join(skinCpDir, 'assets', 'minecraft', 'textures', 'entity');
  const playerDir = path.join(entityDir, 'player');
  const playerWideDir = path.join(playerDir, 'wide');
  const playerSlimDir = path.join(playerDir, 'slim');

  fs.mkdirSync(entityDir, { recursive: true });
  fs.mkdirSync(playerDir, { recursive: true });
  fs.mkdirSync(playerWideDir, { recursive: true });
  fs.mkdirSync(playerSlimDir, { recursive: true });

  // Older Minecraft versions (1.6 - 1.19)
  fs.writeFileSync(path.join(entityDir, 'steve.png'), skinBuffer);
  fs.writeFileSync(path.join(entityDir, 'alex.png'), skinBuffer);

  // All 9 default character models in Minecraft 1.20+ (steve, alex, ari, efe, kai, makena, noor, sunny, zuri)
  const defaultModels = [
    'steve.png',
    'alex.png',
    'ari.png',
    'efe.png',
    'kai.png',
    'makena.png',
    'noor.png',
    'sunny.png',
    'zuri.png',
  ];

  for (const model of defaultModels) {
    fs.writeFileSync(path.join(playerWideDir, model), skinBuffer);
    fs.writeFileSync(path.join(playerSlimDir, model), skinBuffer);
    fs.writeFileSync(path.join(playerDir, model), skinBuffer);
  }

  // pack.mcmeta for Minecraft Vanilla & Fabric resource manager detection
  try {
    const mcmeta = {
      pack: {
        pack_format: 42,
        description: 'ELauncher System Character Textures',
      },
    };
    fs.writeFileSync(path.join(skinCpDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2));
  } catch {}

  return skinCpDir;
}

/**
 * Removes custom skin pack from instance and cleans up options.txt
 */
export function removeCustomSkinPack(instanceDir) {
  const packDir = path.join(instanceDir, 'resourcepacks', 'ELauncher_Skin');
  if (fs.existsSync(packDir)) {
    try {
      fs.rmSync(packDir, { recursive: true, force: true });
    } catch {}
  }
  const optionsPath = path.join(instanceDir, 'options.txt');
  if (fs.existsSync(optionsPath)) {
    try {
      const content = fs.readFileSync(optionsPath, 'utf8');
      if (content.includes('ELauncher_Skin')) {
        const cleaned = content.split(/\r?\n/).map((line) => {
          if (line.startsWith('resourcePacks:')) {
            try {
              const packs = JSON.parse(line.substring('resourcePacks:'.length).trim());
              if (Array.isArray(packs)) {
                const filtered = packs.filter((p) => !p.includes('ELauncher_Skin'));
                return `resourcePacks:${JSON.stringify(filtered)}`;
              }
            } catch {}
          }
          return line;
        }).join('\n');
        fs.writeFileSync(optionsPath, cleaned, 'utf8');
      }
    } catch {}
  }
}

/**
 * Installs a resource pack that overrides the default player skin textures.
 * Works for ALL Minecraft versions (1.7 - 1.21+) without mods.
 * The pack is placed in <instanceDir>/resourcepacks/ELauncher_Skin/ and activated
 * via options.txt so Minecraft loads it on startup.
 */
export async function installSkinResourcePack({ instanceDir, skinDataUrl, skinModel = 'classic', version = '1.20' }) {
  if (!skinDataUrl) return false;
  const skinBuffer = await getSkinPngBuffer(skinDataUrl);
  if (!skinBuffer || skinBuffer.length < 50) return false;

  const packDir = path.join(instanceDir, 'resourcepacks', 'ELauncher_Skin');
  const texturesDir = path.join(packDir, 'assets', 'minecraft', 'textures');
  const entityDir = path.join(texturesDir, 'entity');
  const playerDir = path.join(entityDir, 'player');
  const playerWideDir = path.join(playerDir, 'wide');
  const playerSlimDir = path.join(playerDir, 'slim');

  fs.mkdirSync(playerWideDir, { recursive: true });
  fs.mkdirSync(playerSlimDir, { recursive: true });
  fs.mkdirSync(entityDir, { recursive: true });

  // Legacy paths (1.7 – 1.19): assets/minecraft/textures/entity/steve.png / alex.png
  fs.writeFileSync(path.join(entityDir, 'steve.png'), skinBuffer);
  fs.writeFileSync(path.join(entityDir, 'alex.png'), skinBuffer);

  // Modern paths (1.20+): wide/ and slim/ sub-directories with all 9 model names
  const allModels = ['steve.png', 'alex.png', 'ari.png', 'efe.png', 'kai.png', 'makena.png', 'noor.png', 'sunny.png', 'zuri.png'];
  for (const m of allModels) {
    fs.writeFileSync(path.join(playerWideDir, m), skinBuffer);
    fs.writeFileSync(path.join(playerSlimDir, m), skinBuffer);
    fs.writeFileSync(path.join(playerDir, m), skinBuffer);
  }

  // pack.mcmeta required by Minecraft to recognise this as a valid resource pack
  const packFormat = getPackFormatForVersion(version);
  const mcmeta = { pack: { pack_format: packFormat, description: 'ELauncher Player Skin' } };
  fs.writeFileSync(path.join(packDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2));

  // Activate the pack in options.txt so it loads without requiring user action
  const optionsPath = path.join(instanceDir, 'options.txt');
  try {
    let lines = [];
    if (fs.existsSync(optionsPath)) {
      lines = fs.readFileSync(optionsPath, 'utf8').split(/\r?\n/);
    }
    let found = false;
    lines = lines.map((line) => {
      if (line.startsWith('resourcePacks:')) {
        found = true;
        try {
          const packs = JSON.parse(line.substring('resourcePacks:'.length).trim());
          if (Array.isArray(packs)) {
            const cleaned = packs.filter((p) => !p.includes('ELauncher_Skin'));
            cleaned.unshift('file/ELauncher_Skin');
            return `resourcePacks:${JSON.stringify(cleaned)}`;
          }
        } catch {}
        return `resourcePacks:["file/ELauncher_Skin"]`;
      }
      return line;
    });
    if (!found) {
      lines.push(`resourcePacks:["file/ELauncher_Skin"]`);
    }
    fs.writeFileSync(optionsPath, lines.join('\n'), 'utf8');
  } catch {}

  return true;
}

/**
 * Simple parser for Minecraft servers.dat (NBT format)
 */
function parseServersDat(buf) {
  if (!buf || buf.length < 3 || buf[0] !== 0x0a) return [];
  try {
    let pos = 1;
    const nameLen = buf.readUInt16BE(pos);
    pos += 2 + nameLen;
    const servers = [];
    while (pos < buf.length) {
      const tagType = buf[pos++];
      if (tagType === 0) break;
      const keyLen = buf.readUInt16BE(pos);
      pos += 2;
      const key = buf.toString('utf8', pos, pos + keyLen);
      pos += keyLen;
      if (key === 'servers' && tagType === 9) {
        const itemType = buf[pos++];
        const count = buf.readInt32BE(pos);
        pos += 4;
        for (let i = 0; i < count; i++) {
          const s = {};
          while (pos < buf.length) {
            const subType = buf[pos++];
            if (subType === 0) break;
            const subKeyLen = buf.readUInt16BE(pos);
            pos += 2;
            const subKey = buf.toString('utf8', pos, pos + subKeyLen);
            pos += subKeyLen;
            if (subType === 8) {
              const strLen = buf.readUInt16BE(pos);
              pos += 2;
              s[subKey] = buf.toString('utf8', pos, pos + strLen);
              pos += strLen;
            } else if (subType === 1) {
              s[subKey] = { __type: 1, val: buf.readInt8(pos++) };
            } else if (subType === 2) {
              s[subKey] = { __type: 2, val: buf.readInt16BE(pos) };
              pos += 2;
            } else if (subType === 3) {
              s[subKey] = { __type: 3, val: buf.readInt32BE(pos) };
              pos += 4;
            } else if (subType === 4) {
              s[subKey] = { __type: 4, val: buf.subarray(pos, pos + 8) };
              pos += 8;
            }
          }
          if (s.ip) {
            servers.push(s);
          }
        }
      }
    }
    return servers;
  } catch (err) {
    console.warn('Failed to parse servers.dat:', err);
    return [];
  }
}

/**
 * Writes Minecraft servers list back into binary servers.dat (NBT format)
 */
function writeServersDat(servers) {
  const chunks = [];
  chunks.push(Buffer.from([0x0a])); // root TAG_Compound
  chunks.push(Buffer.from([0x00, 0x00])); // root name ''

  chunks.push(Buffer.from([0x09])); // TAG_List
  const name = Buffer.from('servers', 'utf8');
  const nameLen = Buffer.alloc(2);
  nameLen.writeUInt16BE(name.length, 0);
  chunks.push(nameLen, name);

  chunks.push(Buffer.from([0x0a])); // List item type: TAG_Compound
  const countBuf = Buffer.alloc(4);
  countBuf.writeInt32BE(servers.length, 0);
  chunks.push(countBuf);

  for (const s of servers) {
    for (const [k, v] of Object.entries(s)) {
      const kBuf = Buffer.from(k, 'utf8');
      const kLen = Buffer.alloc(2);
      kLen.writeUInt16BE(kBuf.length, 0);

      if (typeof v === 'string') {
        chunks.push(Buffer.from([0x08])); // TAG_String
        chunks.push(kLen, kBuf);
        const vBuf = Buffer.from(v, 'utf8');
        const vLen = Buffer.alloc(2);
        vLen.writeUInt16BE(vBuf.length, 0);
        chunks.push(vLen, vBuf);
      } else if (v && typeof v === 'object' && v.__type) {
        if (v.__type === 1) {
          chunks.push(Buffer.from([0x01]), kLen, kBuf, Buffer.from([v.val & 0xff]));
        } else if (v.__type === 2) {
          const b = Buffer.alloc(2);
          b.writeInt16BE(v.val, 0);
          chunks.push(Buffer.from([0x02]), kLen, kBuf, b);
        } else if (v.__type === 3) {
          const b = Buffer.alloc(4);
          b.writeInt32BE(v.val, 0);
          chunks.push(Buffer.from([0x03]), kLen, kBuf, b);
        } else if (v.__type === 4) {
          chunks.push(Buffer.from([0x04]), kLen, kBuf, v.val);
        }
      }
    }
    chunks.push(Buffer.from([0x00])); // TAG_End for Compound item
  }

  chunks.push(Buffer.from([0x00])); // TAG_End for root
  return Buffer.concat(chunks);
}

function normalizeServerKey(s) {
  if (!s || !s.ip) return '';
  return String(s.ip).trim().toLowerCase();
}

function mergeServersLists(baseList, incomingList) {
  const map = new Map();
  for (const s of baseList) {
    const key = normalizeServerKey(s);
    if (key) map.set(key, s);
  }
  for (const s of incomingList) {
    const key = normalizeServerKey(s);
    if (key) {
      if (map.has(key)) {
        const existing = map.get(key);
        // keep richer metadata and updated title
        map.set(key, { ...existing, ...s });
      } else {
        map.set(key, s);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Synchronizes servers.dat across all instances and shared profile
 */
export function syncGlobalServersBeforeLaunch({ instancesPath, instanceDir }) {
  try {
    const sharedServerCandidates = [
      path.join(instancesPath, 'shared_servers.dat'),
      path.join(instancesPath, 'servers.dat'),
    ];

    let sharedServers = [];
    const primarySharedPath = path.join(instancesPath, 'shared_servers.dat');

    // 1. Gather existing known servers from universal shared candidates
    for (const cPath of sharedServerCandidates) {
      if (fs.existsSync(cPath)) {
        try {
          const buf = fs.readFileSync(cPath);
          const parsed = parseServersDat(buf);
          if (parsed.length > 0) {
            sharedServers = mergeServersLists(sharedServers, parsed);
          }
        } catch {}
      }
    }

    // 2. Also harvest from any existing instance folders if shared was empty
    const instancesFolder = path.join(instancesPath, 'instances');
    if (fs.existsSync(instancesFolder)) {
      try {
        for (const sub of fs.readdirSync(instancesFolder)) {
          const subServ = path.join(instancesFolder, sub, 'servers.dat');
          if (fs.existsSync(subServ)) {
            const buf = fs.readFileSync(subServ);
            const parsed = parseServersDat(buf);
            if (parsed.length > 0) {
              sharedServers = mergeServersLists(sharedServers, parsed);
            }
          }
        }
      } catch {}
    }

    const targetServersPath = path.join(instanceDir, 'servers.dat');

    // 3. Read target instance servers if already exists
    if (fs.existsSync(targetServersPath)) {
      try {
        const targetBuf = fs.readFileSync(targetServersPath);
        const targetParsed = parseServersDat(targetBuf);
        if (targetParsed.length > 0) {
          sharedServers = mergeServersLists(sharedServers, targetParsed);
        }
      } catch {}
    }

    if (sharedServers.length > 0) {
      const mergedBuf = writeServersDat(sharedServers);
      // Write into target instance
      fs.writeFileSync(targetServersPath, mergedBuf);

      // Save into global shared locations so other instances and fresh installs inherit them
      fs.writeFileSync(primarySharedPath, mergedBuf);
      try {
        fs.writeFileSync(path.join(instancesPath, 'servers.dat'), mergedBuf);
      } catch {}
      const sharedProfDir = path.join(instancesPath, 'shared_profile');
      if (fs.existsSync(sharedProfDir)) {
        try {
          fs.writeFileSync(path.join(sharedProfDir, 'servers.dat'), mergedBuf);
        } catch {}
      }
    }
  } catch (err) {
    console.warn('Failed to sync global servers before launch:', err);
  }
}

/**
 * Saves and merges newly added servers from instance back into global store after game exits
 */
export function saveGlobalServersAfterExit({ instancesPath, instanceDir }) {
  try {
    const targetServersPath = path.join(instanceDir, 'servers.dat');
    if (!fs.existsSync(targetServersPath)) return;

    const targetBuf = fs.readFileSync(targetServersPath);
    const instanceServers = parseServersDat(targetBuf);
    if (!instanceServers.length) return;

    const primarySharedPath = path.join(instancesPath, 'shared_servers.dat');
    let existingShared = [];

    const candidates = [
      primarySharedPath,
      path.join(instancesPath, 'servers.dat'),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        try {
          const buf = fs.readFileSync(c);
          const p = parseServersDat(buf);
          if (p.length > 0) existingShared = mergeServersLists(existingShared, p);
        } catch {}
      }
    }

    const merged = mergeServersLists(existingShared, instanceServers);
    const mergedBuf = writeServersDat(merged);

    fs.writeFileSync(primarySharedPath, mergedBuf);
    try {
      fs.writeFileSync(path.join(instancesPath, 'servers.dat'), mergedBuf);
    } catch {}

    // Also propagate to other instance folders so switching profiles immediately sees newly added servers
    const instancesFolder = path.join(instancesPath, 'instances');
    if (fs.existsSync(instancesFolder)) {
      for (const sub of fs.readdirSync(instancesFolder)) {
        const subInstDir = path.join(instancesFolder, sub);
        if (subInstDir !== instanceDir && fs.statSync(subInstDir).isDirectory()) {
          try {
            const subServ = path.join(subInstDir, 'servers.dat');
            let subList = [];
            if (fs.existsSync(subServ)) {
              subList = parseServersDat(fs.readFileSync(subServ));
            }
            const subMerged = mergeServersLists(subList, merged);
            fs.writeFileSync(subServ, writeServersDat(subMerged));
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn('Failed to save global servers after exit:', err);
  }
}

/**
 * Synchronizes global user options (sensitivity, keybinds, fov, sound, lang) across all instances
 */
export function syncGlobalOptionsBeforeLaunch({ instancesPath, instanceDir }) {
  try {
    const sharedPath = path.join(instancesPath, 'shared_options.txt');
    const targetOpt = path.join(instanceDir, 'options.txt');

    // 1. If shared_options.txt doesn't exist, search existing instances for the best candidate
    if (!fs.existsSync(sharedPath)) {
      const instancesFolder = path.join(instancesPath, 'instances');
      let bestSource = null;
      let latestTime = 0;
      if (fs.existsSync(instancesFolder)) {
        for (const sub of fs.readdirSync(instancesFolder)) {
          const subOpt = path.join(instancesFolder, sub, 'options.txt');
          if (fs.existsSync(subOpt)) {
            const stat = fs.statSync(subOpt);
            if (stat.mtimeMs > latestTime) {
              latestTime = stat.mtimeMs;
              bestSource = subOpt;
            }
          }
        }
      }
      if (bestSource && fs.existsSync(bestSource)) {
        fs.copyFileSync(bestSource, sharedPath);
      }
    }

    // 2. If instance doesn't have options.txt yet, copy shared_options.txt directly
    if (!fs.existsSync(targetOpt)) {
      if (fs.existsSync(sharedPath)) {
        fs.copyFileSync(sharedPath, targetOpt);
      } else {
        fs.writeFileSync(targetOpt, 'fullscreen:true\n', 'utf8');
      }
    }

    // 3. Keep user's existing options.txt without forced mode flipping
    // Allows seamless windowing and exiting with Esc/Alt+Tab without trapping the cursor or flicker

    // 4. If instance already has options.txt, merge preferences from shared_options.txt
    if (fs.existsSync(sharedPath) && fs.existsSync(targetOpt)) {
      const sharedContent = fs.readFileSync(sharedPath, 'utf8');
      const targetContent = fs.readFileSync(targetOpt, 'utf8');

      const sharedMap = new Map();
      for (const line of sharedContent.split(/\r?\n/)) {
        const colon = line.indexOf(':');
        if (colon > 0) {
          const k = line.substring(0, colon);
          const v = line.substring(colon + 1);
          if (k !== 'resourcePacks') {
            sharedMap.set(k, v);
          }
        }
      }

      const targetLines = targetContent.split(/\r?\n/);
      const targetKeys = new Set();
      for (let i = 0; i < targetLines.length; i++) {
        const colon = targetLines[i].indexOf(':');
        if (colon > 0) {
          const k = targetLines[i].substring(0, colon);
          targetKeys.add(k);
          if (sharedMap.has(k)) {
            targetLines[i] = `${k}:${sharedMap.get(k)}`;
          }
        }
      }

      for (const [k, v] of sharedMap.entries()) {
        if (!targetKeys.has(k)) {
          targetLines.push(`${k}:${v}`);
        }
      }

      fs.writeFileSync(targetOpt, targetLines.join('\n'), 'utf8');
    }
  } catch (err) {
    console.warn('Failed to sync global options before launch:', err);
  }
}

/**
 * Saves updated options back to shared_options.txt after game exits
 */
export function saveGlobalOptionsAfterExit({ instancesPath, instanceDir }) {
  try {
    const targetOpt = path.join(instanceDir, 'options.txt');
    const sharedPath = path.join(instancesPath, 'shared_options.txt');

    if (!fs.existsSync(targetOpt)) return;
    const content = fs.readFileSync(targetOpt, 'utf8');

    const lines = content.split(/\r?\n/).map((line) => {
      if (line.startsWith('resourcePacks:')) {
        try {
          const packs = JSON.parse(line.substring('resourcePacks:'.length).trim());
          if (Array.isArray(packs)) {
            const cleaned = packs.filter((p) => !p.includes('ELauncher_Skin'));
            return `resourcePacks:${JSON.stringify(cleaned)}`;
          }
        } catch {}
      }
      return line;
    });

    fs.writeFileSync(sharedPath, lines.join('\n'), 'utf8');

    const rootOpt = path.join(instancesPath, 'options.txt');
    try {
      fs.writeFileSync(rootOpt, lines.join('\n'), 'utf8');
    } catch {}
  } catch (err) {
    console.warn('Failed to save global options after exit:', err);
  }
}

/**
 * Launches Minecraft process with real-time log streaming
 */
export async function launchMinecraftProcess(
  params,
  onLog,
  onExit
) {
  const instancesPath = (params.instancesPath && typeof params.instancesPath === 'string' && params.instancesPath.trim())
    ? params.instancesPath.trim()
    : getDefaultInstancesPath();
  const launcherPath = (params.launcherPath && typeof params.launcherPath === 'string' && params.launcherPath.trim())
    ? params.launcherPath.trim()
    : getDefaultLauncherPath();
  const instanceId = params.instanceId || params.instance?.id || 'default';
  const version = params.version || params.instance?.version;
  const loader = params.loader || params.instance?.loader || 'Vanilla';
  const ramMb = params.ramMb || 4096;
  const account = params.account || {};
  const username = params.username || account.username || 'Player';
  const accountType = params.accountType || account.type || 'offline';
  const uuid = params.uuid || account.uuid || (accountType === 'offline' ? generateOfflineUUID(username) : '00000000000000000000000000000000');
  const accessToken = params.accessToken || account.accessToken || '0';
  let skinUrl = params.skinUrl || account.skinUrl || '';
  if (!skinUrl && accountType === 'elyby' && username) {
    skinUrl = `https://skinsystem.ely.by/skins/${encodeURIComponent(username)}.png`;
  }
  const skinModel = params.skinModel || account.skinModel || 'classic';
  const javaPath = params.javaPath || params.customJavaPath || '';

  if (!version || typeof version !== 'string' || !version.trim()) {
    throw new Error('Версия Minecraft не указана. Выберите версию в профиле.');
  }

  const loaderStr = (loader || 'Vanilla').toLowerCase();
  const isLoader = loaderStr !== 'vanilla' && loaderStr !== 'elauncher';
  const targetVer = isLoader ? `${version}-${loaderStr}` : version;

  const versionDir = path.join(instancesPath, 'versions', version);
  const versionJsonPath = path.join(versionDir, `${version}.json`);
  const loaderJsonPath = isLoader ? path.join(instancesPath, 'versions', targetVer, `${targetVer}.json`) : null;

  if (!fs.existsSync(versionJsonPath)) {
    throw new Error(`Файлы версии ${version} не найдены на диске. Нажмите «СКАЧАТЬ», чтобы загрузить версию перед запуском.`);
  }

  const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  let loaderData = null;
  if (loaderJsonPath && fs.existsSync(loaderJsonPath)) {
    try {
      loaderData = JSON.parse(fs.readFileSync(loaderJsonPath, 'utf8'));
    } catch {}
  }

  const instanceDir = path.join(instancesPath, 'instances', instanceId);
  fs.mkdirSync(instanceDir, { recursive: true });

  const nativesDir = path.join(instancesPath, 'versions', version, 'natives');
  if (!fs.existsSync(nativesDir)) {
    fs.mkdirSync(nativesDir, { recursive: true });
  }

  // Build classpath: client.jar + loader jars + all libraries
  const clientJarPath = path.join(instancesPath, 'versions', version, `${version}.jar`);
  const cpEntries = [];

  if (fs.existsSync(clientJarPath)) {
    cpEntries.push(clientJarPath);
  }

  // Check for loader universal/client jar
  if (isLoader) {
    const loaderDir = path.join(instancesPath, 'versions', targetVer);
    const candidateJars = [
      path.join(loaderDir, `${targetVer}.jar`),
      path.join(loaderDir, `${version}.jar`),
    ];
    for (const cj of candidateJars) {
      if (fs.existsSync(cj) && !cpEntries.includes(cj)) {
        cpEntries.push(cj);
      }
    }
  }

  const allLibraries = [...(versionData.libraries || [])];
  if (loaderData?.libraries && Array.isArray(loaderData.libraries)) {
    allLibraries.push(...loaderData.libraries);
  }

  for (const lib of allLibraries) {
    if (!isLibraryAllowed(lib)) continue;
    if (lib.natives && !lib.downloads?.artifact) continue;

    let p = null;
    if (lib.downloads?.artifact?.path) {
      p = path.join(instancesPath, 'libraries', lib.downloads.artifact.path);
    } else if (lib.name) {
      const rel = mavenCoordinateToPath(lib.name);
      if (rel) p = path.join(instancesPath, 'libraries', rel);
    }

    if (p) {
      if (fs.existsSync(p)) {
        if (!cpEntries.includes(p)) cpEntries.push(p);
      } else {
        // Automatically fetch missing libraries on the fly so launch never fails
        try {
          const dl = await ensureLibrary(
            lib,
            instancesPath,
            nativesDir,
            loaderStr === 'forge' ? 'https://maven.minecraftforge.net/' :
            loaderStr === 'neoforge' ? 'https://maven.neoforged.net/releases/' :
            loaderStr === 'fabric' ? 'https://maven.fabricmc.net/' : 'https://libraries.minecraft.net/'
          );
          if (dl && fs.existsSync(dl) && !cpEntries.includes(dl)) {
            cpEntries.push(dl);
          }
        } catch {}
      }
    }
  }

  const classpathString = cpEntries.join(';');
  const reqJavaMajor = resolveRequiredJavaVersion(version);
  const javaExe = findSystemJava(javaPath, reqJavaMajor);
  const mainClass = loaderData?.mainClass
    || versionData.mainClass
    || (loaderStr === 'fabric' ? 'net.fabricmc.loader.impl.launch.knot.KnotClient' :
        loaderStr === 'forge' ? 'net.minecraft.launchwrapper.Launch' :
        loaderStr === 'neoforge' ? 'cpw.mods.bootstraplauncher.BootstrapLauncher' :
        'net.minecraft.client.main.Main');

  const jvmArgs = [
    '-Xms512M',
    `-Xmx${ramMb}M`,
    `-Djava.library.path=${nativesDir}`,
    '-Dminecraft.launcher.brand=ELauncher',
    '-Dminecraft.launcher.version=1.0.0',
    '-Dfile.encoding=UTF-8',
    '-Dsun.stdout.encoding=UTF-8',
    '-Dsun.stderr.encoding=UTF-8',
  ];

  if (reqJavaMajor >= 17) {
    jvmArgs.push(
      '-XX:+IgnoreUnrecognizedVMOptions',
      '--enable-native-access=ALL-UNNAMED',
      '-Dsun.misc.unsafe.warn=false'
    );
  }

  // Synchronize global options (sensitivity, keybinds, fov, sound, lang) across all instances
  syncGlobalOptionsBeforeLaunch({ instancesPath, instanceDir });

  // Synchronize global multiplayer servers list so servers are preserved everywhere
  syncGlobalServersBeforeLaunch({ instancesPath, instanceDir });

  // Handle skin system cleanly:
  // - Ely.by accounts: authlib-injector handles skins per-player natively over the network.
  //   Additionally install a resource pack fallback so LAN/offline servers also show the skin.
  // - Offline accounts with custom PNG: install a resource pack that overrides default player
  //   textures — the only vanilla-compatible way to inject skins without mods.
  if (accountType === 'elyby') {
    // Always clean stale skin pack first
    removeCustomSkinPack(instanceDir);
    try {
      const authlibJar = await ensureAuthlibInjector({ launcherPath, instancesPath });
      if (authlibJar) {
        jvmArgs.push(`-javaagent:${authlibJar}=ely.by`);
        onLog({
          raw: '[LAUNCHER] Подключен официальный агент авторизации и скинов Ely.by (authlib-injector)',
          level: 'info',
        });
      }
    } catch (authErr) {
      console.warn('Failed to attach authlib-injector:', authErr);
    }
    // Resource pack fallback: so LAN/singleplayer mode also uses the player skin
    if (skinUrl) {
      try {
        const installed = await installSkinResourcePack({ instanceDir, skinDataUrl: skinUrl, skinModel, version });
        if (installed) {
          onLog({
            raw: `[LAUNCHER] Скин игрока (резервный ресурс-пак для LAN/одиночной игры) применён`,
            level: 'info',
          });
        }
      } catch {}
    }
  } else if (accountType === 'offline' && skinUrl) {
    removeCustomSkinPack(instanceDir);
    try {
      const installed = await installSkinResourcePack({ instanceDir, skinDataUrl: skinUrl, skinModel, version });
      if (installed) {
        onLog({
          raw: `[LAUNCHER] Скин игрока (${skinModel}) применён через ресурс-пак`,
          level: 'info',
        });
      } else {
        onLog({
          raw: `[LAUNCHER] Не удалось применить скин (возможно, повреждён PNG файл)`,
          level: 'warn',
        });
      }
    } catch (skinErr) {
      console.warn('Failed to install skin resource pack:', skinErr);
    }
  } else {
    removeCustomSkinPack(instanceDir);
  }

  // ── ELauncher JavaAgent: Custom Main Menu (background + animated buttons) ──────────────────
  // Works on ALL versions: Vanilla, Fabric, Forge, NeoForge, Snapshots.
  // No resource packs, no mods — pure JVM-level injection via -javaagent.
  // The agent reads elauncher.bgImage to load the background texture at runtime.
  const bgAgentCandidates = [
    path.join(launcherPath, 'tools', 'elauncher-bg.jar'),
    path.join(process.cwd(), 'tools', 'elauncher-bg.jar'),
    path.join(path.dirname(process.execPath || ''), 'tools', 'elauncher-bg.jar'),
    path.join(path.dirname(process.argv[1] || ''), 'tools', 'elauncher-bg.jar'),
  ];
  const resolvedAgentPath = bgAgentCandidates.find(p => fs.existsSync(p)) || null;

  // Background image: prefer the one in launcherPath, fall back to project root
  const bgImageCandidates = [
    path.join(launcherPath, 'menu_background.jpg'),
    path.join(process.cwd(), 'menu_background.jpg'),
    path.join(path.dirname(process.argv[1] || ''), 'menu_background.jpg'),
    path.join(path.dirname(process.execPath || ''), 'menu_background.jpg'),
  ];
  const resolvedBgImage = bgImageCandidates.find(p => fs.existsSync(p)) || '';

  const modAssetsDir = path.join(process.cwd(), 'mod_assets');

  const enableCustomClient = params?.useCustomClient !== undefined
    ? Boolean(params.useCustomClient)
    : Boolean(loader && typeof loader === 'string' && loader.toLowerCase() === 'elauncher');

  if (enableCustomClient && resolvedAgentPath) {
    jvmArgs.push(`-javaagent:${resolvedAgentPath}`);
    if (!cpEntries.includes(resolvedAgentPath)) {
      cpEntries.push(resolvedAgentPath);
    }
    jvmArgs.push('-Delauncher.active=true');
    if (resolvedBgImage) {
      jvmArgs.push(`-Delauncher.bgImage=${resolvedBgImage}`);
    }
    if (fs.existsSync(modAssetsDir)) {
      jvmArgs.push(`-Delauncher.assetsDir=${modAssetsDir}`);
    }
    onLog({
      raw: '[LAUNCHER] ELauncher Custom Client Mode активен: ' + resolvedAgentPath + (resolvedBgImage ? ` (bg: ${path.basename(resolvedBgImage)})` : ''),
      level: 'info',
    });
  } else if (enableCustomClient) {
    onLog({
      raw: '[LAUNCHER] tools/elauncher-bg.jar не найден — собери агент через tools/build-agent.ps1',
      level: 'warn',
    });
  } else {
    onLog({
      raw: '[LAUNCHER] Запуск в стандартном режиме (Vanilla / Classic UI)',
      level: 'info',
    });
  }

  jvmArgs.push('-cp', cpEntries.join(';'));

  const finalClasspathString = cpEntries.join(';');

  const templateVars = {
    auth_player_name: username || 'Player',
    version_name: version,
    game_directory: instanceDir,
    assets_root: path.join(instancesPath, 'assets'),
    game_assets: path.join(instancesPath, 'assets'),
    assets_index_name: versionData.assetIndex?.id || version,
    auth_uuid: uuid,
    auth_access_token: accessToken || '0',
    auth_session: accessToken || '0',
    user_type: accountType === 'elyby' ? 'mojang' : 'legacy',
    version_type: 'ELauncher',
    user_properties: '{}',
    launcher_name: 'ELauncher',
    launcher_version: '1.0.0',
    classpath: finalClasspathString,
  };
  // Combine base Mojang version metadata with mod loader metadata (Fabric, Forge, NeoForge)
  // Ensures assetsDir, assetIndex, and essential vanilla game arguments are always provided to Knot/Forge!
  const combinedProfileData = {
    ...versionData,
    ...loaderData,
    assetIndex: versionData.assetIndex || loaderData?.assetIndex,
    arguments: {
      game: [
        ...(versionData?.arguments?.game || []),
        ...(loaderData?.arguments?.game || [])
      ],
      jvm: [
        ...(versionData?.arguments?.jvm || []),
        ...(loaderData?.arguments?.jvm || [])
      ]
    }
  };

  const gameArgs = resolveMinecraftGameArguments(combinedProfileData, templateVars);

  onLog({
    raw: `[LAUNCHER] Запуск процесса: ${javaExe}`,
    level: 'info',
  });
  onLog({
    raw: `[LAUNCHER] Профиль: ${version} (${loader || 'Vanilla'}), ОЗУ: ${ramMb}MB, Пользователь: ${username} (${accountType.toUpperCase()})`,
    level: 'info',
  });
  onLog({
    raw: `[LAUNCHER] Главный класс: ${mainClass}`,
    level: 'info',
  });

  const logDir = path.join(instanceDir, 'logs');
  const logFilePath = path.join(logDir, 'latest.log');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  } else if (fs.existsSync(logFilePath)) {
    try {
      fs.truncateSync(logFilePath, 0);
    } catch {}
  }

  const proc = spawn(javaExe, [...jvmArgs, mainClass, ...gameArgs], {
    cwd: instanceDir,
    detached: false,
    windowsHide: false,
  });

  activeGameProcess = proc;

  const recentLines = [];
  const emitLogLine = (line, isStderr = false) => {
    const trimmed = typeof line === 'string' ? line.trim() : '';
    if (!trimmed) return;
    if (recentLines.includes(trimmed)) return;
    recentLines.push(trimmed);
    if (recentLines.length > 1000) recentLines.shift();

    // Ignore harmless Realms connection/auth noise on offline/pirated clients
    if (
      /could not authorize you against Realms/i.test(trimmed) ||
      /Couldn't connect to realms/i.test(trimmed) ||
      /Failed to fetch Realms feature flags/i.test(trimmed) ||
      /Realms authentication error/i.test(trimmed) ||
      /Realms (?:Client|Notification|Availability)/i.test(trimmed) ||
      /com\.mojang\.realmsclient/i.test(trimmed)
    ) {
      return;
    }

    // Distinguish real errors from normal info/warning output (e.g. authlib-injector outputs [INFO] to stderr)
    const isExplicitInfo = /^\[?INFO\]?/i.test(trimmed) || /\[.*\/INFO\]/i.test(trimmed);
    const isWarn = /WARN|Warning/i.test(trimmed);
    const isErr = !isExplicitInfo && !isWarn && (isStderr || /ERROR|Exception|FATAL|Crash|Severe|Caused by:/i.test(trimmed));

    onLog({
      raw: trimmed,
      level: isErr ? 'error' : isWarn ? 'warn' : 'info',
    });
  };

  let logOffset = 0;
  let logBuffer = '';

  const pollLatestLog = () => {
    try {
      if (!fs.existsSync(logFilePath)) return;
      const stat = fs.statSync(logFilePath);
      if (stat.size <= logOffset) return;

      const fd = fs.openSync(logFilePath, 'r');
      const bytesToRead = stat.size - logOffset;
      const buffer = Buffer.alloc(bytesToRead);
      fs.readSync(fd, buffer, 0, bytesToRead, logOffset);
      fs.closeSync(fd);

      logOffset = stat.size;
      logBuffer += buffer.toString('utf8');

      const lines = logBuffer.split(/\r?\n/);
      logBuffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          emitLogLine(line, false);
        }
      }
    } catch {}
  };

  const logPollTimer = setInterval(pollLatestLog, 120);

  proc.stdout.on('data', (data) => {
    const lines = data.toString('utf8').split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        emitLogLine(line, false);
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString('utf8').split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        // Evaluate line content rather than blindly tagging all stderr as fatal error
        const isInfoOrWarn = /^\[?INFO\]?/i.test(line.trim()) || /WARN/i.test(line.trim());
        emitLogLine(line, !isInfoOrWarn);
      }
    }
  });

  let hasExited = false;
  const handleProcessExit = (code) => {
    if (hasExited) return;
    hasExited = true;
    clearInterval(logPollTimer);
    pollLatestLog();
    if (logBuffer.trim()) {
      emitLogLine(logBuffer, false);
      logBuffer = '';
    }

    // Save updated user settings (sensitivity, controls, sound, fov) to global shared_options.txt
    saveGlobalOptionsAfterExit({ instancesPath, instanceDir });

    // Save newly added multiplayer servers back to global store and sync to all profiles
    saveGlobalServersAfterExit({ instancesPath, instanceDir });

    onLog({
      raw: `[LAUNCHER] Игровой процесс завершился с кодом: ${code ?? 0}`,
      level: code === 0 ? 'info' : 'warn',
    });
    activeGameProcess = null;
    onExit(code ?? 0);
  };

  proc.on('error', (err) => {
    clearInterval(logPollTimer);
    onLog({
      raw: `[LAUNCHER ERROR] Ошибка запуска процесса Java: ${err.message}`,
      level: 'error',
    });
    activeGameProcess = null;
    onExit(-1);
  });

  proc.on('exit', (code) => handleProcessExit(code));
  proc.on('close', (code) => handleProcessExit(code));

  return proc;
}

/**
 * Checks if the game process is currently running
 */
export function isMinecraftProcessRunning() {
  return activeGameProcess !== null && !activeGameProcess.killed;
}

/**
 * Stops the active game process
 */
export function stopMinecraftProcess() {
  if (activeGameProcess) {
    const pid = activeGameProcess.pid;
    try {
      if (process.platform === 'win32' && pid) {
        const { execSync } = require('child_process');
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      }
    } catch {}
    try {
      activeGameProcess.kill('SIGKILL');
    } catch {}
    try {
      activeGameProcess.kill('SIGTERM');
    } catch {}
    activeGameProcess = null;
    return true;
  }
  return false;
}

/**
 * Determines required Java major version based on Minecraft release
 */
export function resolveRequiredJavaVersion(mcVersion) {
  if (!mcVersion) return 17;
  const str = String(mcVersion).toLowerCase();
  // Ancient versions (Beta, Alpha, Classic, Pre-Classic, Indev, Infdev) strictly require Java 8
  if (
    str.startsWith('rd-') ||
    str.startsWith('c0.') ||
    str.startsWith('in-') ||
    str.startsWith('inf-') ||
    str.startsWith('a1.') ||
    str.startsWith('b1.') ||
    str.startsWith('c-')
  ) {
    return 8;
  }
  // 2026 Drops or modern snapshots (24w, 25w, 26w) require Java 21
  if (str.startsWith('24w') || str.startsWith('25w') || str.startsWith('26')) {
    return 21;
  }
  const match = str.match(/^1\.(\d+)(?:\.(\d+))?/);
  if (!match) return 8;
  const minor = parseInt(match[1], 10);
  const patch = match[2] ? parseInt(match[2], 10) : 0;

  if (minor <= 16) return 8;
  if (minor === 17) return 17; // 1.17 works on 16/17
  if (minor >= 18 && minor <= 19) return 17;
  if (minor === 20 && patch < 5) return 17;
  // 1.20.5+ requires Java 21
  return 21;
}

/**
 * Helper to parse JDK/JRE 'release' metadata file
 */
function parseJavaReleaseFile(dir) {
  try {
    const releasePath = path.join(dir, 'release');
    if (!fs.existsSync(releasePath)) return null;
    const content = fs.readFileSync(releasePath, 'utf8');
    const res = {};
    for (const line of content.split(/\r?\n/)) {
      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        let v = line.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        res[k] = v;
      }
    }
    return res;
  } catch {
    return null;
  }
}

/**
 * Inspects a Java executable to extract exact major version, full version, vendor, and architecture
 */
function inspectJavaBinary(exePath, customLabel) {
  if (!fs.existsSync(exePath)) return null;

  const binDir = path.dirname(exePath);
  const homeDir = path.dirname(binDir);

  const release = parseJavaReleaseFile(homeDir) || parseJavaReleaseFile(binDir);
  let major = 17;
  let versionStr = '';
  let vendor = 'Java';
  let arch = '64-bit';

  if (release) {
    if (release.JAVA_VERSION) {
      versionStr = release.JAVA_VERSION;
      const match = versionStr.match(/^(?:1\.)?(\d+)/);
      if (match) major = parseInt(match[1], 10);
    }
    if (release.IMPLEMENTOR) vendor = release.IMPLEMENTOR.replace(/^["']|["']$/g, '').trim();
    if (release.OS_ARCH) arch = release.OS_ARCH.includes('64') ? '64-bit' : '32-bit';
  } else {
    const norm = exePath.toLowerCase();
    const match = norm.match(/(?:jdk|jre|java)[-_]?(?:1\.)?(\d+)/);
    if (match) {
      major = parseInt(match[1], 10);
      versionStr = `${major}.0`;
    } else if (norm.includes('1.8')) {
      major = 8;
      versionStr = '1.8.0';
    }

    try {
      const { spawnSync } = require('child_process');
      const res = spawnSync(exePath, ['-version'], { encoding: 'utf8', timeout: 1200 });
      const out = (res.stderr || '') + (res.stdout || '');
      const vMatch = out.match(/(?:java|openjdk)\s+version\s+"(?:1\.)?(\d+)([^"]*)"/i);
      if (vMatch) {
        major = parseInt(vMatch[1], 10);
        versionStr = `${vMatch[1]}${vMatch[2]}`;
      }
      if (/Adoptium|Temurin/i.test(out)) vendor = 'Eclipse Adoptium';
      else if (/Oracle/i.test(out)) vendor = 'Oracle Corporation';
      else if (/Zulu/i.test(out)) vendor = 'Azul Zulu';
      else if (/Corretto/i.test(out)) vendor = 'Amazon Corretto';
      else if (/Microsoft/i.test(out)) vendor = 'Microsoft';
    } catch {}
  }

  // Always check path for vendor if missing or generic
  const normPath = exePath.toLowerCase();
  if (!vendor || vendor === 'Java' || vendor.trim() === '') {
    if (normPath.includes('adoptium') || normPath.includes('temurin')) vendor = 'Eclipse Adoptium';
    else if (normPath.includes('javapath')) vendor = 'Oracle (javapath)';
    else if (normPath.includes('oracle')) vendor = 'Oracle Corporation';
    else if (normPath.includes('corretto')) vendor = 'Amazon Corretto';
    else if (normPath.includes('zulu')) vendor = 'Azul Zulu';
    else if (normPath.includes('bellsoft') || normPath.includes('liberica')) vendor = 'BellSoft Liberica';
    else if (normPath.includes('microsoft')) vendor = 'Microsoft';
    else vendor = 'Java SE';
  }

  const displayName = customLabel || `${vendor} ${versionStr ? `${versionStr}` : `Java ${major}`}`;

  return {
    path: exePath,
    major,
    version: versionStr || `Java ${major}`,
    vendor,
    arch,
    name: displayName,
    isLauncherBundled: !!customLabel?.includes('Встроенная'),
  };
}

/**
 * Scans Windows system for all installed Java runtimes across all standard and launcher paths
 */
export function detectSystemJavas(launcherPath) {
  const effectiveLauncher = (launcherPath && typeof launcherPath === 'string' && launcherPath.trim())
    ? launcherPath.trim()
    : getDefaultLauncherPath();
  const detected = [];
  const checkedPaths = new Set();

  const considerExe = (exePath, label) => {
    if (!exePath || typeof exePath !== 'string') return;
    const normalized = path.normalize(exePath).toLowerCase();
    if (checkedPaths.has(normalized)) return;
    checkedPaths.add(normalized);

    const info = inspectJavaBinary(exePath, label);
    if (info) detected.push(info);
  };

  const scanFolderForJavas = (dir, labelPrefix = '', maxDepth = 4) => {
    if (!fs.existsSync(dir) || maxDepth < 0) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(dir, entry.name);
          const javaw = path.join(subDir, 'bin', 'javaw.exe');
          const java = path.join(subDir, 'bin', 'java.exe');
          if (fs.existsSync(javaw)) {
            considerExe(javaw, labelPrefix ? `${labelPrefix} (${entry.name})` : '');
          } else if (fs.existsSync(java)) {
            considerExe(java, labelPrefix ? `${labelPrefix} (${entry.name})` : '');
          } else {
            scanFolderForJavas(subDir, labelPrefix, maxDepth - 1);
          }
        }
      }
      const directW = path.join(dir, 'javaw.exe');
      const direct = path.join(dir, 'java.exe');
      if (fs.existsSync(directW)) considerExe(directW, labelPrefix);
      else if (fs.existsSync(direct)) considerExe(direct, labelPrefix);
    } catch {}
  };

  // 1. Launcher managed runtimes
  const runtimesDir = path.join(effectiveLauncher, 'runtimes');
  scanFolderForJavas(runtimesDir, 'Встроенная');

  // 2. Standard Program Files directories
  const candidateDirs = [
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Java',
    'C:\\Program Files\\Microsoft\\jdk',
    'C:\\Program Files\\Amazon Corretto',
    'C:\\Program Files\\BellSoft',
    'C:\\Program Files\\Zulu',
    'C:\\Program Files\\Semeru',
    'C:\\Program Files (x86)\\Java',
    'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath',
  ];

  // 3. User local and roaming directories (including Breeze Client, .minecraft/runtime, IntelliJ .jdks)
  const localApp = process.env.LOCALAPPDATA || '';
  const appData = process.env.APPDATA || '';
  const userProfile = process.env.USERPROFILE || '';

  if (localApp) {
    candidateDirs.push(path.join(localApp, 'Programs', 'Eclipse Adoptium'));
    candidateDirs.push(path.join(localApp, 'Programs', 'Java'));
    candidateDirs.push(path.join(localApp, 'Programs', 'Breeze Client'));
  }
  if (appData) {
    candidateDirs.push(path.join(appData, '.minecraft', 'runtime'));
    candidateDirs.push(path.join(appData, 'breeze'));
  }
  if (userProfile) {
    candidateDirs.push(path.join(userProfile, '.jdks'));
    candidateDirs.push(path.join(userProfile, 'scoop', 'apps'));
  }

  for (const d of candidateDirs) {
    scanFolderForJavas(d);
  }

  // 4. Check JAVA_HOME & JDK_HOME
  for (const envVar of [process.env.JAVA_HOME, process.env.JDK_HOME]) {
    if (envVar && fs.existsSync(envVar)) {
      const w = path.join(envVar, 'bin', 'javaw.exe');
      const j = path.join(envVar, 'bin', 'java.exe');
      if (fs.existsSync(w)) considerExe(w, 'JAVA_HOME');
      else if (fs.existsSync(j)) considerExe(j, 'JAVA_HOME');
    }
  }

  // 5. Check PATH directories
  if (process.env.PATH) {
    const pathEntries = process.env.PATH.split(path.delimiter);
    for (const p of pathEntries) {
      if (p && fs.existsSync(p)) {
        const w = path.join(p, 'javaw.exe');
        const j = path.join(p, 'java.exe');
        if (fs.existsSync(w)) considerExe(w);
        else if (fs.existsSync(j)) considerExe(j);
      }
    }
  }

  // Sort descending by major version (25, 21, 17, 11, 8)
  detected.sort((a, b) => b.major - a.major);

  return detected;
}

async function extractZipWindows(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  try {
    // Windows tar (System32\tar.exe) extracts zip files directly and rapidly
    await execFileAsync('tar', ['-xf', zipPath, '-C', destDir]);
    return true;
  } catch {
    // Fallback to powershell Expand-Archive
    await execFileAsync('powershell', [
      '-NoProfile',
      '-Command',
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`
    ]);
    return true;
  }
}

function findJavaExeRecursive(dir) {
  if (!fs.existsSync(dir)) return null;
  const directW = path.join(dir, 'bin', 'javaw.exe');
  const directJ = path.join(dir, 'bin', 'java.exe');
  if (fs.existsSync(directW)) return directW;
  if (fs.existsSync(directJ)) return directJ;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = path.join(dir, entry.name);
        const subW = path.join(sub, 'bin', 'javaw.exe');
        const subJ = path.join(sub, 'bin', 'java.exe');
        if (fs.existsSync(subW)) return subW;
        if (fs.existsSync(subJ)) return subJ;
        const nested = findJavaExeRecursive(sub);
        if (nested) return nested;
      }
    }
  } catch {}
  return null;
}

/**
 * Downloads and sets up Adoptium OpenJDK runtime into <launcherPath>/runtimes/java-<major>
 */
export async function downloadJavaRuntime({ launcherPath, majorVersion }, onProgress) {
  const effectiveLauncher = (launcherPath && typeof launcherPath === 'string' && launcherPath.trim())
    ? launcherPath.trim()
    : getDefaultLauncherPath();
  const versionNum = parseInt(majorVersion, 10) || 17;
  const targetDir = path.join(effectiveLauncher, 'runtimes', `java-${versionNum}`);

  const report = (progress, status) => {
    if (typeof onProgress === 'function') {
      onProgress({ major: versionNum, progress: Math.min(100, Math.max(0, Math.round(progress))), status });
    }
  };

  report(5, `Поиск облегчённого пакета Java ${versionNum} (JRE)...`);

  // JRE package is ~46 MB (vs ~196 MB for full JDK), speeding up download & extraction by ~4.2x
  const jreApiUrl = `https://api.adoptium.net/v3/binary/latest/${versionNum}/ga/windows/x64/jre/hotspot/normal/eclipse`;
  const jdkApiUrl = `https://api.adoptium.net/v3/binary/latest/${versionNum}/ga/windows/x64/jdk/hotspot/normal/eclipse`;
  const tempZip = path.join(effectiveLauncher, 'runtimes', `temp_java_${versionNum}.zip`);

  report(15, `Подключение к серверам Adoptium...`);

  try {
    await downloadFile(jreApiUrl, tempZip, (pct) => {
      const overall = 15 + Math.round((pct * 0.7));
      report(overall, `Скачивание Java ${versionNum} (Adoptium JRE, ~47MB)... ${pct}%`);
    }, 600000);
  } catch (err) {
    console.warn('JRE package download failed, falling back to full JDK:', err);
    await downloadFile(jdkApiUrl, tempZip, (pct) => {
      const overall = 15 + Math.round((pct * 0.7));
      report(overall, `Скачивание Java ${versionNum} (Adoptium JDK)... ${pct}%`);
    }, 600000);
  }

  report(88, `Распаковка архива Java ${versionNum}...`);
  fs.mkdirSync(targetDir, { recursive: true });

  await extractZipWindows(tempZip, targetDir);

  try { fs.unlinkSync(tempZip); } catch {}

  const detectedExe = findJavaExeRecursive(targetDir) || path.join(targetDir, 'bin', 'javaw.exe');

  report(100, `Java ${versionNum} успешно установлена!`);
  return detectedExe;
}
