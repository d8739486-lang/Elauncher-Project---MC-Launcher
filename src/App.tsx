import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  Play,
  Layers,
  FolderDown,
  User,
  Settings,
  Terminal,
  Download,
  Loader2,
} from 'lucide-react';
import { DitherWaveCanvas } from './components/DitherWaveCanvas';
import { InstancesView } from './components/InstancesView';
import { ModsView } from './components/ModsView';
import { ConsoleView, type LogEntry } from './components/ConsoleView';
import { SettingsModalContent, type AppSettings } from './components/SettingsModalContent';
import { AccountsView, AccountAvatar, ElyByIcon, OfflineIcon } from './components/AccountsView';
import { filterMinecraftLog, getCurrentTimeFormatted } from './utils/logFilter';
import { playPalateClick } from './utils/sound';
import { translations } from './utils/i18n';
import { AnimatedText } from './components/AnimatedText';
import { InGameWebMenu } from './components/InGameWebMenu';
import type { Instance } from './types/instance';
import type { Account } from './types/account';
import {
  getSavedAccounts,
  saveAccounts,
  getActiveAccountId,
  saveActiveAccountId,
  syncElyByAccountSkin,
} from './utils/accountService';


// Ultra-smooth cubic bezier easing curve (Apple/Framer polish)
const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function App() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'play' | 'instances' | 'mods' | 'accounts' | 'console'>('play');

  // Instances state with localStorage persistence (strictly empty by default - no unprompted pre-installed instances)
  const [instances, setInstances] = useState<Instance[]>(() => {
    try {
      const saved = localStorage.getItem('elauncher_instances');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('elauncher_selected_instance_id');
      if (saved) return saved;
    } catch {}
    return '';
  });

  // Modal alert when no instance is selected upon launch
  const [showNoInstanceModal, setShowNoInstanceModal] = useState(false);

  // App Settings (Language: English default, RAM, Paths, Java, Custom Client Mode)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('elauncher_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          language: (parsed.language === 'ru' || parsed.language === 'en_uk') ? parsed.language : 'en',
          ramMb: typeof parsed.ramMb === 'number' ? parsed.ramMb : 4096,
          instancesPath: parsed.instancesPath || '',
          launcherPath: (parsed.launcherPath || '').replace(/EternalLauncher/g, 'ELauncher'),
          selectedJavaVersion: parsed.selectedJavaVersion || 'auto',
          customJavaPath: parsed.customJavaPath || '',
          useCustomClient: parsed.useCustomClient !== undefined ? Boolean(parsed.useCustomClient) : true,
        };
      }
    } catch {}
    return {
      language: 'en',
      ramMb: 4096,
      instancesPath: '',
      launcherPath: '',
      selectedJavaVersion: 'auto',
      customJavaPath: '',
      useCustomClient: true,
    };
  });

  const handleUpdateSettings = (newPartial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem('elauncher_app_settings', JSON.stringify(updated));
      } catch {}
      if (newPartial.language && window.electronAPI?.updateLanguage) {
        window.electronAPI.updateLanguage(newPartial.language);
      }
      return updated;
    });
  };

  const t = translations[settings.language];

  const isOverlayMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('mode') === 'overlay' ||
    window.location.hash === '#/overlay'
  );

  const handleTriggerGameAction = async (action: string) => {
    try {
      if (window.electronAPI?.triggerGameMenuAction) {
        await window.electronAPI.triggerGameMenuAction(action);
      } else {
        await fetch('http://127.0.0.1:28751/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
      }
    } catch (e) {
      console.error('Trigger game action failed:', e);
    }
  };

  if (isOverlayMode) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-[#050608]">
        <InGameWebMenu
          language={settings.language}
          onLanguageChange={(newLang) => handleUpdateSettings({ language: newLang })}
          onSingleplayer={() => handleTriggerGameAction('singleplayer')}
          onMultiplayer={() => handleTriggerGameAction('multiplayer')}
          onSettings={() => handleTriggerGameAction('settings')}
          onVanilla={() => handleTriggerGameAction('vanilla')}
          onQuit={() => handleTriggerGameAction('quit')}
        />
      </div>
    );
  }

  // Auto-detect and populate system default paths on initial mount
  useEffect(() => {
    if (window.electronAPI?.getSystemInfo) {
      window.electronAPI.getSystemInfo().then((info) => {
        if (!info) return;
        setSettings((prev) => {
          let modified = false;
          const next = { ...prev };
          if (!next.instancesPath && info.defaultInstancesPath) {
            next.instancesPath = info.defaultInstancesPath;
            modified = true;
          }
          if (next.launcherPath && next.launcherPath.includes('EternalLauncher')) {
            next.launcherPath = next.launcherPath.replace(/EternalLauncher/g, 'ELauncher');
            modified = true;
          }
          if (!next.launcherPath && info.defaultLauncherPath) {
            next.launcherPath = info.defaultLauncherPath;
            modified = true;
          }
          if (modified) {
            try {
              localStorage.setItem('elauncher_app_settings', JSON.stringify(next));
            } catch {}
          }
          return next;
        });
      });
    }
  }, []);

  // Console & Launch state
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawFullLog, setRawFullLog] = useState<string>('');

  const selectedInstance = instances.find((i) => i.id === selectedInstanceId) || instances[0] || null;

  // Connected accounts state with localStorage persistence
  const [accounts, setAccounts] = useState<Account[]>(() => getSavedAccounts());
  const [activeAccountId, setActiveAccountId] = useState<string>(() => getActiveAccountId());

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0] || null;

  const handleSelectAccount = (id: string) => {
    setActiveAccountId(id);
    saveActiveAccountId(id);
  };

  const handleAddAccount = (newAcc: Account) => {
    // Prevent adding the same account twice (case-insensitive check by username and type)
    const existingIndex = accounts.findIndex(
      (a) => a.type === newAcc.type && a.username.trim().toLowerCase() === newAcc.username.trim().toLowerCase()
    );

    if (existingIndex !== -1) {
      // If already exists, update its credentials/skin and make it active without duplicating
      const updated = accounts.map((a, idx) => (idx === existingIndex ? { ...a, ...newAcc, id: a.id } : a));
      setAccounts(updated);
      saveAccounts(updated);
      setActiveAccountId(accounts[existingIndex].id);
      saveActiveAccountId(accounts[existingIndex].id);
      return;
    }

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    saveAccounts(updated);
  };

  const handleDeleteAccount = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    saveAccounts(updated);
    if (activeAccountId === id && updated.length > 0) {
      setActiveAccountId(updated[0].id);
      saveActiveAccountId(updated[0].id);
    }
  };

  const handleUpdateAccount = (updatedAcc: Account) => {
    setAccounts((prev) => {
      const updated = prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a));
      saveAccounts(updated);
      return updated;
    });
  };

  // Synchronize Ely.by account skins in background on startup
  useEffect(() => {
    const initialAccounts = getSavedAccounts();
    initialAccounts.forEach((acc) => {
      if (acc.type === 'elyby') {
        syncElyByAccountSkin(acc)
          .then((synced) => {
            if (synced.skinAvatarUrl !== acc.skinAvatarUrl || synced.skinUrl !== acc.skinUrl) {
              setAccounts((prev) => {
                const updated = prev.map((a) => (a.id === synced.id ? synced : a));
                saveAccounts(updated);
                return updated;
              });
            }
          })
          .catch(() => {});
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('elauncher_instances', JSON.stringify(instances));
    } catch {}
  }, [instances]);

  // Keep selectedInstanceId synchronized and persisted so user is never re-prompted
  useEffect(() => {
    if (selectedInstance) {
      if (selectedInstanceId !== selectedInstance.id) {
        setSelectedInstanceId(selectedInstance.id);
      }
      try {
        localStorage.setItem('elauncher_selected_instance_id', selectedInstance.id);
      } catch {}
    } else {
      try {
        localStorage.removeItem('elauncher_selected_instance_id');
      } catch {}
    }
  }, [selectedInstance, selectedInstanceId]);

  const appendLog = (logItem: string | { raw: string; level?: LogEntry['level'] }, defaultLevel?: LogEntry['level']) => {
    const rawText = typeof logItem === 'string' ? logItem : (logItem?.raw || '');
    const itemLevel = typeof logItem === 'object' ? logItem?.level : undefined;
    const timestamp = getCurrentTimeFormatted();
    const filterRes = filterMinecraftLog(rawText);
    
    // Always store full raw text for the download feature
    setRawFullLog((prev) => (prev ? `${prev}\n[${timestamp}] ${rawText}` : `[${timestamp}] ${rawText}`));

    // If filter decides this is not clean or duplicate spam, we can skip or show clean text
    if (filterRes.shouldShow) {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp,
          level: defaultLevel || filterRes.level || itemLevel || 'info',
          message: filterRes.cleanMessage,
          raw: rawText,
        },
      ]);
    }
  };

  // Launch & Download state
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [isInstalledLocally, setIsInstalledLocally] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{ progress: number; text: string } | null>(null);

  // Check if selected instance is installed locally
  useEffect(() => {
    let isCancelled = false;
    const check = async () => {
      if (!selectedInstance || !window.electronAPI?.checkVersionInstalled) {
        setIsInstalledLocally(false);
        return;
      }
      try {
        const installed = await window.electronAPI.checkVersionInstalled({
          instancesPath: settings.instancesPath,
          version: selectedInstance.version,
          loader: selectedInstance.loader,
          instanceId: selectedInstance.id,
        });
        if (!isCancelled) {
          setIsInstalledLocally(installed);
        }
      } catch {
        if (!isCancelled) setIsInstalledLocally(false);
      }
    };
    check();
    return () => {
      isCancelled = true;
    };
  }, [selectedInstance?.id, selectedInstance?.version, settings.instancesPath]);

  // Subscribe to real Minecraft logs, exit, and download progress from Electron IPC
  useEffect(() => {
    let cleanLog: (() => void) | undefined;
    let cleanExit: (() => void) | undefined;
    let cleanProgress: (() => void) | undefined;

    if (window.electronAPI?.onMinecraftLog) {
      cleanLog = window.electronAPI.onMinecraftLog((logLine) => {
        appendLog(logLine);
      });
    }

    if (window.electronAPI?.onMinecraftExit) {
      cleanExit = window.electronAPI.onMinecraftExit((exitCode) => {
        setIsGameRunning(false);
        appendLog(`[LAUNCHER] Игровой процесс завершился (код: ${exitCode})`, exitCode === 0 ? 'info' : 'warn');
      });
    }

    if (window.electronAPI?.onMinecraftDownloadProgress) {
      cleanProgress = window.electronAPI.onMinecraftDownloadProgress((data) => {
        setDownloadProgress(data);
      });
    }

    return () => {
      cleanLog?.();
      cleanExit?.();
      cleanProgress?.();
    };
  }, []);

  const handleDownloadGame = async () => {
    if (!selectedInstance) return;
    if (!navigator.onLine) {
      setShowOfflineModal(true);
      return;
    }

    setDownloadProgress({ progress: 0, text: 'Подготовка к скачиванию...' });
    if (window.electronAPI?.downloadMinecraftVersion) {
      try {
        const res = await window.electronAPI.downloadMinecraftVersion({
          instancesPath: settings.instancesPath,
          version: selectedInstance.version,
          loader: selectedInstance.loader,
          instanceId: selectedInstance.id,
        });

        if (res.success) {
          setIsInstalledLocally(true);
          appendLog(`[LAUNCHER] Версия Minecraft ${selectedInstance.version} (${selectedInstance.loader}) успешно установлена!`, 'info');
        } else {
          appendLog(`[ERROR] Ошибка скачивания версии: ${res.error}`, 'error');
        }
      } catch (err: any) {
        appendLog(`[ERROR] Ошибка скачивания версии: ${err?.message || err}`, 'error');
      } finally {
        setDownloadProgress(null);
      }
    }
  };

  const handleLaunchGame = async () => {
    if (!selectedInstance) {
      setShowNoInstanceModal(true);
      return;
    }

    // Verify if files are installed locally before launching
    let installed = isInstalledLocally;
    if (window.electronAPI?.checkVersionInstalled) {
      try {
        installed = await window.electronAPI.checkVersionInstalled({
          instancesPath: settings.instancesPath,
          version: selectedInstance.version,
          loader: selectedInstance.loader,
          instanceId: selectedInstance.id,
        });
        setIsInstalledLocally(installed);
      } catch {}
    }

    // If not installed locally, download first
    if (!installed) {
      handleDownloadGame();
      return;
    }

    // Automatically switch to console tab immediately for real tracking
    setCurrentTab('console');
    setIsGameRunning(true);
    setLogs([]);
    setRawFullLog('');

    appendLog(`[LAUNCHER] Подготовка к запуску профиля: ${selectedInstance.name} (Minecraft ${selectedInstance.version}, ${selectedInstance.loader})...`);

    if (window.electronAPI?.launchMinecraft) {
      try {
        const res = await window.electronAPI.launchMinecraft({
          instancesPath: settings.instancesPath,
          launcherPath: settings.launcherPath,
          version: selectedInstance.version,
          loader: selectedInstance.loader,
          instance: selectedInstance,
          ramMb: settings.ramMb,
          account: activeAccount,
          selectedJavaVersion: settings.selectedJavaVersion,
          customJavaPath: settings.customJavaPath,
          useCustomClient: settings.useCustomClient !== false,
        });

        if (!res.success) {
          setIsGameRunning(false);
          appendLog(`[ERROR] Не удалось запустить Minecraft: ${res.error}`, 'error');
        } else {
          appendLog(`[LAUNCHER] Minecraft запущен (PID: ${res.pid})`);
        }
      } catch (err: any) {
        setIsGameRunning(false);
        appendLog(`[ERROR] Исключение при запуске Minecraft: ${err?.message || err}`, 'error');
      }
    }
  };

  const handleStopGame = async () => {
    if (window.electronAPI?.stopMinecraft) {
      await window.electronAPI.stopMinecraft();
    }
    setIsGameRunning(false);
    appendLog('[LAUNCHER] Игровой процесс был остановлен пользователем.', 'warn');
  };

  const handleClearLogs = () => {
    setLogs([]);
    setRawFullLog('');
  };

  const handleCreateInstance = (newInstanceData: Omit<Instance, 'id'>) => {
    const id = `inst-${Date.now()}`;
    const newInst: Instance = { id, ...newInstanceData };
    setInstances((prev) => [newInst, ...prev]);
    // Check setting: if user configured auto-switch on creation (default false - keep current instance)
    const autoSwitchOnCreate = localStorage.getItem('elauncher_switch_to_new_instance') === 'true';
    if (autoSwitchOnCreate || !selectedInstanceId) {
      setSelectedInstanceId(id);
    }
  };

  const handleUpdateInstance = (updatedInstance: Instance) => {
    setInstances((prev) => prev.map((i) => (i.id === updatedInstance.id ? updatedInstance : i)));
  };

  const handleDeleteInstance = (id: string) => {
    setInstances((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      if (selectedInstanceId === id && filtered.length > 0) {
        setSelectedInstanceId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Window maximize & fullscreen state

  useEffect(() => {
    window.electronAPI?.isMaximized?.().then((maximized) => {
      setIsMaximized(maximized);
    });
    window.electronAPI?.isFullscreen?.().then((fullscreen) => {
      setIsFullscreen(fullscreen);
    });

    window.electronAPI?.onFullscreenChange?.((fullscreen) => {
      setIsFullscreen(fullscreen);
    });
    window.electronAPI?.onMaximizeChange?.((maximized) => {
      setIsMaximized(maximized);
    });

    const handleResize = () => {
      window.electronAPI?.isMaximized?.().then((maximized) => {
        setIsMaximized(maximized);
      });
      window.electronAPI?.isFullscreen?.().then((fullscreen) => {
        setIsFullscreen(fullscreen);
      });
    };
    window.addEventListener('resize', handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        handleToggleFullscreen();
      }
      if (e.key === 'Escape' && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };

    const handleFullscreenChange = () => {
      if (!window.electronAPI) {
        setIsFullscreen(!!document.fullscreenElement);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isSettingsOpen]);

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsMaximized(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsMaximized(false);
      }
    }
  };
  const handleToggleFullscreen = () => {
    if (window.electronAPI) {
      window.electronAPI.toggleFullscreen();
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };
  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.close(settings.language);
    } else {
      window.close();
    }
  };

  const navItems = [
    { id: 'play' as const, label: t.play, icon: Play },
    { id: 'instances' as const, label: t.instances, icon: Layers },
    { id: 'mods' as const, label: t.mods, icon: FolderDown },
    { id: 'accounts' as const, label: t.accounts, icon: User },
  ];

  return (
    <div className="relative w-screen h-screen bg-[#070707] text-[#e0e0e0] flex flex-col select-none overflow-hidden font-sans">
      {/* Top Integrated Custom Header Bar with Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: smoothEase }}
        onDoubleClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button, nav, a, input, select') || target.tagName === 'BUTTON') {
            return;
          }
          handleMaximize();
        }}
        className="relative z-40 h-11 w-full flex items-center justify-between px-3 border-b border-[#181818] bg-[#0a0a0a]/90 backdrop-blur-md"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: Branding & All Navigation Tabs */}
        <div
          onDoubleClick={(e) => e.stopPropagation()}
          className="flex items-center gap-3.5 select-none"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-6 h-6 object-contain [image-rendering:-webkit-optimize-contrast]"
            />
            <span className="text-[12px] font-bold tracking-wider uppercase text-[#d4d4d4] font-['Barlow_Condensed',sans-serif]">
              ELauncher
            </span>
          </div>

          <div className="w-[1px] h-4 bg-[#202020]" />

          {/* Navigation Tabs on Left */}
          <nav
            onDoubleClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-[#12141a]/90 border border-[#222530] p-1 rounded-xl"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    playPalateClick(0.24);
                    setCurrentTab(item.id);
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className={`relative min-w-[92px] px-3.5 h-7 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] ${
                    isActive
                      ? 'text-white'
                      : 'text-[#72798c] hover:text-white hover:bg-[#1a1c24]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="header-active-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-[#242836] border border-[#3b4156] shadow-sm -skew-x-6"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <AnimatedText text={item.label} className="text-[13px] tracking-widest" />
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side: Prominent Standalone Console Button & Window Controls */}
        <div
          onDoubleClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2.5 h-full -mr-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Prominent Visible Standalone Console Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playPalateClick(0.24);
              setCurrentTab(currentTab === 'console' ? 'play' : 'console');
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            title={currentTab === 'console' ? t.close : t.openConsole}
            className={`group relative h-8 px-3.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border font-['Barlow_Condensed',sans-serif] min-w-[104px] justify-center ${
              currentTab === 'console'
                ? 'bg-[#1e2333] border-[#3e4663] text-white shadow-sm'
                : isGameRunning
                ? 'bg-[#101b17] border-[#1d4332] text-[#5eead4] hover:border-[#2dd4bf] hover:bg-[#15241f]'
                : 'bg-[#12141c]/95 border-[#222634] text-[#8e96ac] hover:text-white hover:bg-[#1a1d29] hover:border-[#353b50]'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0 text-[#8e96ac] group-hover:text-white transition-colors" />
            <AnimatedText text={t.consoleTitle} className="text-[13px] tracking-widest font-extrabold leading-none" />
          </button>

          <div className="w-[1px] h-4 self-center bg-[#202020] mx-0.5" />

          {/* Window & Settings Strip */}
          <div className="flex items-stretch h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPalateClick(0.25);
                setIsSettingsOpen(true);
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              title="Settings"
              className="w-10 h-full flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#161616] transition-colors cursor-pointer select-none"
            >
              <Settings className="w-4 h-4 pointer-events-none" />
            </button>

            <div className="w-[1px] h-4 self-center bg-[#202020] mx-0.5" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                playPalateClick(0.18);
                handleToggleFullscreen();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'}
              className="w-10 h-full flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 pointer-events-none" /> : <Maximize2 className="w-3.5 h-3.5 pointer-events-none" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPalateClick(0.18);
                handleMinimize();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              title="Minimize"
              className="w-10 h-full flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 pointer-events-none" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPalateClick(0.18);
                handleMaximize();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              title={isMaximized || isFullscreen ? 'Restore' : 'Maximize'}
              className="w-10 h-full flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              {isMaximized || isFullscreen ? (
                /* Two overlapping smooth rounded rectangles (Windows 11 Restore icon) */
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none">
                  <path
                    d="M3.75 2H9.8C10.46 2 11 2.54 11 3.2V9.25"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="1"
                    y="2.75"
                    width="8.25"
                    height="8.25"
                    rx="1.75"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
              ) : (
                /* Single smooth rounded square (Windows 11 Maximize icon) */
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="pointer-events-none">
                  <rect
                    x="1.25"
                    y="1.25"
                    width="9.5"
                    height="9.5"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playPalateClick(0.2);
                handleClose();
              }}
              onDoubleClick={(e) => e.stopPropagation()}
              title="Close"
              className="w-12 h-full flex items-center justify-center text-[#cbd5e1] hover:text-white hover:bg-[#e11d48] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.2] pointer-events-none" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Single-Screen Area (Full Width without Sidebar) */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Main Canvas Area */}
        <main className="relative z-10 flex-1 w-full h-full overflow-hidden bg-[#070707]">
          {/* Subtle geometric dot grid base */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          {/* Real-time WebGL Dither Wave Background (like nedohackers.site) */}
          <DitherWaveCanvas currentTab={currentTab} />

          {/* Subtle vignette darkening towards edges */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,#070707_95%)]" />

          <AnimatePresence mode="wait">
            {currentTab === 'play' ? (
              /* Play Screen: Smooth pure opacity fade */
              <motion.div
                key="play-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 overflow-hidden pointer-events-auto"
              >
                <div className="max-w-[490px] w-full flex flex-col items-center justify-center gap-5 -mt-4">
                {/* Center Logo - elevated and large with aggressive racing drop-shadow */}
                <div className="select-none pointer-events-none relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-white/10 via-white/5 to-transparent blur-2xl rounded-full opacity-40 pointer-events-none" />
                  <img
                    src="/logo.png"
                    alt="Eternal Logo"
                    className="relative w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
                  />
                </div>

                {/* Instance Card + Play Button (or Transformed Game Running State) */}
                <div className="w-full flex flex-col gap-3.5">
                  {isGameRunning ? (
                    /* Transformed Active Game Dashboard */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: smoothEase }}
                      className="relative w-full bg-[#0d0f14]/95 backdrop-blur-2xl border border-[#222736] rounded-2xl p-5 sm:p-6 flex flex-col gap-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
                    >
                      {/* Active Status Header */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80 border border-[#10b981]/40 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-mono font-bold tracking-widest text-[#94a3b8] uppercase">
                              {t.gameRunningTitle}
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-white font-['Barlow_Condensed',sans-serif] tracking-wide leading-tight">
                              {selectedInstance ? selectedInstance.name : 'Minecraft'}
                            </span>
                          </div>
                        </div>

                        {selectedInstance && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#141620] border border-[#232838] text-xs font-mono text-[#cbd5e1] shrink-0">
                            <span>{selectedInstance.version}</span>
                            <span className="text-[#3b4156]">•</span>
                            <span>{selectedInstance.loader}</span>
                          </div>
                        )}
                      </div>

                      {/* Runtime Status Row */}
                      <div className="pt-3 border-t border-[#1a1e2a] flex items-center justify-between text-xs font-mono text-[#828a9e]">
                        <span>{t.gameRunningStatus}</span>
                        <button
                          onClick={() => {
                            playPalateClick(0.24);
                            setCurrentTab('console');
                          }}
                          className="text-white hover:text-[#5eead4] flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>{t.openConsole}</span>
                        </button>
                      </div>

                      {/* Action Buttons: Stop & Open Console */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => {
                            playPalateClick(0.24);
                            setCurrentTab('console');
                          }}
                          className="h-12 px-4 rounded-xl bg-[#141824] hover:bg-[#1e2336] active:scale-98 text-white border border-[#2b334d] hover:border-[#424e75] font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-['Barlow_Condensed',sans-serif]"
                        >
                          <Terminal className="w-4 h-4 text-[#8e96ac]" />
                          <span>{t.openConsole}</span>
                        </button>

                        <button
                          onClick={() => {
                            playPalateClick(0.35);
                            handleStopGame();
                          }}
                          className="h-12 px-4 rounded-xl bg-[#281316] hover:bg-[#3d1a1f] active:scale-98 text-[#ff8080] hover:text-[#ff9999] border border-[#522026] hover:border-[#732a34] font-black text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-['Barlow_Condensed',sans-serif]"
                        >
                          <X className="w-4 h-4 stroke-[2.5]" />
                          <span>{t.stopGame}</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Default Launch Card + Play Button */
                    <>
                      <div className="relative w-full bg-[#0c0d12]/92 backdrop-blur-2xl border border-[#232734] hover:border-[#383e52] transition-all rounded-2xl px-5 py-4 flex flex-col justify-center shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
                        <div className="flex items-center justify-between gap-4">
                          {/* Left: Launcher Brand, Instance Name & Specs */}
                          <div className="flex flex-col justify-center min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <div className="flex items-center">
                                <img
                                  src="/letter_e_tight.png"
                                  alt="E"
                                  className="h-4.5 sm:h-5 w-auto object-contain inline-block -mr-[2px]"
                                />
                                <span 
                                  style={{ transform: 'skewX(-10deg)' }}
                                  className="text-lg sm:text-xl font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif] leading-none inline-block origin-bottom"
                                >
                                  LAUNCHER
                                </span>
                              </div>
                            </div>
                            {/* Two-row specs: Instance Name first, then Version & Loader */}
                            {selectedInstance ? (
                              <div className="mt-1 flex flex-col gap-0.5">
                                <span className="text-[13px] font-bold text-white tracking-wide truncate max-w-[170px] font-['Barlow_Condensed',sans-serif]">
                                  {selectedInstance.name}
                                </span>
                                <div className="text-[11px] font-mono text-[#8b92a5] flex items-center gap-1.5 leading-none">
                                  <span className="text-[#c3c8d8]">{selectedInstance.version}</span>
                                  <span className="text-[#3b4156]">•</span>
                                  <span className="text-[#9ea6bb]">{selectedInstance.loader}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono text-[#71788d] mt-1">
                                {t.noInstanceSelected}
                              </span>
                            )}
                          </div>

                          {/* Right: Active Account & Instances Button aligned in a single row */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            {/* Active Account Quick Badge */}
                            <button
                              onClick={() => {
                                playPalateClick(0.24);
                                setCurrentTab('accounts');
                              }}
                              title={activeAccount ? `${activeAccount.username} (${activeAccount.type.toUpperCase()})` : t.accounts}
                              className="group flex items-center gap-2.5 h-11 px-3 rounded-xl bg-[#13151f]/90 hover:bg-[#1c1f2e] border border-[#232736] hover:border-[#3d4560] transition-all cursor-pointer select-none"
                            >
                              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#0c0d12] border border-[#2b3044] shrink-0 flex items-center justify-center shadow-inner">
                                {activeAccount ? (
                                  <AccountAvatar account={activeAccount} size={28} className="w-full h-full object-cover [image-rendering:pixelated]" />
                                ) : (
                                  <User className="w-4 h-4 text-[#737a8f]" />
                                )}
                              </div>
                              <div className="flex flex-col text-left justify-center pr-1 min-w-0">
                                <span className="text-xs font-bold text-[#e1e5f2] group-hover:text-white leading-tight font-['Barlow_Condensed',sans-serif] tracking-wider max-w-[95px] sm:max-w-[120px] truncate">
                                  {activeAccount ? activeAccount.username : t.accounts}
                                </span>
                                <span className="text-[10px] font-mono flex items-center gap-1 text-[#788099] leading-none mt-0.5">
                                  {activeAccount?.type === 'elyby' ? (
                                    <>
                                      <ElyByIcon className="w-2.5 h-2.5" />
                                      <span>Ely.by</span>
                                    </>
                                  ) : activeAccount ? (
                                    <>
                                      <OfflineIcon className="w-2.5 h-2.5" />
                                      <span>Offline</span>
                                    </>
                                  ) : (
                                    <span>—</span>
                                  )}
                                </span>
                              </div>
                            </button>

                            {/* Clean Racing "Instances" Button */}
                            <button
                              onClick={() => {
                                playPalateClick(0.3);
                                setCurrentTab('instances');
                              }}
                              title={t.selectInstanceButton}
                              className="group relative px-5 sm:px-6 h-11 rounded-xl bg-[#14161f] hover:bg-[#1e2230] active:scale-95 border border-[#2b3042] hover:border-white/60 transition-all cursor-pointer shadow-md overflow-hidden shrink-0 flex items-center justify-center"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out" />
                              <span className="block text-sm font-black uppercase tracking-widest text-[#e0e4f0] group-hover:text-white font-['Barlow_Condensed',sans-serif]">
                                <AnimatedText text={t.selectInstanceButton} />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Clean Action Button (DOWNLOAD or PLAY) */}
                      {!isInstalledLocally ? (
                        <motion.button
                          whileHover={{ scale: downloadProgress ? 1 : 1.015 }}
                          whileTap={{ scale: downloadProgress ? 1 : 0.985 }}
                          disabled={downloadProgress !== null}
                          onClick={() => {
                            playPalateClick(0.38);
                            handleDownloadGame();
                          }}
                          className={`relative group w-full h-14 rounded-2xl ${
                            downloadProgress
                              ? 'bg-[#151924] border-[#2c344a] text-white cursor-wait'
                              : 'bg-white hover:bg-[#f2f4f8] active:bg-[#d6dae4] text-black border-white cursor-pointer shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(255,255,255,0.2)]'
                          } font-black text-base tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 overflow-hidden border font-['Barlow_Condensed',sans-serif]`}
                        >
                          {downloadProgress && (
                            <div
                              className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-200"
                              style={{ width: `${downloadProgress.progress}%` }}
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />

                          <span className="relative flex items-center gap-2.5 font-black text-lg tracking-[0.2em]">
                            {downloadProgress ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                                <span>{t.downloadingGame} ({downloadProgress.progress}%)</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-5 h-5 stroke-[2.5] text-black group-hover:scale-110 transition-transform" />
                                <AnimatedText text={t.downloadGame} />
                              </>
                            )}
                          </span>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => {
                            playPalateClick(0.38);
                            handleLaunchGame();
                          }}
                          className="relative group w-full h-14 rounded-2xl bg-white hover:bg-[#f2f4f8] active:bg-[#d6dae4] text-black font-black text-base tracking-[0.25em] uppercase transition-all cursor-pointer flex items-center justify-center gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(255,255,255,0.2)] overflow-hidden border border-white font-['Barlow_Condensed',sans-serif]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                          <span className="flex items-center gap-2.5 font-black text-lg tracking-[0.2em]">
                            <Play className="w-5 h-5 fill-black stroke-black group-hover:scale-110 transition-transform" />
                            <AnimatedText text={t.launchGame} />
                          </span>
                        </motion.button>
                      )}
                    </>
                  )}
                </div>
                </div>
              </motion.div>
            ) : currentTab === 'instances' ? (
              <motion.div
                key="instances-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 z-10 overflow-hidden flex flex-col pointer-events-auto"
              >
                <InstancesView
                  instances={instances}
                  selectedInstanceId={selectedInstanceId}
                  language={settings.language}
                  instancesPath={settings.instancesPath}
                  onSelectInstance={(id) => {
                    setSelectedInstanceId(id);
                  }}
                  onCreateInstance={handleCreateInstance}
                  onUpdateInstance={handleUpdateInstance}
                  onDeleteInstance={handleDeleteInstance}
                />
              </motion.div>
            ) : currentTab === 'mods' ? (
              <motion.div
                key="mods-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 z-10 overflow-hidden flex flex-col pointer-events-auto"
              >
                <ModsView
                  instances={instances}
                  selectedInstanceId={selectedInstanceId}
                  language={settings.language}
                  instancesPath={settings.instancesPath}
                  onSelectInstance={(id) => {
                    setSelectedInstanceId(id);
                  }}
                />
              </motion.div>
            ) : currentTab === 'console' ? (
              <motion.div
                key="console-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 z-10 overflow-hidden flex flex-col pointer-events-auto"
              >
                <ConsoleView
                  selectedInstance={selectedInstance}
                  isRunning={isGameRunning}
                  language={settings.language}
                  onLaunch={handleLaunchGame}
                  onStop={handleStopGame}
                  logs={logs}
                  rawFullLog={rawFullLog}
                  onClearLogs={handleClearLogs}
                />
              </motion.div>
            ) : currentTab === 'accounts' ? (
              <motion.div
                key="accounts-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 z-10 overflow-hidden flex flex-col pointer-events-auto"
              >
                <AccountsView
                  accounts={accounts}
                  activeAccountId={activeAccountId}
                  language={settings.language}
                  onSelectAccount={handleSelectAccount}
                  onAddAccount={handleAddAccount}
                  onDeleteAccount={handleDeleteAccount}
                  onUpdateAccount={handleUpdateAccount}
                />
              </motion.div>
            ) : (
              <motion.div
                key={currentTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 z-10"
              />
            )}
          </AnimatePresence>

          {/* Centered Modal Window for Settings with Cine-Motion Fade & Scale */}
          <AnimatePresence>
            {isSettingsOpen && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.3, ease: smoothEase }}
                  className="relative z-10 w-[94%] max-w-[1100px] h-[86%] max-h-[720px] rounded-2xl border border-[#222530] bg-[#0c0d12]/95 backdrop-blur-2xl shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
                >
                  <div className="h-12 px-5 border-b border-[#1c1f28] flex items-center justify-between bg-[#0e1015] select-none">
                    <span className="text-xs font-mono tracking-widest uppercase text-[#888ea0] font-semibold">
                      {t.settingsTitle}
                    </span>
                    <button
                      onClick={() => {
                        playPalateClick(0.2);
                        setIsSettingsOpen(false);
                      }}
                      title={t.close}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#1a1c24] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 pointer-events-none" />
                    </button>
                  </div>

                  {/* Settings Modal Body */}
                  <SettingsModalContent
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onClose={() => setIsSettingsOpen(false)}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>



          {/* No Instance Selected Alert Modal */}
          <AnimatePresence>
            {showNoInstanceModal && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowNoInstanceModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.28, ease: smoothEase }}
                  className="relative z-10 w-full max-w-md rounded-2xl border border-[#262b3a] bg-[#0c0d12] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
                >
                  <div className="h-12 px-5 border-b border-[#1c1e29] flex items-center justify-between bg-[#10121a]">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#c0c6d6]">
                      {t.selectInstanceFirst}
                    </span>
                    <button
                      onClick={() => setShowNoInstanceModal(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#1c1f2b] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-[#d6dae4] leading-relaxed">
                      {t.chooseInstanceToPlay}
                    </p>

                    <div className="pt-3 border-t border-[#1c1e29] flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowNoInstanceModal(false)}
                        className="px-4 h-10 rounded-xl bg-transparent hover:bg-[#161822] text-[#8e96ac] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-['Barlow_Condensed',sans-serif]"
                      >
                        {t.close}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playPalateClick(0.3);
                          setShowNoInstanceModal(false);
                          setCurrentTab('instances');
                        }}
                        className="px-5 h-10 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
                      >
                        {t.goToInstances}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Offline Play Alert Modal */}
          <AnimatePresence>
            {showOfflineModal && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setShowOfflineModal(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  transition={{ duration: 0.28, ease: smoothEase }}
                  className="relative z-10 w-full max-w-md rounded-2xl border border-[#44232a] bg-[#0d0c12] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
                >
                  <div className="h-12 px-5 border-b border-[#2b171c] flex items-center justify-between bg-[#160f12]">
                    <span className="text-xs font-mono font-bold tracking-wider uppercase text-red-400">
                      {t.modsOfflineTitle}
                    </span>
                    <button
                      onClick={() => setShowOfflineModal(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#25151b] transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-[#e4d6d8] leading-relaxed">
                      {t.modsOfflinePlayAlert}
                    </p>

                    <div className="pt-3 border-t border-[#2a171d] flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setShowOfflineModal(false)}
                        className="px-5 h-10 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
                      >
                        {t.close}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
