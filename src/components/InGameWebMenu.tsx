import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Globe2,
  Settings as SettingsIcon,
  LogOut,
  Languages,
  Check,
  Minus,
  X,
  RotateCcw,
} from 'lucide-react';
import { playPalateClick } from '../utils/sound';
import { type Language } from '../utils/i18n';

interface InGameWebMenuProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSingleplayer: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
  onVanilla?: () => void;
  onQuit: () => void;
}

const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function InGameWebMenu({
  language,
  onLanguageChange,
  onSingleplayer,
  onMultiplayer,
  onSettings,
  onVanilla,
  onQuit,
}: InGameWebMenuProps) {
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [guiScale, setGuiScale] = useState(1);
  const [windowH, setWindowH] = useState(720);

  // Dynamic responsive scaling for ANY window resolution (windowed 854x480 up to 4K)
  useEffect(() => {
    const updateScale = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      setWindowH(h);

      // Base unscaled height of center content is ~270px (logo + 4 buttons + margins)
      const availH = Math.max(100, h - (h < 560 ? 56 : 90));
      const availW = Math.max(100, w - 40);
      const scaleByH = availH / 285;
      const scaleByW = availW / 410;
      const target = Math.min(1.08, Math.min(scaleByH, scaleByW));
      setGuiScale(Math.max(0.68, target));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const langNames: Record<Language, { label: string; code: string }> = {
    en: { label: 'English (US)', code: 'EN' },
    en_uk: { label: 'English (UK)', code: 'UK' },
    ru: { label: 'Русский', code: 'RU' },
  };

  const isCompact = windowH < 560;

  const menuButtons = [
    {
      id: 'singleplayer',
      title: language === 'ru' ? 'Одиночная игра' : 'Singleplayer',
      subtitle: language === 'ru' ? 'Локальные миры' : 'Singleplayer worlds',
      icon: User,
      onClick: onSingleplayer,
    },
    {
      id: 'multiplayer',
      title: language === 'ru' ? 'Сетевая игра' : 'Multiplayer',
      subtitle: language === 'ru' ? 'Серверы' : 'Multiplayer servers',
      icon: Globe2,
      onClick: onMultiplayer,
    },
    {
      id: 'settings',
      title: language === 'ru' ? 'Настройки' : 'Settings',
      subtitle: language === 'ru' ? 'Настройки игры' : 'Game settings',
      icon: SettingsIcon,
      onClick: onSettings,
    },
    {
      id: 'quit',
      title: language === 'ru' ? 'Выход' : 'Quit Game',
      subtitle: language === 'ru' ? 'Выход из игры' : 'Quit Minecraft',
      icon: LogOut,
      onClick: onQuit,
      danger: true,
    },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050608] text-[#f1f5f9] flex flex-col justify-between font-sans">
      {/* Solid Opaque Backdrop: Guaranteed 100% opacity so vanilla Minecraft UI NEVER shines through */}
      <div className="absolute inset-0 bg-[#050608]" />

      {/* Background Layer: Minecraft Voxel Landscape */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter brightness-90 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: 'url(/menu_background.jpg)',
        }}
      />

      {/* Atmospheric Overlays: Dark obsidian gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/50 to-[#06070a]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050608_95%)] pointer-events-none" />

      {/* Top Header Bar: Unified Dark TitleBar directly matching the Launcher with custom window controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: smoothEase }}
        className="relative z-40 h-11 w-full flex items-center justify-between px-3 border-b border-[#181818] bg-[#0a0a0a]/90 backdrop-blur-md select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Left: Launcher Logo & Title */}
        <div
          className="flex items-center gap-2.5 select-none"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <img
            src="/logo.png"
            alt="Logo"
            className="w-5 h-5 object-contain [image-rendering:-webkit-optimize-contrast]"
          />
          <span className="text-[12px] font-bold tracking-wider uppercase text-[#d4d4d4] font-['Barlow_Condensed',sans-serif]">
            ELauncher
          </span>
          <div className="w-[1px] h-3.5 bg-[#202020] mx-1" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#64748b] font-['Barlow_Condensed',sans-serif]">
            Menu
          </span>
        </div>

        {/* Right: Language Selector & Window Control Buttons */}
        <div
          className="flex items-center gap-2 h-full -mr-3"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Switch to Classic Vanilla GUI button */}
          {onVanilla && (
            <button
              onClick={() => {
                playPalateClick(0.24);
                onVanilla();
              }}
              title={
                language === 'ru'
                  ? 'Переключиться на стандартное меню игры'
                  : 'Switch to classic vanilla Minecraft menu'
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12141c]/90 hover:bg-[#1a1d29] border border-[#222634] hover:border-[#38bdf8]/50 transition-colors duration-150 cursor-pointer group shadow-sm mr-1"
            >
              <RotateCcw className="w-3 h-3 text-[#94a3b8] group-hover:text-[#38bdf8] transition-colors duration-150" />
              <span className="text-[11px] font-bold tracking-wider uppercase font-['Barlow_Condensed',sans-serif] text-[#cbd5e1] group-hover:text-white">
                {language === 'ru' ? 'Ванилла' : 'Vanilla'}
              </span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative mr-1">
            <button
              onClick={() => {
                playPalateClick(0.2);
                setIsLangDropdownOpen((prev) => !prev);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12141c]/90 hover:bg-[#1a1d29] border border-[#222634] hover:border-[#353b50] transition-colors duration-150 cursor-pointer group shadow-sm"
            >
              <Languages className="w-3 h-3 text-[#94a3b8] group-hover:text-white transition-colors duration-150" />
              <span className="text-[11px] font-bold tracking-wider uppercase font-['Barlow_Condensed',sans-serif] text-[#e2e8f0]">
                {langNames[language]?.code || 'EN'}
              </span>
            </button>

            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12, ease: smoothEase }}
                  className="absolute right-0 mt-2 w-40 rounded-xl bg-[#0c0e14]/98 border border-[#262c3d] shadow-2xl p-1 z-50 overflow-hidden"
                >
                  {(['en', 'en_uk', 'ru'] as Language[]).map((langKey) => {
                    const isSelected = language === langKey;
                    return (
                      <button
                        key={langKey}
                        onClick={() => {
                          playPalateClick(0.2);
                          onLanguageChange(langKey);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1e2333] text-white'
                            : 'text-[#94a3b8] hover:bg-[#141824] hover:text-white'
                        }`}
                      >
                        <span>{langNames[langKey].label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-[1px] h-4 self-center bg-[#202020] mx-0.5" />

          {/* Window Control Buttons Strip */}
          <div className="flex items-stretch h-full">
            <button
              onClick={() => {
                playPalateClick(0.18);
                if (window.electronAPI?.minimize) window.electronAPI.minimize();
              }}
              title="Minimize"
              className="w-10 h-full flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5 pointer-events-none" />
            </button>
            <button
              onClick={() => {
                playPalateClick(0.18);
                if (window.electronAPI?.maximize) window.electronAPI.maximize();
              }}
              title="Maximize"
              className="w-10 h-full flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#161616] transition-colors cursor-pointer"
            >
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
            </button>
            <button
              onClick={() => {
                playPalateClick(0.2);
                onQuit();
              }}
              title="Close"
              className="w-12 h-full flex items-center justify-center text-[#cbd5e1] hover:text-white hover:bg-[#e11d48] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.2] pointer-events-none" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Center Stage: Responsively scaled Logo + Menu Buttons */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 overflow-visible">
        <div
          style={{
            transform: `scale(${guiScale})`,
            transformOrigin: 'center center',
          }}
          className="w-full max-w-[560px] flex flex-col items-center justify-center transition-transform duration-300 ease-out"
        >
          {/* Title Header - Official Crisp Large ELauncher Project Brand Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: smoothEase }}
            className={`flex items-center justify-center relative select-none ${
              isCompact ? 'mb-4' : 'mb-6 sm:mb-8'
            }`}
          >
            <img
              src="/title_elauncher_project.png"
              alt="ELauncher Project"
              className={`object-contain select-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.95)] ${
                isCompact ? 'h-12 sm:h-14' : 'h-18 sm:h-22 md:h-26'
              }`}
            />
          </motion.div>

          {/* 4 Main Action Buttons (Instant synchronous GPU-accelerated hover) */}
          <div className={`w-full max-w-[440px] sm:max-w-[470px] flex flex-col ${isCompact ? 'gap-2' : 'gap-2.5'}`}>
            {menuButtons.map((btn, index) => {
              const Icon = btn.icon;
              const isDanger = btn.danger;

              return (
                <motion.div
                  key={btn.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.03, ease: smoothEase }}
                >
                  <button
                    onClick={() => {
                      playPalateClick(0.24);
                      btn.onClick();
                    }}
                    className={`group relative w-full ${
                      isCompact ? 'h-[46px] px-4' : 'h-[52px] px-5'
                    } rounded-2xl flex items-center justify-between border cursor-pointer overflow-hidden transform-gpu transition-all duration-300 ease-out hover:scale-[1.012] active:scale-[0.988] ${
                      isDanger
                        ? 'bg-[#0f1118]/85 hover:bg-[#1c1216]/90 border-[#232736]/80 hover:border-[#7f2633]/80 hover:shadow-[0_8px_24px_rgba(220,38,38,0.12)]'
                        : 'bg-[#0f1118]/85 hover:bg-[#161a26]/90 border-[#232736]/80 hover:border-[#3b455e]/90 hover:shadow-[0_8px_24px_rgba(30,41,59,0.25)]'
                    }`}
                  >
                    <div className="relative z-10 flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300 ease-out ${
                          isDanger
                            ? 'bg-[#1b1d28]/90 text-[#94a3b8] group-hover:bg-[#3b1920] group-hover:text-[#f87171]'
                            : 'bg-[#1b1d28]/90 text-[#94a3b8] group-hover:bg-[#252c3e] group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4 stroke-[2]" />
                      </div>

                      <div className="flex flex-col text-left">
                        <span
                          className={`text-sm sm:text-base font-bold uppercase tracking-wider font-['Barlow_Condensed',sans-serif] transition-colors duration-300 ease-out ${
                            isDanger
                              ? 'text-[#cbd5e1] group-hover:text-[#f87171]'
                              : 'text-[#e2e8f0] group-hover:text-white'
                          }`}
                        >
                          {btn.title}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-[#64748b] group-hover:text-[#94a3b8] transition-colors duration-300 ease-out leading-none">
                          {btn.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Right Arrow / Indicator with smooth hover transition */}
                    <div
                      className={`relative z-10 text-xs font-mono font-bold px-2 py-0.5 rounded-md transition-all duration-300 ease-out group-hover:translate-x-1 ${
                        isDanger
                          ? 'text-[#64748b] group-hover:text-[#f87171]'
                          : 'text-[#475569] group-hover:text-[#cbd5e1]'
                      }`}
                    >
                      →
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subtle bottom buffer spacing */}
      <div className={`${isCompact ? 'h-2' : 'h-3'} pointer-events-none`} />
    </div>
  );
}
