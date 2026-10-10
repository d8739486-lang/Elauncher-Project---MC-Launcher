import { useState, useEffect } from 'react';
import {
  Globe,
  Cpu,
  FolderOpen,
  Check,
  Coffee,
  Download,
  Loader2,
  RefreshCw,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';
import { playPalateClick } from '../utils/sound';
import { AnimatedText } from './AnimatedText';
import type { JavaInfo } from '../types/electron';

export interface AppSettings {
  language: Language;
  ramMb: number;
  instancesPath: string;
  launcherPath: string;
  selectedJavaVersion?: 'auto' | '8' | '11' | '17' | '21' | '25' | '27' | string;
  customJavaPath?: string;
}

interface SettingsModalContentProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClose: () => void;
}

const DEFAULT_RAM_MB = 4096;

function UsaFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-xs overflow-hidden shadow-xs shrink-0" viewBox="0 0 640 480">
      <path fill="#bd3d44" d="M0 0h640v480H0z"/>
      <path stroke="#fff" strokeWidth="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/>
      <path fill="#192f5d" d="M0 0h256v258.5H0z"/>
      <circle cx="128" cy="129" r="6" fill="#fff"/>
      <circle cx="64" cy="64" r="5" fill="#fff"/>
      <circle cx="192" cy="64" r="5" fill="#fff"/>
      <circle cx="64" cy="192" r="5" fill="#fff"/>
      <circle cx="192" cy="192" r="5" fill="#fff"/>
      <circle cx="128" cy="64" r="5" fill="#fff"/>
      <circle cx="128" cy="192" r="5" fill="#fff"/>
    </svg>
  );
}

function UkFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-xs overflow-hidden shadow-xs shrink-0" viewBox="0 0 60 30">
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z"/>
      </clipPath>
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
      </clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  );
}

function RussianFlag() {
  return (
    <svg className="w-5 h-3.5 rounded-xs overflow-hidden shadow-xs shrink-0" viewBox="0 0 640 480">
      <path fill="#fff" d="M0 0h640v160H0z"/>
      <path fill="#0039a6" d="M0 160h640v160H0z"/>
      <path fill="#d52b1e" d="M0 320h640v160H0z"/>
    </svg>
  );
}

