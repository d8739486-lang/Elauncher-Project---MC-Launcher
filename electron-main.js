import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import {
  checkMinecraftInstalled,
  downloadMinecraftVersion,
  launchMinecraftProcess,
  stopMinecraftProcess,
  isMinecraftProcessRunning,
  detectSystemJavas,
  downloadJavaRuntime,
  resolveRequiredJavaVersion,
} from './minecraftEngine.js';

function getDefaultInstancesPath() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.local/share'));
  return path.join(appData, '.minecraft');
}

function getDefaultLauncherPath() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.local/share'));
  return path.join(appData, 'ELauncher');
}

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locates compiled Rust high-performance engine binary if available
function findRustEngineBinary() {
  const binaryName = process.platform === 'win32' ? 'mc_engine.exe' : 'mc_engine';
  const candidates = [
    path.join(__dirname, 'src-tauri', 'target', 'release', binaryName),
    path.join(__dirname, 'src-tauri', 'target', 'debug', binaryName),
    path.join(__dirname, 'assets', 'bin', binaryName),
    path.join(__dirname, 'bin', binaryName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Explicitly set Windows Application User Model ID so the taskbar displays the custom icon
app.setAppUserModelId('com.eternal.launcher');

function createWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.ico');

  const win = new BrowserWindow({
    title: 'ELauncher',
    width: 1100,
    height: 700,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#050608',
    frame: false, // Frameless for custom title bar
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      devTools: false, // Strictly disable DevTools
    },
  });

  win.setMenuBarVisibility(false);
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
  });

  // Ensure external links always open in default system browser, never inside Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.startsWith('http://localhost:5173')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  const safeSend = (channel, ...args) => {
    if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
      try {
        win.webContents.send(channel, ...args);
      } catch (err) {
        // window or webContents was destroyed during transit
      }
    }
  };

  win.once('ready-to-show', () => {
    win.show();
  });

  let allowExitThroughAltF4 = false;

  // Intercept window close attempt (Close button, Alt+Tab close, Taskbar close, Task Manager graceful exit)
  win.on('close', (event) => {
    // If Minecraft is running, forbid closing launcher by cross button or taskbar until Alt+F4 or stopped via Console
    if (isMinecraftProcessRunning() && !allowExitThroughAltF4) {
      event.preventDefault();
      safeSend('minecraft-log', {
        raw: '[LAUNCHER] Закрытие лаунчера заблокировано: сначала остановите Minecraft через консоль или нажмите Alt+F4',
        level: 'warn',
      });
      return false;
    }
  });

  ipcMain.on('window-minimize', () => { if (!win.isDestroyed()) win.minimize(); });
  ipcMain.on('window-maximize', () => {
    if (!win.isDestroyed()) {
      if (win.isFullScreen()) {
        win.setFullScreen(false);
        win.maximize();
      } else if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
      safeSend('maximize-changed', win.isMaximized());
      safeSend('fullscreen-changed', win.isFullScreen());
    }
  });
  ipcMain.on('window-fullscreen', () => {
    if (!win.isDestroyed()) {
      const nextState = !win.isFullScreen();
      win.setFullScreen(nextState);
      safeSend('fullscreen-changed', nextState);
      safeSend('maximize-changed', win.isMaximized());
    }
  });
  ipcMain.on('window-close', () => {
    // Block close button if Minecraft is running
    if (isMinecraftProcessRunning()) {
      safeSend('minecraft-log', {
        raw: '[LAUNCHER] Лаунчер нельзя закрыть кнопкой «крестик», пока работает Minecraft. Остановите игру через консоль или используйте Alt+F4.',
        level: 'warn',
      });
      return;
    }
    if (!win.isDestroyed()) win.close();
  });

  // Register Alt+F4 bypass so user can still forcefully close with Alt+F4 if desired
  win.webContents.on('before-input-event', (event, input) => {
    if (input.alt && input.key && input.key.toLowerCase() === 'f4') {
      allowExitThroughAltF4 = true;
      // Allow window to close
      win.close();
    }
  });

  ipcMain.handle('window-is-maximized', () => !win.isDestroyed() && win.isMaximized());
  ipcMain.handle('window-is-fullscreen', () => !win.isDestroyed() && win.isFullScreen());

  ipcMain.handle('open-path', async (_event, folderPath) => {
    try {
      if (!folderPath) return false;
      const fs = await import('fs');
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const err = await shell.openPath(folderPath);
      if (err) {
        console.error('Failed to open path:', err);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error in open-path:', err);
      return false;
    }
  });

  ipcMain.handle('open-external', async (_event, url) => {
    try {
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        await shell.openExternal(url);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error opening external url:', err);
      return false;
    }
  });

  ipcMain.handle('system-get-info', async () => {
    const os = await import('os');
    const totalMemBytes = os.totalmem();
    const totalMemMb = Math.round(totalMemBytes / (1024 * 1024));
    const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.local/share'));
    const defaultInstancesPath = path.join(appData, '.minecraft');
    const defaultLauncherPath = path.join(appData, 'ELauncher');

    return {
      totalMemMb,
      defaultInstancesPath,
      defaultLauncherPath,
    };
  });

  // Strictly check if a specific Minecraft version's core files are installed locally
  ipcMain.handle('check-version-installed', async (_event, params = {}) => {
    const instancesPath = (params?.instancesPath && typeof params.instancesPath === 'string' && params.instancesPath.trim())
      ? params.instancesPath.trim()
      : getDefaultInstancesPath();
    const version = params?.version || params?.instance?.version;
    const loader = params?.loader || params?.instance?.loader;
    return checkMinecraftInstalled({ instancesPath, version, loader });
  });

  // Download complete Minecraft version (manifest, client.jar, libraries, assets)
  ipcMain.handle('download-minecraft-version', async (_event, params = {}) => {
    try {
      const instancesPath = (params?.instancesPath && typeof params.instancesPath === 'string' && params.instancesPath.trim())
        ? params.instancesPath.trim()
        : getDefaultInstancesPath();
      const version = params?.version || params?.instance?.version;
      const loader = params?.loader || params?.instance?.loader;
      await downloadMinecraftVersion({ instancesPath, version, loader }, (progress) => {
        safeSend('minecraft-download-progress', progress);
      });
      return { success: true };
    } catch (err) {
      console.error('Download Minecraft error:', err);
      return { success: false, error: err.message };
    }
  });

  // Launch Minecraft process and stream real console logs
  ipcMain.handle('launch-minecraft', async (_event, params = {}) => {
    try {
      const instancesPath = (params?.instancesPath && typeof params.instancesPath === 'string' && params.instancesPath.trim())
        ? params.instancesPath.trim()
        : getDefaultInstancesPath();
      const launcherPath = (params?.launcherPath && typeof params.launcherPath === 'string' && params.launcherPath.trim())
        ? params.launcherPath.trim()
        : getDefaultLauncherPath();

      const mcVersion = params?.version || params?.instance?.version || '1.20.4';
      const loader = params?.loader || params?.instance?.loader || 'Vanilla';
      const chosenJavaVer = params?.selectedJavaVersion || params?.javaVersion || 'auto';
      let resolvedJava = params?.javaPath || params?.customJavaPath;

      // Auto-install game version and loader files if missing
      if (!checkMinecraftInstalled({ instancesPath, version: mcVersion, loader })) {
        safeSend('minecraft-log', {
          raw: `[LAUNCHER] Автоматическая загрузка файлов Minecraft ${mcVersion} (${loader})...`,
          level: 'info'
        });
        await downloadMinecraftVersion({ instancesPath, version: mcVersion, loader }, (progress) => {
          safeSend('minecraft-download-progress', progress);
        });
      }

      if (!resolvedJava || chosenJavaVer === 'auto') {
        const reqVer = resolveRequiredJavaVersion(mcVersion);
        const javas = detectSystemJavas(launcherPath);
        let match = javas.find((j) => j.major === reqVer);
        if (!match && reqVer !== 8) {
          match = javas.filter((j) => j.major >= reqVer).sort((a, b) => a.major - b.major)[0];
        }
        if (match) {
          resolvedJava = match.path;
        } else {
          safeSend('minecraft-log', {
            raw: `[LAUNCHER] Загрузка и подготовка официального пакета Java ${reqVer} (Adoptium JRE)...`,
            level: 'info'
          });
          try {
            const dlJava = await downloadJavaRuntime({ launcherPath, majorVersion: reqVer }, (p) => {
              safeSend('java-download-progress', p);
            });
            if (dlJava) resolvedJava = dlJava;
          } catch (jErr) {
            console.warn('Auto Java download fallback:', jErr);
          }
        }
      } else if (chosenJavaVer && !resolvedJava) {
        const javas = detectSystemJavas(launcherPath);
        const match = javas.find((j) => j.major === Number(chosenJavaVer)) || javas[0];
        if (match) resolvedJava = match.path;
      }

      const proc = await launchMinecraftProcess(
        { ...params, instancesPath, launcherPath, version: mcVersion, loader, javaPath: resolvedJava },
        (logItem) => {
          safeSend('minecraft-log', logItem);
        },
        (code) => {
          safeSend('minecraft-exit', code);
        }
      );
      return { success: true, pid: proc?.pid };
    } catch (err) {
      console.error('Launch Minecraft error:', err);
      return { success: false, error: err.message };
    }
  });

  // Stop active game process
  ipcMain.handle('stop-minecraft', async () => {
    return stopMinecraftProcess();
  });

  // Detect installed Java runtimes on user system
  ipcMain.handle('detect-system-javas', async (_event, params) => {
    const launcherPath = typeof params === 'string' ? params : (params?.launcherPath || '');
    return detectSystemJavas(launcherPath);
  });

  // Download Java runtime (Adoptium OpenJDK)
  ipcMain.handle('download-java-runtime', async (_event, params) => {
    try {
      const launcherPath = params?.launcherPath || '';
      const majorVersion = params?.majorVersion || params?.major || 17;
      const javaPath = await downloadJavaRuntime({ launcherPath, majorVersion }, (progress) => {
        safeSend('java-download-progress', progress);
      });
      return { success: true, javaPath };
    } catch (err) {
      console.error('Download Java error:', err);
      return { success: false, error: err.message };
    }
  });

  // Native file dialog to select java.exe or javaw.exe
  ipcMain.handle('select-java-file', async (_event, defaultPath) => {
    try {
      const result = await dialog.showOpenDialog(win, {
        title: 'Выберите исполняемый файл Java (javaw.exe или java.exe)',
        defaultPath: defaultPath || 'C:\\Program Files\\Java',
        filters: [
          { name: 'Java Executable (*.exe)', extensions: ['exe'] },
          { name: 'All Files (*.*)', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    } catch (err) {
      console.error('Failed to select Java file:', err);
      return null;
    }
  });

  // Native folder selection dialog
  const handleSelectFolder = async (_event, defaultPath) => {
    try {
      const result = await dialog.showOpenDialog(win, {
        title: 'Выберите папку',
        defaultPath: defaultPath || getDefaultInstancesPath(),
        properties: ['openDirectory', 'createDirectory'],
      });
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        return result.filePaths[0];
      }
      return null;
    } catch (err) {
      console.error('Failed to select folder:', err);
      return null;
    }
  };
  ipcMain.handle('select-folder', handleSelectFolder);
  ipcMain.handle('dialog-select-folder', handleSelectFolder);

  // Get mods folder path for an instance and ensure it exists
  const getModsDir = (instancesPath, instanceId) => {
    return path.join(instancesPath, 'instances', instanceId, 'mods');
  };

  // Extract entry from jar archive using central directory
  const extractZipEntry = (buf, targetFileName) => {
    try {
      const zlib = require('zlib');
      const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
      const idx = buf.lastIndexOf(eocdSig);
      if (idx === -1) return null;
      const cdOffset = buf.readUInt32LE(idx + 16);
      const totalEntries = buf.readUInt16LE(idx + 10);
      let p = cdOffset;
      for (let i = 0; i < totalEntries; i++) {
        if (buf.readUInt32LE(p) !== 0x02014b50) break;
        const compression = buf.readUInt16LE(p + 10);
        const compSize = buf.readUInt32LE(p + 20);
        const nameLen = buf.readUInt16LE(p + 28);
        const extraLen = buf.readUInt16LE(p + 30);
        const commentLen = buf.readUInt16LE(p + 32);
        const localHeaderOffset = buf.readUInt32LE(p + 42);
        const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
        p += 46 + nameLen + extraLen + commentLen;
        if (name === targetFileName || name.toLowerCase() === targetFileName.toLowerCase()) {
          const locHeader = localHeaderOffset;
          const locNameLen = buf.readUInt16LE(locHeader + 26);
          const locExtraLen = buf.readUInt16LE(locHeader + 28);
          const dataStart = locHeader + 30 + locNameLen + locExtraLen;
          const compressedData = buf.subarray(dataStart, dataStart + compSize);
          if (compression === 0) return compressedData;
          if (compression === 8) return zlib.inflateRawSync(compressedData);
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const parseModMetadata = (filePath) => {
    try {
      const fs = require('fs');
      const buf = fs.readFileSync(filePath);
      let name = null;
      let iconUrl = null;

      // 1. Fabric mod metadata
      const fabricBuf = extractZipEntry(buf, 'fabric.mod.json');
      if (fabricBuf) {
        try {
          const json = JSON.parse(fabricBuf.toString('utf8'));
          if (json.name) name = json.name;
          const iconPath = typeof json.icon === 'string'
            ? json.icon
            : (json.icon ? json.icon['128'] || json.icon['64'] || Object.values(json.icon)[0] : null);
          if (iconPath) {
            const iconBuf = extractZipEntry(buf, iconPath);
            if (iconBuf) {
              iconUrl = 'data:image/png;base64,' + iconBuf.toString('base64');
            }
          }
        } catch {}
      }

      // 2. Forge mod metadata (mcmod.info)
      if (!name || !iconUrl) {
        const mcmodBuf = extractZipEntry(buf, 'mcmod.info');
        if (mcmodBuf) {
          try {
            const json = JSON.parse(mcmodBuf.toString('utf8'));
            const entry = Array.isArray(json) ? json[0] : (json.modList ? json.modList[0] : null);
            if (entry) {
              if (!name && entry.name) name = entry.name;
              if (entry.logoFile) {
                const iconBuf = extractZipEntry(buf, entry.logoFile);
                if (iconBuf) {
                  iconUrl = 'data:image/png;base64,' + iconBuf.toString('base64');
                }
              }
            }
          } catch {}
        }
      }

      // 3. Fallback generic icon inside jar if available
      if (!iconUrl) {
        for (const fallbackName of ['icon.png', 'logo.png', 'mod_icon.png']) {
          const fallbackBuf = extractZipEntry(buf, fallbackName);
          if (fallbackBuf) {
            iconUrl = 'data:image/png;base64,' + fallbackBuf.toString('base64');
            break;
          }
        }
      }

      return { name, iconUrl };
    } catch {
      return { name: null, iconUrl: null };
    }
  };

  const getContentDir = (instancesPath, instanceId, folderType = 'mods') => {
    const effective = (instancesPath && typeof instancesPath === 'string' && instancesPath.trim())
      ? instancesPath.trim()
      : getDefaultInstancesPath();
    const safeInstanceId = instanceId || 'default';
    const subFolder = folderType === 'resourcepack' ? 'resourcepacks'
      : folderType === 'shader' ? 'shaderpacks'
      : folderType === 'datapack' ? 'saves'
      : 'mods';
    return path.join(effective, 'instances', safeInstanceId, subFolder);
  };

  // List content in instance folder (mods, resourcepacks, shaderpacks)
  ipcMain.handle('list-instance-mods', async (_event, { instancesPath, instanceId, folderType = 'mods' }) => {
    try {
      const fs = await import('fs');
      const targetDir = getContentDir(instancesPath, instanceId, folderType);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        return [];
      }
      const files = fs.readdirSync(targetDir);
      const items = [];
      for (const file of files) {
        const isJar = file.endsWith('.jar') || file.endsWith('.jar.disabled');
        const isZip = file.endsWith('.zip') || file.endsWith('.zip.disabled');
        if (folderType === 'mods' ? isJar : (isJar || isZip)) {
          const filePath = path.join(targetDir, file);
          const stat = fs.statSync(filePath);
          const isEnabled = !file.endsWith('.disabled');
          const meta = folderType === 'mods' ? parseModMetadata(filePath) : { name: null, iconUrl: null };
          items.push({
            fileName: file,
            cleanName: meta.name || file.replace(/\.(jar|zip)(\.disabled)?$/, ''),
            name: meta.name || undefined,
            iconUrl: meta.iconUrl || null,
            size: stat.size,
            isEnabled,
            updatedAt: stat.mtimeMs,
          });
        }
      }
      return items;
    } catch (err) {
      console.error('Error listing instance content:', err);
      return [];
    }
  });

  // Toggle content item enabled/disabled status
  ipcMain.handle('toggle-instance-mod', async (_event, { instancesPath, instanceId, fileName, enable, folderType = 'mods' }) => {
    try {
      const fs = await import('fs');
      const targetDir = getContentDir(instancesPath, instanceId, folderType);
      const currentPath = path.join(targetDir, fileName);
      if (!fs.existsSync(currentPath)) return false;

      let newFileName = fileName;
      if (enable && fileName.endsWith('.disabled')) {
        newFileName = fileName.replace(/\.disabled$/, '');
      } else if (!enable && !fileName.endsWith('.disabled')) {
        newFileName = `${fileName}.disabled`;
      }
      const newPath = path.join(targetDir, newFileName);
      fs.renameSync(currentPath, newPath);
      return true;
    } catch (err) {
      console.error('Error toggling content:', err);
      return false;
    }
  });

  // Delete content item
  ipcMain.handle('delete-instance-mod', async (_event, { instancesPath, instanceId, fileName, folderType = 'mods' }) => {
    try {
      const fs = await import('fs');
      const targetDir = getContentDir(instancesPath, instanceId, folderType);
      const targetPath = path.join(targetDir, fileName);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      return true;
    } catch (err) {
      console.error('Error deleting content:', err);
      return false;
    }
  });

  // List worlds in instance saves folder
  ipcMain.handle('list-instance-worlds', async (_event, { instancesPath, instanceId }) => {
    try {
      const fs = await import('fs');
      const savesDir = path.join(instancesPath, 'instances', instanceId, 'saves');
      if (!fs.existsSync(savesDir)) {
        fs.mkdirSync(savesDir, { recursive: true });
        return [];
      }
      const entries = fs.readdirSync(savesDir, { withFileTypes: true });
      const worldsList = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const worldDir = path.join(savesDir, entry.name);
          const levelDatPath = path.join(worldDir, 'level.dat');
          const levelOldPath = path.join(worldDir, 'level.dat_old');

          // Strict validation: must contain level.dat or level.dat_old to be a genuine Minecraft world
          const isRealWorld = fs.existsSync(levelDatPath) || fs.existsSync(levelOldPath);
          if (!isRealWorld) {
            continue; // Skip any custom folder/dummy drafts that are not actual Minecraft worlds
          }

          const iconPath = path.join(worldDir, 'icon.png');
          let icon = null;
          if (fs.existsSync(iconPath)) {
            try {
              const iconBuf = fs.readFileSync(iconPath);
              icon = `data:image/png;base64,${iconBuf.toString('base64')}`;
            } catch {}
          }

          // Scan installed datapacks inside saves/<world>/datapacks
          const installedDatapacks = [];
          const dpDir = path.join(worldDir, 'datapacks');
          if (fs.existsSync(dpDir)) {
            try {
              for (const f of fs.readdirSync(dpDir)) {
                if (f.endsWith('.zip') || f.endsWith('.jar') || fs.statSync(path.join(dpDir, f)).isDirectory()) {
                  installedDatapacks.push(f);
                }
              }
            } catch {}
          }

          worldsList.push({
            name: entry.name,
            icon,
            installedDatapacks,
          });
        }
      }
      return worldsList;
    } catch (err) {
      console.error('Error listing instance worlds:', err);
      return [];
    }
  });

  // Download mod / resourcepack / shaderpack directly into target instance folder
  ipcMain.handle('download-mod-file', async (_event, { instancesPath, instanceId, url, fileName, folderType = 'mods', targetPath }) => {
    try {
      const fs = await import('fs');
      const https = await import('https');
      const http = await import('http');
      let targetDir;
      if (targetPath) {
        targetDir = targetPath;
      } else {
        const subFolder = folderType === 'resourcepack' ? 'resourcepacks' : folderType === 'shader' ? 'shaderpacks' : 'mods';
        targetDir = path.join(instancesPath, 'instances', instanceId, subFolder);
      }
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const destPath = path.join(targetDir, fileName);

      return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, (response) => {
          // Follow redirects if any
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            client.get(response.headers.location, (redirectRes) => {
              const fileStream = fs.createWriteStream(destPath);
              redirectRes.pipe(fileStream);
              fileStream.on('finish', () => {
                fileStream.close();
                resolve(true);
              });
              fileStream.on('error', () => resolve(false));
            }).on('error', () => resolve(false));
            return;
          }

          if (response.statusCode !== 200) {
            resolve(false);
            return;
          }

          const fileStream = fs.createWriteStream(destPath);
          response.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve(true);
          });
          fileStream.on('error', () => resolve(false));
        });
        request.on('error', () => resolve(false));
      });
    } catch (err) {
      console.error('Error downloading mod file:', err);
      return false;
    }
  });

  // Real Ely.by authentication through main process (bypassing CORS)
  ipcMain.handle('auth-elyby', async (_event, { username, password, totpCode }) => {
    try {
      if (!username || !username.trim()) {
        return { success: false, error: 'Введите никнейм или email' };
      }
      if (!password || !password.trim()) {
        return { success: false, error: 'Введите пароль от аккаунта Ely.by' };
      }

      const clientToken = `ely-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let finalPassword = password.trim();
      if (totpCode && totpCode.trim()) {
        finalPassword = `${finalPassword}:${totpCode.trim()}`;
      }

      const response = await fetch('https://authserver.ely.by/auth/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ELauncher/1.0.0',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: finalPassword,
          clientToken,
          requestUser: true,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.selectedProfile?.name) {
        const canonicalUsername = data.selectedProfile.name;
        const uuid = data.selectedProfile.id || data.user?.id || '';
        const accessToken = data.accessToken || '';

        // Fetch real skin texture from Ely.by skin system
        let skinDataUrl = null;
        try {
          const skinRes = await fetch(`https://skinsystem.ely.by/skins/${encodeURIComponent(canonicalUsername)}.png`);
          if (skinRes.ok) {
            const arrayBuf = await skinRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuf).toString('base64');
            skinDataUrl = `data:image/png;base64,${base64}`;
          }
        } catch (skinErr) {
          console.warn('Failed to fetch Ely.by skin texture:', skinErr);
        }

        return {
          success: true,
          profile: {
            username: canonicalUsername,
            uuid,
            accessToken,
            clientToken,
            skinDataUrl,
          },
        };
      }

      const errStr = (data?.errorMessage || data?.error || '').toLowerCase();
      if (
        errStr.includes('two factor') ||
        errStr.includes('2fa') ||
        errStr.includes('totp') ||
        data?.error === '2fa_required'
      ) {
        return {
          success: false,
          requires2FA: true,
          error: 'В аккаунте включена двухфакторная аутентификация (2FA). Введите 6-значный код из приложения.',
        };
      }

      if (
        errStr.includes('invalid credentials') ||
        errStr.includes('invalid username or password') ||
        response.status === 401 ||
        response.status === 403
      ) {
        return {
          success: false,
          error: 'Неверный логин или пароль на Ely.by.',
        };
      }

      return {
        success: false,
        error: data?.errorMessage || data?.error || 'Ошибка входа на Ely.by',
      };
    } catch (err) {
      console.error('Error during Ely.by authentication:', err);
      return {
        success: false,
        error: 'Не удалось связаться с сервером авторизации Ely.by. Проверьте интернет-соединение.',
      };
    }
  });

  // Direct skin fetch handler bypassing any CORS or browser restrictions
  ipcMain.handle('fetch-elyby-skin', async (_event, username) => {
    try {
      if (!username || typeof username !== 'string') return null;
      const cleanUser = username.trim();
      
      // 1. Ely.by direct PNG endpoint
      try {
        const res = await fetch(`https://skinsystem.ely.by/skins/${encodeURIComponent(cleanUser)}.png`);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          if (arrayBuf.byteLength > 100) {
            const base64 = Buffer.from(arrayBuf).toString('base64');
            return `data:image/png;base64,${base64}`;
          }
        }
      } catch {}

      // 2. Ely.by profile JSON metadata endpoint
      try {
        const profileRes = await fetch(`https://skinsystem.ely.by/profile/${encodeURIComponent(cleanUser)}`);
        if (profileRes.ok && profileRes.status !== 204) {
          const text = await profileRes.text();
          if (text) {
            const data = JSON.parse(text);
            const texturesProp = data?.properties?.find((p) => p.name === 'textures');
            if (texturesProp?.value) {
              const decoded = JSON.parse(Buffer.from(texturesProp.value, 'base64').toString('utf8'));
              const skinUrl = decoded?.textures?.SKIN?.url;
              if (skinUrl) {
                const skinRes = await fetch(skinUrl);
                if (skinRes.ok) {
                  const arrayBuf = await skinRes.arrayBuffer();
                  if (arrayBuf.byteLength > 100) {
                    const base64 = Buffer.from(arrayBuf).toString('base64');
                    return `data:image/png;base64,${base64}`;
                  }
                }
              }
            }
          }
        }
      } catch {}

      // 3. Fallback to Minotar skin CDN for standard or Mojang names
      try {
        const minotarRes = await fetch(`https://minotar.net/skin/${encodeURIComponent(cleanUser)}`);
        if (minotarRes.ok) {
          const arrayBuf = await minotarRes.arrayBuffer();
          if (arrayBuf.byteLength > 100) {
            const base64 = Buffer.from(arrayBuf).toString('base64');
            return `data:image/png;base64,${base64}`;
          }
        }
      } catch {}

      return null;
    } catch (err) {
      console.warn('Failed to fetch skin texture via IPC:', err);
      return null;
    }
  });

  // Open native mini window for Ely.by registration / cabinet
  ipcMain.handle('open-elyby-window', async (_event, targetUrl) => {
    try {
      const authUrl = targetUrl || 'https://account.ely.by/login';
      const authWin = new BrowserWindow({
        width: 560,
        height: 720,
        minWidth: 440,
        minHeight: 520,
        parent: win,
        modal: true,
        title: 'Ely.by',
        backgroundColor: '#0c0d12',
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      authWin.setMenuBarVisibility(false);
      authWin.loadURL(authUrl);
      return true;
    } catch (err) {
      console.error('Failed to open Ely.by window:', err);
      return false;
    }
  });

  // Rust High-Performance Engine IPC handlers (parallel unpacking & asset verification)
  ipcMain.handle('rust-extract-archive', async (_event, { archivePath, destPath }) => {
    const startTime = Date.now();
    const rustBin = findRustEngineBinary();
    if (rustBin && archivePath && destPath) {
      try {
        const { stdout } = await execFileAsync(rustBin, [
          'extract',
          '--archive',
          archivePath,
          '--dest',
          destPath,
        ]);
        const res = JSON.parse(stdout.trim());
        if (res.success && res.data) return res.data;
        if (res.error) {
          return {
            success: false,
            files_extracted: 0,
            total_bytes: 0,
            elapsed_ms: Date.now() - startTime,
            error: res.error,
          };
        }
      } catch (err) {
        console.warn('Rust engine extract failed, returning error:', err);
        return {
          success: false,
          files_extracted: 0,
          total_bytes: 0,
          elapsed_ms: Date.now() - startTime,
          error: err.message || 'Execution error in Rust engine',
        };
      }
    }

    return {
      success: false,
      files_extracted: 0,
      total_bytes: 0,
      elapsed_ms: Date.now() - startTime,
      error: rustBin ? 'Invalid arguments' : 'Rust engine binary not compiled yet. Run npm run rust:build',
    };
  });

  ipcMain.handle('rust-verify-assets', async (_event, { assets }) => {
    const startTime = Date.now();
    if (!Array.isArray(assets) || !assets.length) {
      return {
        total_checked: 0,
        valid_count: 0,
        missing_count: 0,
        corrupted_count: 0,
        elapsed_ms: 0,
        invalid_keys: [],
      };
    }

    const rustBin = findRustEngineBinary();
    if (rustBin) {
      try {
        const tempPath = path.join(
          app.getPath('temp'),
          `mc_verify_${Date.now()}_${Math.random().toString(36).slice(2)}.json`
        );
        fs.writeFileSync(tempPath, JSON.stringify(assets));
        const { stdout } = await execFileAsync(rustBin, ['verify', '--manifest', tempPath]);
        try {
          fs.unlinkSync(tempPath);
        } catch {}
        const res = JSON.parse(stdout.trim());
        if (res.success && res.data) return res.data;
      } catch (err) {
        console.warn('Rust engine verification failed, falling back to JS:', err);
      }
    }

    // Pure Node.js high-performance fallback
    const invalidKeys = [];
    let validCount = 0;
    for (const item of assets) {
      try {
        if (!fs.existsSync(item.path)) {
          invalidKeys.push(item.key);
          continue;
        }
        if (typeof item.expected_size === 'number') {
          const stat = fs.statSync(item.path);
          if (stat.size !== item.expected_size) {
            invalidKeys.push(item.key);
            continue;
          }
        }
        const data = fs.readFileSync(item.path);
        const hash = crypto
          .createHash(item.hash_algo || 'sha1')
          .update(data)
          .digest('hex');
        if (hash.toLowerCase() === (item.expected_hash || '').toLowerCase()) {
          validCount++;
        } else {
          invalidKeys.push(item.key);
        }
      } catch {
        invalidKeys.push(item.key);
      }
    }

    return {
      total_checked: assets.length,
      valid_count: validCount,
      missing_count: invalidKeys.length,
      corrupted_count: invalidKeys.length,
      elapsed_ms: Date.now() - startTime,
      invalid_keys: invalidKeys,
    };
  });

  ipcMain.handle('rust-hash-file', async (_event, { filePath, algo }) => {
    const chosenAlgo = algo || 'sha1';
    const rustBin = findRustEngineBinary();
    if (rustBin && filePath) {
      try {
        const { stdout } = await execFileAsync(rustBin, [
          'hash',
          '--file',
          filePath,
          '--algo',
          chosenAlgo,
        ]);
        const res = JSON.parse(stdout.trim());
        if (res.success && res.hash) {
          return { success: true, hash: res.hash };
        }
      } catch (err) {
        console.warn('Rust engine hash failed, falling back to JS:', err);
      }
    }

    // Node.js fallback
    try {
      if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, hash: '', error: 'File does not exist' };
      }
      const data = fs.readFileSync(filePath);
      const hash = crypto.createHash(chosenAlgo).update(data).digest('hex');
      return { success: true, hash };
    } catch (err) {
      return { success: false, hash: '', error: err.message };
    }
  });

  const sendMaximizeState = () => {
    safeSend('maximize-changed', win.isMaximized());
  };

  win.on('maximize', sendMaximizeState);
  win.on('unmaximize', sendMaximizeState);
  win.on('resize', sendMaximizeState);
  win.on('enter-full-screen', () => {
    safeSend('fullscreen-changed', true);
    safeSend('maximize-changed', win.isMaximized());
  });
  win.on('leave-full-screen', () => {
    safeSend('fullscreen-changed', false);
    safeSend('maximize-changed', win.isMaximized());
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
