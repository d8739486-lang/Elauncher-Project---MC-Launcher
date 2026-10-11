export interface ElyByIpcAuthResult {
  success: boolean;
  profile?: {
    username: string;
    uuid: string;
    accessToken: string;
    clientToken: string;
    skinDataUrl?: string | null;
  };
  error?: string;
  requires2FA?: boolean;
}

export interface JavaInfo {
  path: string;
  major: number;
  version: string;
  vendor: string;
  arch?: string;
  name?: string;
  isLauncherBundled?: boolean;
}

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      toggleFullscreen: () => void;
      close: (lang?: string) => void;
      updateLanguage?: (lang: string) => void;
      isMaximized?: () => Promise<boolean>;
      isFullscreen?: () => Promise<boolean>;
      onFullscreenChange?: (callback: (isFullscreen: boolean) => void) => void;
      onMaximizeChange?: (callback: (isMaximized: boolean) => void) => void;
      selectFolder?: (defaultPath?: string) => Promise<string | null>;
      selectJavaFile?: (defaultPath?: string) => Promise<string | null>;
      openPath?: (folderPath: string) => Promise<boolean>;
      openExternal?: (url: string) => Promise<boolean>;
      authElyBy?: (params: { username: string; password: string; totpCode?: string }) => Promise<ElyByIpcAuthResult>;
      fetchElyBySkin?: (username: string) => Promise<string | null>;
      openElyByWindow?: (url?: string) => Promise<boolean>;
      checkVersionInstalled?: (params: { instancesPath: string; version: string; loader?: string; instanceId?: string }) => Promise<boolean>;
      listInstanceMods?: (params: { instancesPath: string; instanceId: string; folderType?: 'mod' | 'mods' | 'resourcepack' | 'shader' | 'datapack' }) => Promise<{
        fileName: string;
        cleanName: string;
        name?: string;
        iconUrl?: string | null;
        size: number;
        isEnabled: boolean;
        updatedAt: number;
      }[]>;
      toggleInstanceMod?: (params: { instancesPath: string; instanceId: string; fileName: string; enable: boolean; folderType?: 'mod' | 'mods' | 'resourcepack' | 'shader' | 'datapack' }) => Promise<boolean>;
      deleteInstanceMod?: (params: { instancesPath: string; instanceId: string; fileName: string; folderType?: 'mod' | 'mods' | 'resourcepack' | 'shader' | 'datapack' }) => Promise<boolean>;
      downloadModFile?: (params: { instancesPath: string; instanceId: string; url: string; fileName: string; folderType?: 'mod' | 'mods' | 'resourcepack' | 'shader' | 'datapack'; targetPath?: string }) => Promise<boolean>;
      listInstanceWorlds?: (params: { instancesPath: string; instanceId: string }) => Promise<{ name: string; icon: string | null; installedDatapacks?: string[] }[]>;
      getSystemInfo?: () => Promise<{
        totalMemMb: number;
        defaultInstancesPath: string;
        defaultLauncherPath: string;
      }>;
      rustExtractArchive?: (params: { archivePath: string; destPath: string }) => Promise<{
        success: boolean;
        files_extracted: number;
        total_bytes: number;
        elapsed_ms: number;
        error?: string | null;
      }>;
      rustVerifyAssets?: (params: {
        assets: {
          key: string;
          path: string;
          expected_hash: string;
          expected_size?: number;
          hash_algo?: 'sha1' | 'sha256';
        }[];
      }) => Promise<{
        total_checked: number;
        valid_count: number;
        missing_count: number;
        corrupted_count: number;
        elapsed_ms: number;
        invalid_keys: string[];
      }>;
      rustHashFile?: (params: { filePath: string; algo?: 'sha1' | 'sha256' }) => Promise<{
        success: boolean;
        hash: string;
        error?: string;
      }>;
      downloadMinecraftVersion?: (params: { instancesPath: string; version: string; loader?: string; instanceId?: string }) => Promise<{ success: boolean; error?: string }>;
      launchMinecraft?: (params: {
        instancesPath: string;
        launcherPath?: string;
        version?: string;
        loader?: string;
        instance: any;
        ramMb?: number;
        account?: any;
        selectedJavaVersion?: string;
        customJavaPath?: string;
        useCustomClient?: boolean;
      }) => Promise<{ success: boolean; pid?: number; error?: string }>;
      stopMinecraft?: () => Promise<boolean>;
      detectSystemJavas?: (params?: string | { launcherPath: string }) => Promise<JavaInfo[]>;
      downloadJavaRuntime?: (params: { launcherPath: string; major?: number; majorVersion?: number | string }) => Promise<{ success: boolean; javaPath?: string; error?: string }>;
      triggerGameMenuAction?: (action: string) => Promise<{ success: boolean }>;
      getAgentStatus?: () => Promise<{ inMenu?: boolean; ready?: boolean; minimized?: boolean; focused?: boolean; x?: number; y?: number; w?: number; h?: number; mcHwnd?: string }>;
      onMinecraftLog?: (callback: (logLine: string | { raw: string; level?: 'info' | 'warn' | 'error' | 'success' }) => void) => () => void;
      onMinecraftExit?: (callback: (code: number) => void) => () => void;
      onMinecraftDownloadProgress?: (callback: (data: { progress: number; text: string }) => void) => () => void;
      onJavaDownloadProgress?: (callback: (data: { major: number; progress: number; status: string }) => void) => () => void;
    };
  }
}
