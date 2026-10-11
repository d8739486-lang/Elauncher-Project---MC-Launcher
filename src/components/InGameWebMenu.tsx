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
import { type Language, translations } from '../utils/i18n';

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
  const [isGameReady, setIsGameReady] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [guiScale, setGuiScale] = useState(1);
  const [windowH, setWindowH] = useState(720);

  const t = translations[language];

  // Poll agent bridge until Minecraft reaches TitleScreen
  useEffect(() => {
    let isCancelled = false;

    const pollStatus = async () => {
      try {
        if (window.electronAPI?.getAgentStatus) {
          const status = await window.electronAPI.getAgentStatus();
          if (!isCancelled && status?.inMenu) {
            setIsGameReady(true);
            return;
          }
        } else {
          const res = await fetch('http://127.0.0.1:28751/status');
          if (res.ok) {
            const status = await res.json();
            if (!isCancelled && status?.inMenu) {
              setIsGameReady(true);
              return;
            }
          }
        }
      } catch {
        // Retrying while Minecraft starts
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 160);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Dynamic responsive scaling for ANY window resolution (windowed 960x540 up to 4K)
  useEffect(() => {
    const updateScale = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      setWindowH(h);

      const availH = Math.max(100, h - (h < 560 ? 56 : 90));
      const availW = Math.max(100, w - 40);
      const scaleByH = availH / 360;
      const scaleByW = availW / 520;
      const target = Math.min(1.08, Math.min(scaleByH, scaleByW));
      setGuiScale(Math.max(0.72, target));
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
      subtitle: language === 'ru' ? 'Параметры' : 'Game settings',
      icon: SettingsIcon,
      onClick: onSettings,
    },
    {
      id: 'quit',
      title: language === 'ru' ? 'Выход' : 'Quit Game',
      subtitle: language === 'ru' ? 'Закрыть игру' : 'Exit to desktop',
      icon: LogOut,
      onClick: onQuit,
      danger: true,
    },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#050608] text-[#f1f5f9] flex flex-col justify-between font-sans">
      {/* Solid Opaque Backdrop */}
      <div className="absolute inset-0 bg-[#050608]" />

      {/* Background Layer: Minecraft Voxel Landscape */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter brightness-90 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: 'url(/menu_background.jpg)',
        }}
      />

      {/* Atmospheric Overlays: Dark obsidian gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/60 to-[#06070a]/85 pointer-events-none" />
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
            Client
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

      {/* Main Content Area: Smooth Transition between Loading State and Custom Menu GUI */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 overflow-visible">
        <AnimatePresence mode="wait">
          {!isGameReady ? (
            /* Custom Smooth Loading Screen: Center circle with wait a moment... */
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: smoothEase }}
              className="flex flex-col items-center justify-center gap-5 select-none"
            >
              {/* Glowing circular loader */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                {/* Outer pulsing glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.18, 0.42, 0.18],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full bg-[#38bdf8] blur-xl pointer-events-none"
                />

                {/* Rotating SVG Ring */}
                <motion.svg
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="w-full h-full"
                  viewBox="0 0 80 80"
                >
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#1e2433"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3.5"
                    strokeDasharray="50 160"
                    strokeLinecap="round"
                  />
                </motion.svg>

                {/* Inner glowing core */}
                <motion.div
                  animate={{
                    scale: [0.92, 1.08, 0.92],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute w-5 h-5 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] shadow-[0_0_16px_rgba(56,189,248,0.7)]"
                />
              </div>

              {/* Subtitle: "Wait a moment..." / "Подождите..." */}
              <motion.div
                animate={{
                  opacity: [0.75, 1, 0.75],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-center"
              >
                <span className="text-sm sm:text-base font-semibold tracking-wider text-[#cbd5e1] font-['Barlow_Condensed',sans-serif] uppercase">
                  {t.waitAMoment}
                </span>
              </motion.div>
            </motion.div>
          ) : (
            /* Custom Client Main GUI: Brand Title + Smooth Square-Style Action Cards */
            <motion.div
              key="main-menu"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: smoothEase }}
              style={{
                transform: `scale(${guiScale})`,
                transformOrigin: 'center center',
              }}
              className="w-full max-w-[540px] flex flex-col items-center justify-center transition-transform duration-300 ease-out"
            >
              {/* Title Header - Crisp Large ELauncher Project Brand Logo */}
              <div
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
              </div>

              {/* 4 Main Action Cards Styled as Smooth Rounded Squares ("по типу квадратика") */}
              <div className="w-full max-w-[480px] grid grid-cols-2 gap-3 sm:gap-3.5">
                {menuButtons.map((btn, index) => {
                  const Icon = btn.icon;
                  const isDanger = btn.danger;

                  return (
                    <motion.button
                      key={btn.id}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.04, ease: smoothEase }}
                      whileHover={{ scale: 1.025, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        playPalateClick(0.24);
                        btn.onClick();
                      }}
                      className={`group relative flex flex-col items-center justify-center text-center p-4 sm:p-5 rounded-2xl border cursor-pointer overflow-hidden transform-gpu transition-all duration-200 ease-out ${
                        isDanger
                          ? 'bg-[#0f1118]/90 hover:bg-[#1a1116]/95 border-[#232736]/80 hover:border-[#e11d48]/70 hover:shadow-[0_12px_28px_rgba(225,29,72,0.18)]'
                          : 'bg-[#0f1118]/90 hover:bg-[#151926]/95 border-[#232736]/80 hover:border-[#38bdf8]/60 hover:shadow-[0_12px_28px_rgba(56,189,248,0.16)]'
                      }`}
                    >
                      {/* Subtle ambient card glow */}
                      <div
                        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl ${
                          isDanger
                            ? 'bg-gradient-to-b from-[#e11d48]/10 to-transparent'
                            : 'bg-gradient-to-b from-[#38bdf8]/10 to-transparent'
                        }`}
                      />

                      {/* Icon container */}
                      <div
                        className={`relative z-10 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2.5 transition-colors duration-200 ${
                          isDanger
                            ? 'bg-[#1b1d28]/90 text-[#94a3b8] group-hover:bg-[#34161c] group-hover:text-[#f87171]'
                            : 'bg-[#1b1d28]/90 text-[#94a3b8] group-hover:bg-[#1e273b] group-hover:text-[#38bdf8]'
                        }`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                      </div>

                      {/* Title */}
                      <span
                        className={`relative z-10 text-sm sm:text-base font-bold uppercase tracking-wider font-['Barlow_Condensed',sans-serif] transition-colors duration-200 ${
                          isDanger
                            ? 'text-[#cbd5e1] group-hover:text-[#f87171]'
                            : 'text-[#e2e8f0] group-hover:text-white'
                        }`}
                      >
                        {btn.title}
                      </span>

                      {/* Subtitle */}
                      <span className="relative z-10 text-[11px] text-[#64748b] group-hover:text-[#94a3b8] transition-colors duration-200 mt-0.5 leading-tight font-mono">
                        {btn.subtitle}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle bottom buffer spacing */}
      <div className={`${isCompact ? 'h-2' : 'h-3'} pointer-events-none`} />
    </div>
  );
}
