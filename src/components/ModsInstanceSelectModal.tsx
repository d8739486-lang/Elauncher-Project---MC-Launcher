import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Check,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type { Instance } from '../types/instance';
import { LOADER_METADATA } from '../types/instance';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';
import { playPalateClick } from '../utils/sound';
import { AnimatedText } from './AnimatedText';

interface ModsInstanceSelectModalProps {
  instances: Instance[];
  selectedInstanceId: string;
  language?: Language;
  onSelect: (instanceId: string) => void;
  onClose: () => void;
}

const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function ModsInstanceSelectModal({
  instances,
  selectedInstanceId,
  language = 'en',
  onSelect,
  onClose,
}: ModsInstanceSelectModalProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLoader, setFilterLoader] = useState<'ALL' | 'Fabric' | 'NeoForge' | 'Forge' | 'Vanilla'>('ALL');

  const filteredInstances = useMemo(() => {
    return instances.filter((inst) => {
      const matchSearch =
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.version.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLoader = filterLoader === 'ALL' || inst.loader === filterLoader;
      return matchSearch && matchLoader;
    });
  }, [instances, searchQuery, filterLoader]);

  return (
    <div className="fixed top-11 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Dimmed backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
      />

      {/* Floating Centered Window (Expanded & Rich like Instances View) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.28, ease: smoothEase }}
        className="relative z-10 w-full max-w-4xl max-h-[85vh] rounded-2xl border border-[#262a38] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#1c1e29] flex items-center justify-between bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#181b26] border border-[#2a2f42] flex items-center justify-center text-white">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider uppercase text-white font-['Barlow_Condensed',sans-serif]">
                <AnimatedText text={t.modsModalTitle} />
              </h2>
              <p className="text-[11px] font-mono text-[#6c748c]">
                {instances.length}{' '}
                {language === 'ru'
                  ? instances.length === 1
                    ? 'доступная сборка'
                    : 'доступных сборок'
                  : instances.length === 1
                  ? 'available instance'
                  : 'available instances'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playPalateClick(0.2);
              onClose();
            }}
            title={t.close}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#1c1f2b] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-[#181a24] bg-[#0e1017] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6175]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск сборки по названию или версии...' : 'Search instances by name or version...'}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#08090d] border border-[#222534] focus:border-white text-white font-mono text-xs transition-colors outline-hidden placeholder:text-[#4f5568]"
            />
          </div>

          {/* Loader Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['ALL', 'Fabric', 'NeoForge', 'Forge', 'Vanilla'] as const).map((ldr) => {
              const active = filterLoader === ldr;
              return (
                <button
                  key={ldr}
                  onClick={() => {
                    playPalateClick(0.18);
                    setFilterLoader(ldr);
                  }}
                  className={`px-3 h-8 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-[#141622] hover:bg-[#1c2030] text-[#7d879e] hover:text-white border border-[#222636]'
                  }`}
                >
                  {ldr === 'ALL' ? (language === 'ru' ? 'ВСЕ' : 'ALL') : ldr}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instances Grid (Rich cards like in Instances View) */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filteredInstances.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1f2332] rounded-2xl bg-[#0a0b10]">
              <Sparkles className="w-8 h-8 text-[#4a5166] mb-2" />
              <p className="text-sm font-mono text-[#8a92a6]">
                {language === 'ru' ? 'Сборки не найдены' : 'No instances match the filter'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstances.map((inst) => {
                const isSelected = inst.id === selectedInstanceId;
                const isVanilla = inst.loader === 'Vanilla';
                const loaderMeta = LOADER_METADATA[inst.loader] || LOADER_METADATA.Vanilla;

                return (
                  <div
                    key={inst.id}
                    onClick={() => {
                      playPalateClick(0.26);
                      onSelect(inst.id);
                      onClose();
                    }}
                    className={`group relative rounded-2xl border transition-all flex flex-col overflow-hidden p-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#151824] border-white/80 shadow-[0_12px_32px_rgba(255,255,255,0.06)]'
                        : 'bg-[#0f1118] border-[#1e2230] hover:border-[#383e52] hover:bg-[#131622]'
                    }`}
                  >
                    {/* Cover Preview Image */}
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-[#070707] border border-[#1f2230] relative mb-3">
                      <img
                        src={inst.preview}
                        alt={inst.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/previews/preset_default.png';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Loader Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.8 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-sans font-semibold">
                        <img
                          src={loaderMeta.icon}
                          alt={inst.loader}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                          }}
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span>{inst.loader}</span>
                      </div>

                      {/* Vanilla notice badge */}
                      {isVanilla && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.8 rounded-lg bg-[#281316]/90 border border-[#522026] text-[#ff8080] text-[10px] font-mono">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{t.modsModalNoModsBadge}</span>
                        </div>
                      )}
                    </div>

                    {/* Instance Title & Info */}
                    <div className="flex flex-col gap-1 mb-3">
                      <h3 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-white transition-colors">
                        {inst.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#7b8398]">
                        <span>{inst.version}</span>
                        {(inst.modsCount ?? 0) > 0 && (
                          <>
                            <span className="text-[#3b4156]">•</span>
                            <span className="text-[11px] text-[#9ba9c4]">
                              {inst.modsCount}{' '}
                              {language === 'ru'
                                ? (inst.modsCount ?? 0) === 1
                                  ? 'мод'
                                  : (inst.modsCount ?? 0) < 5
                                  ? 'мода'
                                  : 'модов'
                                : (inst.modsCount ?? 0) === 1
                                ? 'mod'
                                : 'mods'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Clear Direct Selection Button */}
                    <div className="mt-auto pt-2.5 border-t border-[#1a1c26]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playPalateClick(0.28);
                          onSelect(inst.id);
                          onClose();
                        }}
                        className={`w-full h-9 rounded-xl text-xs font-black uppercase tracking-wider font-['Barlow_Condensed',sans-serif] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-[#181a26] hover:bg-white text-[#c4cbdd] hover:text-black border border-[#2b3042] hover:border-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <AnimatedText text={isSelected ? t.instanceSelected : t.instanceSelect} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="h-12 px-6 border-t border-[#1c1e29] flex items-center justify-between bg-[#0e1015] shrink-0 text-xs font-mono text-[#6e758a]">
          <div className="flex items-center gap-1.5">
            <span>{t.modsModalSessionHint}</span>
          </div>
          <button
            onClick={() => {
              playPalateClick(0.2);
              onClose();
            }}
            className="px-4 h-8 rounded-lg bg-[#161822] hover:bg-[#202434] text-[#c4cbdd] hover:text-white border border-[#272b3b] font-mono text-xs transition-colors cursor-pointer"
          >
            <AnimatedText text={t.close} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