export function SettingsModalContent({
  settings,
  onUpdateSettings,
  onClose: _onClose,
}: SettingsModalContentProps) {
  const t = translations[settings.language];

  // Detected system info
  const [totalSystemRamMb, setTotalSystemRamMb] = useState<number>(16384);
  const [defaultPaths, setDefaultPaths] = useState<{ instances: string; launcher: string }>({
    instances: 'C:\\Users\\User\\AppData\\Roaming\\.minecraft',
    launcher: 'C:\\Users\\User\\AppData\\Roaming\\ELauncher',
  });

  // Java runtime detection and download state
  const [detectedJavas, setDetectedJavas] = useState<JavaInfo[]>([]);
  const [javaDownloads, setJavaDownloads] = useState<Record<number, { progress: number; status: string }>>({});
  const [isScanningJavas, setIsScanningJavas] = useState(false);
  const [isJavaDropdownOpen, setIsJavaDropdownOpen] = useState(false);

  const refreshJavas = () => {
    if (window.electronAPI?.detectSystemJavas) {
      window.electronAPI.detectSystemJavas(settings.launcherPath).then((list) => {
        setDetectedJavas(list || []);
      });
    }
  };

  const handleScanJavas = async () => {
    playPalateClick(0.24);
    setIsScanningJavas(true);
    try {
      if (window.electronAPI?.detectSystemJavas) {
        const list = await window.electronAPI.detectSystemJavas(settings.launcherPath);
        setDetectedJavas(list || []);
      }
    } catch (err) {
      console.error('Failed to scan system Javas:', err);
    } finally {
      setIsScanningJavas(false);
    }
  };

  const handleBrowseJavaFile = async () => {
    playPalateClick(0.24);
    if (window.electronAPI?.selectJavaFile) {
      try {
        const selected = await window.electronAPI.selectJavaFile(settings.customJavaPath);
        if (selected) {
          onUpdateSettings({ customJavaPath: selected });
          handleScanJavas();
        }
      } catch (err) {
        console.error('Failed to select Java file:', err);
      }
    }
  };

  useEffect(() => {
    refreshJavas();
    let cleanup: (() => void) | undefined;
    if (window.electronAPI?.onJavaDownloadProgress) {
      cleanup = window.electronAPI.onJavaDownloadProgress((data) => {
        setJavaDownloads((prev) => ({
          ...prev,
          [data.major]: { progress: data.progress, status: data.status },
        }));

        if (data.progress >= 100) {
          setTimeout(() => {
            setJavaDownloads((prev) => {
              const next = { ...prev };
              delete next[data.major];
              return next;
            });
            refreshJavas();
          }, 1200);
        }
      });
    }
    return () => {
      cleanup?.();
    };
  }, [settings.launcherPath]);

  const handleInstallJava = async (major: number) => {
    if (javaDownloads[major]) return;
    playPalateClick(0.3);
    if (window.electronAPI?.downloadJavaRuntime) {
      try {
        setJavaDownloads((prev) => ({
          ...prev,
          [major]: { progress: 0, status: 'Initializing download...' },
        }));
        const res = await window.electronAPI.downloadJavaRuntime({
          launcherPath: settings.launcherPath,
          major,
        });
        if (res && !res.success) {
          console.error('Failed to download Java runtime:', res.error);
          setJavaDownloads((prev) => {
            const next = { ...prev };
            delete next[major];
            return next;
          });
          return;
        }
        if (res?.javaPath) {
          onUpdateSettings({ customJavaPath: res.javaPath, selectedJavaVersion: String(major) });
        }
        refreshJavas();
      } catch (err) {
        console.error('Failed to download Java runtime:', err);
        setJavaDownloads((prev) => {
          const next = { ...prev };
          delete next[major];
          return next;
        });
      }
    }
  };

  useEffect(() => {
    if (window.electronAPI?.getSystemInfo) {
      window.electronAPI.getSystemInfo().then((info) => {
        if (info.totalMemMb) setTotalSystemRamMb(info.totalMemMb);
        setDefaultPaths({
          instances: info.defaultInstancesPath,
          launcher: info.defaultLauncherPath,
        });

        // If paths are empty or unset or contains legacy EternalLauncher, initialize with detected defaults
        if (!settings.instancesPath) {
          onUpdateSettings({ instancesPath: info.defaultInstancesPath });
        }
        if (!settings.launcherPath || settings.launcherPath.includes('EternalLauncher')) {
          onUpdateSettings({ launcherPath: info.defaultLauncherPath });
        }
      });
    }
  }, []);


  const handleOpenInstancesPath = async () => {
    playPalateClick(0.24);
    const targetPath = settings.instancesPath || defaultPaths.instances;
    if (window.electronAPI?.openPath) {
      try {
        await window.electronAPI.openPath(targetPath);
        return;
      } catch (err) {
        console.error('Failed to open path via electronAPI:', err);
      }
    }
  };

  const handleOpenLauncherPath = async () => {
    playPalateClick(0.24);
    const targetPath = settings.launcherPath || defaultPaths.launcher;
    if (window.electronAPI?.openPath) {
      try {
        await window.electronAPI.openPath(targetPath);
        return;
      } catch (err) {
        console.error('Failed to open path via electronAPI:', err);
      }
    }
  };

  const ramPresets = [
    { label: t.preset2Gb, val: 2048 },
    { label: t.preset4Gb, val: 4096 },
    { label: t.preset6Gb, val: 6144 },
    { label: t.preset8Gb, val: 8192 },
  ];

  return (
    <div className="flex-1 bg-[#0c0d12]/60 overflow-y-auto p-6 sm:p-8 select-none">
      <div className="max-w-4xl mx-auto space-y-7">
        {/* Section 1: Language */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base tracking-wide">
              <Globe className="w-4 h-4 text-[#8e96ac]" />
              <AnimatedText text={t.languageSectionTitle} />
            </div>
            <p className="text-xs font-mono text-[#7b8398] mt-1">
              <AnimatedText text={t.languageSectionDesc} />
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* English (US) */}
            <button
              onClick={() => {
                playPalateClick(0.28);
                onUpdateSettings({ language: 'en' });
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                settings.language === 'en'
                  ? 'bg-[#151824] border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                  : 'bg-[#0f1118] border-[#1e2230] text-[#8e96ac] hover:border-[#383e52] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UsaFlag />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold tracking-wide text-white truncate">English (US)</span>
                  <span className="text-[10px] font-mono text-[#6c748c] mt-0.5 truncate">
                    Standard
                  </span>
                </div>
              </div>
              {settings.language === 'en' && (
                <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Bri'ish English */}
            <button
              onClick={() => {
                playPalateClick(0.28);
                onUpdateSettings({ language: 'en_uk' });
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                settings.language === 'en_uk'
                  ? 'bg-[#151824] border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                  : 'bg-[#0f1118] border-[#1e2230] text-[#8e96ac] hover:border-[#383e52] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UkFlag />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold tracking-wide text-white truncate">Bri'ish</span>
                  <span className="text-[10px] font-mono text-[#6c748c] mt-0.5 truncate" title="Bo'o o' wa'a">
                    Bo'o o' wa'a
                  </span>
                </div>
              </div>
              {settings.language === 'en_uk' && (
                <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Russian */}
            <button
              onClick={() => {
                playPalateClick(0.28);
                onUpdateSettings({ language: 'ru' });
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                settings.language === 'ru'
                  ? 'bg-[#151824] border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                  : 'bg-[#0f1118] border-[#1e2230] text-[#8e96ac] hover:border-[#383e52] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RussianFlag />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold tracking-wide text-white truncate">Русский</span>
                  <span className="text-[10px] font-mono text-[#6c748c] mt-0.5 truncate">
                    Локализация
                  </span>
                </div>
              </div>
              {settings.language === 'ru' && (
                <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Section 2: Memory Allocation (RAM) */}
        <div className="space-y-4 pt-4 border-t border-[#1c1f2b]">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base tracking-wide">
              <Cpu className="w-4 h-4 text-[#8e96ac]" />
              <AnimatedText text={t.memorySectionTitle} />
            </div>
            <p className="text-xs font-mono text-[#7b8398] mt-1">
              <AnimatedText text={t.memorySectionDesc} />
            </p>
          </div>

          {/* Current RAM Indicator & Slider */}
                <div className="p-5 rounded-2xl bg-[#0f1118] border border-[#1e2230] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-white">
                        {settings.ramMb}
                      </span>
                      <span className="text-xs font-mono text-[#7b8398] uppercase">
                        {t.memoryMb} ({(settings.ramMb / 1024).toFixed(1)} {t.memoryGb})
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#6c748c]">
                      <span>{t.memoryMax} </span>
                      <span className="text-[#a5adc2] font-bold">
                        {Math.round(totalSystemRamMb / 1024)} {t.memoryGb}
                      </span>
                    </div>
                  </div>

                  {/* Clean Obsidian Slider */}
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1024"
                      max={Math.max(8192, totalSystemRamMb - 1024)}
                      step="512"
                      value={settings.ramMb}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        onUpdateSettings({ ramMb: val });
                      }}
                      className="w-full h-2 bg-[#1b1e2a] rounded-lg appearance-none cursor-pointer accent-white"
                    />

                    <div className="flex justify-between text-[11px] font-mono text-[#5b6379]">
                      <span>1024 {t.memoryMb}</span>
                      <span>{Math.max(8192, totalSystemRamMb - 1024)} {t.memoryMb}</span>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-2 border-t border-[#181a24] flex flex-wrap gap-2">
                    {ramPresets.map((preset) => (
                      <button
                        key={preset.val}
                        onClick={() => {
                          playPalateClick(0.24);
                          onUpdateSettings({ ramMb: preset.val });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                          settings.ramMb === preset.val
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-[#151824] hover:bg-[#1f2334] text-[#8e96ac] hover:text-white border border-[#272b3b]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 3: Java Runtime Environment */}
              <div className="space-y-4 pt-4 border-t border-[#1c1f2b]">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-base tracking-wide">
                    <Coffee className="w-4 h-4 text-[#8e96ac]" />
                    <AnimatedText text={t.javaSectionTitle} />
                  </div>
                  <p className="text-xs font-mono text-[#7b8398] mt-1">
                    <AnimatedText text={t.javaSectionDesc} />
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0f1118] border border-[#1e2230] space-y-4">
                  {/* Version Selector Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Auto Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playPalateClick(0.24);
                        onUpdateSettings({ selectedJavaVersion: 'auto' });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        (settings.selectedJavaVersion || 'auto') === 'auto'
                          ? 'bg-[#151824] border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                          : 'bg-[#0b0c12] border-[#1e2230] text-[#8e96ac] hover:border-[#383e52] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold tracking-wide text-white">
                          {t.javaAuto}
                        </span>
                        {(settings.selectedJavaVersion || 'auto') === 'auto' && (
                          <div className="w-4 h-4 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#6c748c]">
                        1.16 → 8 | 1.18+ → 17 | 1.20.5+ → 21
                      </span>
                    </button>

                    {/* Version 8, 11, 17, 21, 25 Buttons */}
                    {(['8', '11', '17', '21', '25'] as const).map((ver) => {
                      const isSelected = settings.selectedJavaVersion === ver;
                      const isFound = detectedJavas.some((j) => j.major === Number(ver));
                      return (
                        <button
                          key={ver}
                          type="button"
                          onClick={() => {
                            playPalateClick(0.24);
                            onUpdateSettings({ selectedJavaVersion: ver });
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'bg-[#151824] border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                              : 'bg-[#0b0c12] border-[#1e2230] text-[#8e96ac] hover:border-[#383e52] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-bold tracking-wide text-white">
                              Java {ver}
                            </span>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono">
                            <span className={`w-1.5 h-1.5 rounded-full ${isFound ? 'bg-[#34d399]' : 'bg-[#e5a034]'}`} />
                            <span className={isFound ? 'text-[#34d399]' : 'text-[#a5864c]'}>
                              {isFound ? t.javaInstalled : t.javaNotInstalled}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {/* Version 27 LTS (In development) */}
                    <div
                      className="p-3 rounded-xl border bg-[#08090d]/60 border-[#1a1d27] text-[#555d72] cursor-not-allowed flex flex-col justify-between gap-2 relative opacity-60"
                      title={t.javaInDev}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold tracking-wide">
                          Java 27 LTS
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#262b3a] text-[#8ea0c7]">
                          {t.javaInDev}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#4b5266]">
                        Future preview
                      </span>
                    </div>
                  </div>

                  {/* Selected Version Status / Install Box */}
                  <div className="pt-2 border-t border-[#181a24]">
                    {(settings.selectedJavaVersion && settings.selectedJavaVersion !== 'auto') && (
                      (() => {
                        const targetMajor = Number(settings.selectedJavaVersion);
                        const matchingJava = detectedJavas.find((j) => j.major === targetMajor);
                        const currentDownload = javaDownloads[targetMajor];

                        if (currentDownload) {
                          return (
                            <div className="space-y-2 p-3 rounded-xl bg-[#11141f] border border-[#202738]">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-white flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8ea0c7]" />
                                  {currentDownload.status || t.javaInstalling}
                                </span>
                                <span className="text-[#a5adc2] font-bold">
                                  {currentDownload.progress}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-[#1a1d29] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-white transition-all duration-200"
                                  style={{ width: `${currentDownload.progress}%` }}
                                />
                              </div>
                            </div>
                          );
                        }

                        if (matchingJava) {
                          return (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#0b1411] border border-[#163827]">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-xs font-mono">
                                  <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                                  <span className="text-white font-bold">{matchingJava.version} ({matchingJava.vendor})</span>
                                </div>
                                <p className="text-xs font-mono text-[#cbd5e1] truncate mt-0.5" title={matchingJava.path}>
                                  {matchingJava.path}
                                </p>
                              </div>
                              <span className="px-2.5 py-1 rounded-lg bg-[#11261d] border border-[#1b4332] text-[#34d399] font-mono text-xs font-bold shrink-0 self-start sm:self-auto">
                                {t.javaInstalled}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121520] border border-[#222738]">
                            <div>
                              <div className="text-xs font-bold font-mono text-white">
                                Java {targetMajor} — {t.javaNotInstalled}
                              </div>
                              <p className="text-xs font-mono text-[#94a3b8] mt-0.5">
                                Eclipse Adoptium OpenJDK {targetMajor} (x64 Windows)
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleInstallJava(targetMajor)}
                              className="px-4 py-2 rounded-xl bg-white hover:bg-[#f0f2f8] active:scale-98 text-black font-mono font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
                            >
                              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{t.javaInstallBtn}</span>
                            </button>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* Breeze-Style Java Selector & Auto-Detection System */}
                  <div className="pt-3 border-t border-[#181a24] space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1] font-mono flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-[#8ea0c7]" />
                        <span>{t.javaDetectedListTitle}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {settings.customJavaPath && (
                          <button
                            type="button"
                            onClick={() => {
                              playPalateClick(0.24);
                              onUpdateSettings({ customJavaPath: undefined });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1e1518] hover:bg-[#2e1d23] border border-[#4a242c] text-[#f87171] font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title={t.javaResetAuto}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t.javaResetAuto}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleBrowseJavaFile}
                          className="px-3 py-1.5 rounded-lg bg-[#141722] hover:bg-[#1d2232] border border-[#252b3e] text-[#c4cbdd] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={t.javaBrowseBtn}
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>{t.javaBrowseBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleScanJavas}
                          disabled={isScanningJavas}
                          className="px-3 py-1.5 rounded-lg bg-[#141722] hover:bg-[#1d2232] border border-[#252b3e] text-[#c4cbdd] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          title={t.javaScanBtn}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isScanningJavas ? 'animate-spin text-white' : ''}`} />
                          <span>{isScanningJavas ? t.javaScanning : t.javaScanBtn}</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive Dropdown Selector */}
                    <div className="relative">
                      {/* Active Java Card Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          playPalateClick(0.2);
                          setIsJavaDropdownOpen(!isJavaDropdownOpen);
                        }}
                        className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isJavaDropdownOpen
                            ? 'bg-[#151928] border-white shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                            : 'bg-[#08090d] border-[#232736] hover:border-[#3b4156]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#131622] border border-[#232738] flex items-center justify-center shrink-0 text-[#8ea0c7]">
                            <Coffee className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            {settings.customJavaPath ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white font-mono truncate">
                                    {detectedJavas.find((j) => j.path.toLowerCase() === settings.customJavaPath?.toLowerCase())?.name || 'Custom Java Executable'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e2436] text-[#8ea0c7] shrink-0">
                                    Selected
                                  </span>
                                </div>
                                <span className="text-xs font-mono text-[#cbd5e1] truncate mt-1" title={settings.customJavaPath}>
                                  {settings.customJavaPath}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white font-mono truncate">
                                    {t.javaAuto}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#14291f] text-[#34d399] shrink-0">
                                    Optimal
                                  </span>
                                </div>
                                <span className="text-xs font-mono text-[#94a3b8] truncate mt-1">
                                  {detectedJavas.length > 0
                                    ? `${detectedJavas.length} runtime(s) available in system`
                                    : t.javaAutoDesc}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-[#8e96ac] shrink-0 transition-transform duration-200 ${isJavaDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                      </button>

                      {/* Dropdown Menu Options */}
                      {isJavaDropdownOpen && (
                        <div className="mt-2 p-2.5 rounded-xl bg-[#0b0d14] border border-[#232738] shadow-2xl space-y-2 max-h-80 overflow-y-auto z-20">
                          {/* Option 1: Auto */}
                          <button
                            type="button"
                            onClick={() => {
                              playPalateClick(0.24);
                              onUpdateSettings({ customJavaPath: undefined, selectedJavaVersion: 'auto' });
                              setIsJavaDropdownOpen(false);
                            }}
                            className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                              !settings.customJavaPath
                                ? 'bg-[#151824] border-white text-white'
                                : 'bg-[#0e1017] border-[#1c1f2c] text-[#c4cbdd] hover:border-[#383e52] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Coffee className="w-4 h-4 text-[#8ea0c7] shrink-0" />
                              <div className="min-w-0 flex flex-col">
                                <span className="text-sm font-bold text-white font-mono">
                                  {t.javaAuto}
                                </span>
                                <span className="text-xs font-mono text-[#94a3b8] truncate mt-0.5">
                                  {t.javaAutoDesc}
                                </span>
                              </div>
                            </div>
                            {!settings.customJavaPath && (
                              <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>

                          {/* List of Detected System Javas */}
                          {detectedJavas.length === 0 ? (
                            <div className="p-4 text-center text-xs font-mono text-[#94a3b8]">
                              {t.javaNotInstalled} — {t.javaScanBtn}
                            </div>
                          ) : (
                            detectedJavas.map((j, idx) => {
                              const isThisSelected = settings.customJavaPath
                                ? settings.customJavaPath.toLowerCase() === j.path.toLowerCase()
                                : settings.selectedJavaVersion === String(j.major);
                              return (
                                <button
                                  key={`${j.path}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    playPalateClick(0.24);
                                    onUpdateSettings({
                                      customJavaPath: j.path,
                                      selectedJavaVersion: String(j.major),
                                    });
                                    setIsJavaDropdownOpen(false);
                                  }}
                                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                                    isThisSelected
                                      ? 'bg-[#151824] border-white text-white'
                                      : 'bg-[#0e1017] border-[#1c1f2c] text-[#c4cbdd] hover:border-[#383e52] hover:text-white'
                                  }`}
                                >
                                  <div className="min-w-0 flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-[#34d399] shrink-0" />
                                      <span className="text-sm font-bold text-white font-mono truncate">
                                        Java {j.major} {j.vendor && j.vendor !== 'Java' ? `• ${j.vendor}` : ''}
                                      </span>
                                      <span className="text-xs font-mono text-[#94a3b8]">
                                        ({j.version || `JDK ${j.major}`} • {j.arch || '64-bit'})
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono text-[#cbd5e1] truncate mt-1 pl-4" title={j.path}>
                                      {j.path}
                                    </span>
                                  </div>
                                  {isThisSelected && (
                                    <div className="w-5 h-5 rounded-md bg-white text-black flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Manual Path input field fallback */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-mono text-[#94a3b8]">
                        <span>{t.javaCustomPath}</span>
                        <span>java.exe / javaw.exe</span>
                      </div>
                      <input
                        type="text"
                        placeholder="C:\Program Files\Java\jdk-...\bin\java.exe"
                        value={settings.customJavaPath || ''}
                        onChange={(e) => onUpdateSettings({ customJavaPath: e.target.value })}
                        className="w-full h-10 px-3.5 rounded-xl bg-[#08090d] border border-[#232736] focus:border-white text-white font-mono text-xs transition-colors outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Storage Directories (Merged here, without reset button) */}
              <div className="space-y-4 pt-4 border-t border-[#1c1f2b]">
                <div>
                  <h2 className="text-base font-bold text-white tracking-wide">
                    <AnimatedText text={t.directoriesSectionTitle} />
                  </h2>
                  <p className="text-xs font-mono text-[#7b8398] mt-1">
                    <AnimatedText text={t.directoriesSectionDesc} />
                  </p>
                </div>

                {/* Path 1: Instances & .minecraft path */}
                <div className="p-5 rounded-2xl bg-[#0f1118] border border-[#1e2230] space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                      <AnimatedText text={t.instancesPathLabel} />
                    </label>
                    <p className="text-xs font-mono text-[#94a3b8] mt-0.5">
                      <AnimatedText text={t.instancesPathDesc} />
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.instancesPath || defaultPaths.instances}
                      onChange={(e) => onUpdateSettings({ instancesPath: e.target.value })}
                      className="flex-1 h-10 px-3.5 rounded-xl bg-[#08090d] border border-[#232736] focus:border-white text-white font-mono text-xs transition-colors outline-hidden"
                    />
                    <button
                      onClick={handleOpenInstancesPath}
                      className="h-10 px-4 rounded-xl bg-[#151824] hover:bg-[#1f2436] text-[#c4cbdd] hover:text-white border border-[#2b3042] flex items-center gap-2 text-xs font-mono transition-colors cursor-pointer shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <AnimatedText text={t.openFolder} />
                    </button>
                  </div>
                </div>

                {/* Path 2: Launcher Installation directory */}
                <div className="p-5 rounded-2xl bg-[#0f1118] border border-[#1e2230] space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                      <AnimatedText text={t.launcherPathLabel} />
                    </label>
                    <p className="text-xs font-mono text-[#94a3b8] mt-0.5">
                      <AnimatedText text={t.launcherPathDesc} />
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.launcherPath || defaultPaths.launcher}
                      onChange={(e) => onUpdateSettings({ launcherPath: e.target.value })}
                      className="flex-1 h-10 px-3.5 rounded-xl bg-[#08090d] border border-[#232736] focus:border-white text-white font-mono text-xs transition-colors outline-hidden"
                    />
                    <button
                      onClick={handleOpenLauncherPath}
                      className="h-10 px-4 rounded-xl bg-[#151824] hover:bg-[#1f2436] text-[#c4cbdd] hover:text-white border border-[#2b3042] flex items-center gap-2 text-xs font-mono transition-colors cursor-pointer shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <AnimatedText text={t.openFolder} />
                    </button>
                  </div>
                </div>
              </div>
        </div>
      </div>
  );
}

export { DEFAULT_RAM_MB };
