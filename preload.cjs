const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => {
    ipcRenderer.send('window-minimize');
  },
  maximize: () => {
    ipcRenderer.send('window-maximize');
  },
  toggleFullscreen: () => {
    ipcRenderer.send('window-fullscreen');
  },
  close: () => {
    ipcRenderer.send('window-close');
  },
  isMaximized: () => {
    return ipcRenderer.invoke('window-is-maximized');
  },
  isFullscreen: () => {
    return ipcRenderer.invoke('window-is-fullscreen');
  },
  onMaximizeChange: (callback) => {
    ipcRenderer.on('maximize-changed', (_event, isMaximized) => callback(isMaximized));
  },
  onFullscreenChange: (callback) => {
    ipcRenderer.on('fullscreen-changed', (_event, isFullscreen) => callback(isFullscreen));
  },
  selectFolder: (defaultPath) => {
    return ipcRenderer.invoke('dialog-select-folder', defaultPath);
  },
  selectJavaFile: (defaultPath) => {
    return ipcRenderer.invoke('select-java-file', defaultPath);
  },
  getSystemInfo: () => {
    return ipcRenderer.invoke('system-get-info');
  },
  openPath: (folderPath) => {
    return ipcRenderer.invoke('open-path', folderPath);
  },
  openExternal: (url) => {
    return ipcRenderer.invoke('open-external', url);
  },
  checkVersionInstalled: (params) => {
    return ipcRenderer.invoke('check-version-installed', params);
  },
  listInstanceMods: (params) => {
    return ipcRenderer.invoke('list-instance-mods', params);
  },
  toggleInstanceMod: (params) => {
    return ipcRenderer.invoke('toggle-instance-mod', params);
  },
  deleteInstanceMod: (params) => {
    return ipcRenderer.invoke('delete-instance-mod', params);
  },
  downloadModFile: (params) => {
    return ipcRenderer.invoke('download-mod-file', params);
  },
  listInstanceWorlds: (params) => {
    return ipcRenderer.invoke('list-instance-worlds', params);
  },
  authElyBy: (params) => {
    return ipcRenderer.invoke('auth-elyby', params);
  },
  fetchElyBySkin: (username) => {
    return ipcRenderer.invoke('fetch-elyby-skin', username);
  },
  openElyByWindow: (url) => {
    return ipcRenderer.invoke('open-elyby-window', url);
  },
  rustExtractArchive: (params) => {
    return ipcRenderer.invoke('rust-extract-archive', params);
  },
  rustVerifyAssets: (params) => {
    return ipcRenderer.invoke('rust-verify-assets', params);
  },
  rustHashFile: (params) => {
    return ipcRenderer.invoke('rust-hash-file', params);
  },
  downloadMinecraftVersion: (params) => {
    return ipcRenderer.invoke('download-minecraft-version', params);
  },
  launchMinecraft: (params) => {
    return ipcRenderer.invoke('launch-minecraft', params);
  },
  stopMinecraft: () => {
    return ipcRenderer.invoke('stop-minecraft');
  },
  detectSystemJavas: (params) => {
    return ipcRenderer.invoke('detect-system-javas', params);
  },
  downloadJavaRuntime: (params) => {
    return ipcRenderer.invoke('download-java-runtime', params);
  },
  onMinecraftLog: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('minecraft-log', handler);
    return () => ipcRenderer.removeListener('minecraft-log', handler);
  },
  onMinecraftExit: (callback) => {
    const handler = (_event, code) => callback(code);
    ipcRenderer.on('minecraft-exit', handler);
    return () => ipcRenderer.removeListener('minecraft-exit', handler);
  },
  onMinecraftDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('minecraft-download-progress', handler);
    return () => ipcRenderer.removeListener('minecraft-download-progress', handler);
  },
  onJavaDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('java-download-progress', handler);
    return () => ipcRenderer.removeListener('java-download-progress', handler);
  },
});
