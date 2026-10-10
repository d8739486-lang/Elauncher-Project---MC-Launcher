import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Check,
  X,
  Search,
  Folder,
  Copy,
  ChevronRight,
  RefreshCw,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import {
  PREVIEW_OPTIONS,
  MOD_LOADERS,
  LOADER_METADATA,
  getSupportedLoaders,
} from '../types/instance';
import type { Instance, ModLoader, VersionGroup } from '../types/instance';
import { getStoredVersionGroups, syncOfficialVersions, sortGroupItems } from '../utils/versionSync';
import { playPalateClick } from '../utils/sound';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';

interface InstancesViewProps {
  instances: Instance[];
  selectedInstanceId: string;
  language?: Language;
  onSelectInstance: (id: string) => void;
  onCreateInstance: (instance: Omit<Instance, 'id'>) => void;
  onUpdateInstance: (instance: Instance) => void;
  onDeleteInstance: (id: string) => void;
}

const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function InstancesView({
  instances,
  selectedInstanceId,
  language = 'en',
  onSelectInstance,
  onCreateInstance,
  onUpdateInstance,
  onDeleteInstance,
}: InstancesViewProps) {
  const t = translations[language];
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);

  // Dynamic version catalogue state backed by Mojang auto-sync
  const [versionGroups, setVersionGroups] = useState<VersionGroup[]>(() => getStoredVersionGroups());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const allVersionItems = useMemo(() => {
    return sortGroupItems(versionGroups.flatMap((g) => g.items));
  }, [versionGroups]);

  // Form state
  const [name, setName] = useState('');
  const [version, setVersion] = useState(() => allVersionItems[0]?.id || '26.4');
  const [loader, setLoader] = useState<ModLoader>('Fabric');
  const [preview, setPreview] = useState(PREVIEW_OPTIONS[0].src);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Persisted version filter tab: remembers user selection (e.g. 'release') across opens & app restarts
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'release' | 'snapshot' | 'ancient'>(() => {
    const saved = localStorage.getItem('elauncher_preferred_version_tab');
    if (saved === 'release' || saved === 'snapshot' || saved === 'ancient' || saved === 'all') {
      return saved;
    }
    return 'all';
  });

  // Edit instance modal state
  const [editingInstance, setEditingInstance] = useState<Instance | null>(null);
  const [editName, setEditName] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editLoader, setEditLoader] = useState<ModLoader>('Fabric');
  const [editPreview, setEditPreview] = useState(PREVIEW_OPTIONS[0].src);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editActiveTypeTab, setEditActiveTypeTab] = useState<'all' | 'release' | 'snapshot' | 'ancient'>('all');
  const [showVersionChangeWarning, setShowVersionChangeWarning] = useState(false);

  const handleTabChange = (tabId: 'all' | 'release' | 'snapshot' | 'ancient') => {
    playPalateClick(0.18);
    setActiveTypeTab(tabId);
    try {
      localStorage.setItem('elauncher_preferred_version_tab', tabId);
    } catch {
      // Ignore storage errors
    }
  };

  const selectedVersionItem = useMemo(() => {
    return allVersionItems.find((v) => v.id === version) || allVersionItems[0];
  }, [allVersionItems, version]);

  // Automatic background synchronization check from Mojang official manifest
  const performSync = useCallback(async (manual = false) => {
    setIsSyncing(true);
    try {
      const result = await syncOfficialVersions(versionGroups);
      if (result.newFound > 0) {
        setVersionGroups(result.updatedGroups);
        setSyncNotice(`Найдено новых сборок: +${result.newFound}`);
      } else if (manual) {
        setSyncNotice('Все версии актуальны');
      }
    } finally {
      setIsSyncing(false);
      if (manual) {
        setTimeout(() => setSyncNotice(null), 3000);
      }
    }
  }, [versionGroups]);

  useEffect(() => {
    // Auto sync on mount (silent check)
    performSync(false);
  }, [performSync]);

  // Dynamically calculate which loaders are supported for the currently selected version
  const supportedLoaders = useMemo(() => {
    return getSupportedLoaders(selectedVersionItem.id, selectedVersionItem.category);
  }, [selectedVersionItem]);

  // If selected version does not support current loader (e.g. snapshots only support Vanilla),
  // automatically switch to the primary supported loader!
  useEffect(() => {
    if (!supportedLoaders.includes(loader)) {
      setLoader(supportedLoaders[0]);
    }
  }, [supportedLoaders, loader]);

  const filteredVersionGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return versionGroups.map((grp) => {
      // Filter items inside this group by active tab and search query
      const rawFiltered = grp.items.filter((item) => {
        // If not 'all', check item category match
        if (activeTypeTab !== 'all' && item.category !== activeTypeTab) {
          return false;
        }

        if (!q) return true;
        return (
          item.id.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      });

      // Always ensure strict descending chronological order (e.g. 26.4 > 26.3 > 26.2 > 26.1)
      const items = sortGroupItems(rawFiltered);

      return { ...grp, items };
    }).filter((grp) => grp.items.length > 0);
  }, [versionGroups, searchQuery, activeTypeTab]);

  const handleOpenCreate = () => {
    playPalateClick(0.25);
    setName('');
    const defaultItem = allVersionItems[0] || { id: '26.4', category: 'release' };
    setVersion(defaultItem.id);
    const validLoaders = getSupportedLoaders(defaultItem.id, defaultItem.category);
    setLoader(validLoaders[0]);
    setPreview(PREVIEW_OPTIONS[0].src);
    setSearchQuery('');
    // Keep user's preferred activeTypeTab intact without resetting it!
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    playPalateClick(0.35);
    onCreateInstance({
      name: trimmedName,
      version,
      loader,
      preview,
    });
    setIsCreateOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!instanceToDelete) return;
    playPalateClick(0.35);
    onDeleteInstance(instanceToDelete.id);
    setInstanceToDelete(null);
  };

  const handleDuplicateInstance = (inst: Instance) => {
    playPalateClick(0.28);
    onCreateInstance({
      name: `${inst.name} (Копия)`,
      version: inst.version,
      loader: inst.loader,
      preview: inst.preview,
    });
  };

  const handleOpenEdit = (inst: Instance) => {
    playPalateClick(0.24);
    setEditingInstance(inst);
    setEditName(inst.name);
    setEditVersion(inst.version);
    setEditLoader(inst.loader);
    setEditPreview(inst.preview);
    setEditSearchQuery('');
    setEditActiveTypeTab(activeTypeTab);
    setShowVersionChangeWarning(false);
  };

  const editSelectedVersionItem = useMemo(() => {
    return allVersionItems.find((v) => v.id === editVersion) || allVersionItems[0];
  }, [allVersionItems, editVersion]);

  const editSupportedLoaders = useMemo(() => {
    if (!editSelectedVersionItem) return ['Vanilla' as ModLoader];
    return getSupportedLoaders(editSelectedVersionItem.id, editSelectedVersionItem.category);
  }, [editSelectedVersionItem]);

  useEffect(() => {
    if (editingInstance && !editSupportedLoaders.includes(editLoader)) {
      setEditLoader(editSupportedLoaders[0]);
    }
  }, [editingInstance, editSupportedLoaders, editLoader]);

  const editFilteredVersionGroups = useMemo(() => {
    const q = editSearchQuery.toLowerCase().trim();

    return versionGroups.map((grp) => {
      const rawFiltered = grp.items.filter((item) => {
        if (editActiveTypeTab !== 'all' && item.category !== editActiveTypeTab) {
          return false;
        }

        if (!q) return true;
        return (
          item.id.toLowerCase().includes(q) ||
          item.label.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      });

      const items = sortGroupItems(rawFiltered);
      return { ...grp, items };
    }).filter((grp) => grp.items.length > 0);
  }, [versionGroups, editSearchQuery, editActiveTypeTab]);

  const handleEditSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingInstance) return;
    const trimmedName = editName.trim();
    if (!trimmedName) return;

    const versionChanged = editVersion !== editingInstance.version || editLoader !== editingInstance.loader;
    const hasMods = (editingInstance.modsCount ?? 0) > 0;

    if (versionChanged && hasMods) {
      setShowVersionChangeWarning(true);
      return;
    }

    playPalateClick(0.3);
    onUpdateInstance({
      ...editingInstance,
      name: trimmedName,
      version: editVersion,
      loader: editLoader,
      preview: editPreview,
    });
    setEditingInstance(null);
  };

  const handleConfirmVersionChangeWithModsDelete = () => {
    if (!editingInstance) return;
    playPalateClick(0.35);
    onUpdateInstance({
      ...editingInstance,
      name: editName.trim() || editingInstance.name,
      version: editVersion,
      loader: editLoader,
      preview: editPreview,
      modsCount: 0,
    });
    setShowVersionChangeWarning(false);
    setEditingInstance(null);
  };

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col p-6 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-5 border-b border-[#1c1f2b] shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif]">
            {t.instancesTitle}
          </h1>
          <span className="text-xs font-mono text-[#666f85] px-2 py-0.5 rounded bg-[#12141c] border border-[#202433]">
            {instances.length}
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="h-10 px-4 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-['Barlow_Condensed',sans-serif]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t.createInstanceBtn}</span>
        </button>
      </div>

      {/* Grid of Instances or Clean Empty State */}
      {instances.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-[#0e1017] border border-[#232736] flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-[#5a6278]" />
          </div>
          <h3 className="text-base font-bold text-white tracking-wide">
            {t.noInstancesNotice}
          </h3>
          <button
            onClick={handleOpenCreate}
            className="mt-5 h-11 px-6 rounded-xl bg-white hover:bg-[#e4e7ee] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-['Barlow_Condensed',sans-serif]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.createInstanceBtn}</span>
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-6 pr-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
          {instances.map((inst) => {
            const isSelected = inst.id === selectedInstanceId;

            return (
              <div
                key={inst.id}
                className={`group relative rounded-2xl bg-[#0c0d12]/92 backdrop-blur-xl border transition-all flex flex-col overflow-hidden p-4 ${isSelected
                    ? 'border-white/80 shadow-[0_12px_32px_rgba(0,0,0,0.85)]'
                    : 'border-[#222534] hover:border-[#383e52]'
                  }`}
              >
                {/* Preview Image with quick hover bar */}
                <div className="w-full h-36 rounded-xl overflow-hidden bg-[#12141c] border border-[#1d202b] relative mb-3">
                  <img
                    src={inst.preview}
                    alt={inst.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Quick actions top bar */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(inst)}
                      title={t.instanceSettingsTip}
                      className="w-7 h-7 rounded-lg bg-black/75 hover:bg-black text-[#c0c6d6] hover:text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicateInstance(inst)}
                      title={t.instanceDuplicateTip}
                      className="w-7 h-7 rounded-lg bg-black/75 hover:bg-black text-[#c0c6d6] hover:text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => playPalateClick(0.18)}
                      title={t.instanceFolderTip}
                      className="w-7 h-7 rounded-lg bg-black/75 hover:bg-black text-[#c0c6d6] hover:text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer"
                    >
                      <Folder className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title & Metadata */}
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-bold text-white tracking-wide truncate">
                    {inst.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8b92a5]">
                    <span>{inst.version}</span>
                    <span className="text-[#3b4156]">•</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#161822] border border-[#242838] text-[#c4cbdd] text-[11px] font-sans font-semibold">
                      <img
                        src={LOADER_METADATA[inst.loader]?.icon || '/loaders/vanilla.svg'}
                        alt={inst.loader}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                        }}
                        className="w-3.5 h-3.5 object-contain shrink-0"
                      />
                      <span>{inst.loader}</span>
                    </span>
                    {(inst.modsCount ?? 0) > 0 && (
                      <>
                        <span className="text-[#3b4156]">•</span>
                        <span className="text-[11px] font-mono text-[#8b9bb8]">
                          {inst.modsCount} {language === 'ru' ? ((inst.modsCount ?? 0) === 1 ? 'мод' : (inst.modsCount ?? 0) < 5 ? 'мода' : 'модов') : ((inst.modsCount ?? 0) === 1 ? 'mod' : 'mods')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions row */}
                <div className="mt-auto pt-3 border-t border-[#1a1c26] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      playPalateClick(0.3);
                      onSelectInstance(inst.id);
                    }}
                    className={`flex-1 h-9 rounded-xl text-xs font-black uppercase tracking-wider font-['Barlow_Condensed',sans-serif] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                        ? 'bg-white text-black'
                        : 'bg-[#151722] hover:bg-[#1e2230] text-[#c4cbdd] hover:text-white border border-[#272b3b]'
                      }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{isSelected ? t.instanceSelected : t.instanceSelect}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(inst)}
                    title={t.instanceSettingsTip}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8e96ac] hover:text-white bg-[#151722] hover:bg-[#1e2230] border border-[#272b3b] hover:border-[#383e52] transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      playPalateClick(0.2);
                      setInstanceToDelete(inst);
                    }}
                    title={t.instanceDeleteTip}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6e758a] hover:text-[#ff5555] bg-[#151722] hover:bg-[#25171b] border border-[#272b3b] hover:border-[#521c25] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Create Instance (Breeze-Inspired Split Modular Panel) */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed top-11 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                width: '960px',
              }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.32, ease: smoothEase }}
              className="relative z-10 w-full rounded-2xl border border-[#262a38] bg-[#0c0d12] shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Top Header */}
              <div className="h-12 px-5 border-b border-[#1c1e29] flex items-center justify-between bg-[#10121a] shrink-0 select-none">
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#c0c6d6] leading-none">
                    {t.createInstanceHeader}
                  </span>
                  <span className="text-[#3b4156] leading-none text-xs">•</span>
                  <span className="text-xs font-mono text-[#7b8398] leading-none">
                    {selectedVersionItem.label} ({loader})
                  </span>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#1c1f2b] transition-colors cursor-pointer mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content: Breeze Split Panel Layout */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Panel: Profile Configuration Parameters */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#1c1e29] p-5 flex flex-col gap-4 overflow-y-auto bg-[#0a0b10] shrink-0">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b92a5]">
                        {t.instanceNameLabel}
                      </label>
                      <span className="text-[10px] font-mono text-[#5b6479]">
                        {name.length}/14
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 14))}
                      placeholder={language === 'ru' ? 'До 14 символов' : 'Up to 14 chars'}
                      className="w-full h-10 px-3 rounded-xl bg-[#141620] border border-[#232736] focus:border-white focus:outline-hidden text-xs text-white placeholder-[#52586b] transition-colors font-sans"
                    />
                  </div>

                  {/* Mod Loader Selector */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b92a5]">
                        {t.instanceLoaderLabel}
                      </label>
                      {supportedLoaders.length === 1 && supportedLoaders[0] === 'Vanilla' && (
                        <span className="text-[10px] font-mono text-[#a6b0c7] bg-[#161822] px-1.5 py-0.5 rounded border border-[#272b3b]">
                          {language === 'ru' ? 'Только Vanilla' : 'Vanilla Only'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MOD_LOADERS.map((ld) => {
                        const isSupported = supportedLoaders.includes(ld);
                        const isChosen = loader === ld;
                        const meta = LOADER_METADATA[ld];
                        return (
                          <button
                            key={ld}
                            type="button"
                            disabled={!isSupported}
                            onClick={() => {
                              if (!isSupported) return;
                              playPalateClick(0.18);
                              setLoader(ld);
                            }}
                            title={!isSupported ? `${ld} недоступен для выбранной версии (на снапшотах нет форков)` : `${ld}`}
                            className={`h-9 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                              !isSupported
                                ? 'opacity-25 bg-[#0e1017] text-[#52576b] border-[#1b1e2a] cursor-not-allowed line-through grayscale'
                                : isChosen
                                ? 'bg-white text-black border-white shadow-xs cursor-pointer'
                                : 'bg-[#141620] text-[#9ba2b5] border-[#232736] hover:border-[#383e52] hover:text-white cursor-pointer'
                            }`}
                          >
                            <img
                              src={meta?.icon || '/loaders/vanilla.svg'}
                              alt={ld}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                              }}
                              className={`w-4 h-4 shrink-0 object-contain ${
                                !isSupported ? 'grayscale opacity-60' : ''
                              }`}
                            />
                            <span>{ld}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedVersionItem.category === 'snapshot' && (
                      <span className="text-[10px] font-mono text-[#788096] leading-tight">
                        На тестовых снапшотах и пре-релизах форки (Fabric, Forge, NeoForge) не существуют — только чистая Vanilla.
                      </span>
                    )}
                    {selectedVersionItem.category === 'ancient' && (
                      <span className="text-[10px] font-mono text-[#788096] leading-tight">
                        Для исторических версий сторонние загрузчики не поддерживаются (только Vanilla).
                      </span>
                    )}
                    {selectedVersionItem.category === 'release' && !supportedLoaders.includes('Fabric') && supportedLoaders.includes('Forge') && (
                      <span className="text-[10px] font-mono text-[#788096] leading-tight">
                        Классическая версия: основной загрузчик — Forge (золотая эра моддинга).
                      </span>
                    )}
                  </div>

                  {/* Preview Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b92a5]">
                      {t.instanceIconLabel}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PREVIEW_OPTIONS.map((item) => {
                        const isChosen = preview === item.src;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              playPalateClick(0.18);
                              setPreview(item.src);
                            }}
                            className={`group relative rounded-xl overflow-hidden border aspect-video transition-all cursor-pointer bg-[#141620] ${isChosen
                                ? 'border-white ring-2 ring-white/30'
                                : 'border-[#232736] hover:border-[#383e52]'
                              }`}
                          >
                            <img
                              src={item.src}
                              alt={item.label}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/previews/preset_default.png';
                              }}
                              className="w-full h-full object-cover"
                            />
                            {isChosen && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-white text-black flex items-center justify-center">
                                <Check className="w-2 h-2 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Summary Card */}
                  <div className="mt-auto p-3.5 rounded-xl bg-[#12141c] border border-[#1f222e] flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#666f85]">
                      {language === 'ru' ? 'Выбранная конфигурация' : 'Selected Configuration'}
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{selectedVersionItem.label}</span>
                      <span className="text-[#a1a8bd] font-mono inline-flex items-center gap-1.5">
                        <img
                          src={LOADER_METADATA[loader]?.icon || '/loaders/vanilla.svg'}
                          alt={loader}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                          }}
                          className="w-3.5 h-3.5 object-contain"
                        />
                        <span>{loader}</span>
                      </span>
                    </div>
                    {selectedVersionItem.description && (
                      <span className="text-[10px] font-mono text-[#798196] leading-tight line-clamp-2">
                        {selectedVersionItem.description}
                      </span>
                    )}
                  </div>

                  {/* Create Button */}
                  <button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] flex items-center justify-center gap-2 mt-1"
                  >
                    <span>{t.createInstanceBtn}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Panel: Clean Version List */}
                <div className="flex-1 p-5 flex flex-col gap-3.5 overflow-hidden bg-[#0c0d12]">
                  {/* Top Bar: Search Input with Auto-Sync Refresh Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#636c82]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск версии (1.21, 24w14potato, rd-132211, Infdev...)"
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#141620] border border-[#232736] focus:border-white focus:outline-hidden text-xs text-white placeholder-[#586075] transition-colors font-sans"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => performSync(true)}
                      disabled={isSyncing}
                      title="Проверить обновления официальных версий и снапшотов Mojang"
                      className={`h-9 px-3 rounded-xl border border-[#232736] bg-[#141620] hover:bg-[#1c1f2b] text-[#8e96ac] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono shrink-0 ${
                        isSyncing ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-white' : ''}`} />
                      <span className="hidden sm:inline">
                        {isSyncing ? 'Обновление...' : 'Обновить'}
                      </span>
                    </button>
                  </div>

                  {syncNotice && (
                    <div className="px-3 py-1.5 rounded-lg bg-[#141d28] border border-[#223548] text-xs font-mono text-[#79a8d8] flex items-center justify-between shrink-0">
                      <span>{syncNotice}</span>
                    </div>
                  )}

                  {/* Clean Category Segmented Switcher */}
                  <div className="flex items-center gap-1.5 p-1 bg-[#12141c] border border-[#1f222e] rounded-xl shrink-0">
                    {[
                      { id: 'all', label: 'Все' },
                      { id: 'release', label: 'Релизы' },
                      { id: 'snapshot', label: 'Снапшоты' },
                      { id: 'ancient', label: 'Старые версии' },
                    ].map((tab) => {
                      const isActive = activeTypeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            handleTabChange(tab.id as 'all' | 'release' | 'snapshot' | 'ancient');
                          }}
                          className={`flex-1 h-7.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center font-['Barlow_Condensed',sans-serif] tracking-wider uppercase ${
                            isActive
                              ? 'bg-white text-black shadow-xs font-black'
                              : 'text-[#7b8398] hover:text-white hover:bg-[#181a24]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                    {/* Version List with Authentic Minecraft Block Textures */}
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                      {filteredVersionGroups.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#666f85] text-xs font-mono">
                          Версии по запросу не найдены
                        </div>
                      ) : (
                        filteredVersionGroups.map((grp) => (
                          <div key={grp.group} className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-mono font-bold text-[#727a90] uppercase tracking-wider px-1">
                              {grp.group}
                            </span>
                            <div className="flex flex-col gap-1">
                              {grp.items.map((item) => {
                                const isChosen = version === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      playPalateClick(0.18);
                                      setVersion(item.id);
                                      const nextSupported = getSupportedLoaders(item.id, item.category);
                                      if (!nextSupported.includes(loader)) {
                                        setLoader(nextSupported[0]);
                                      }
                                    }}
                                    className={`min-h-[42px] px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${isChosen
                                        ? 'bg-white text-black border-white font-bold shadow-[0_4px_16px_rgba(0,0,0,0.35)]'
                                        : 'bg-[#141620] text-[#c0c6d6] border-[#222534] hover:bg-[#1a1d2a] hover:border-[#383e52]'
                                      }`}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      {/* Official Minecraft Block/Item Texture */}
                                      <div className="w-7 h-7 rounded-lg bg-[#0e1017] border border-[#262b3a] flex items-center justify-center shrink-0 p-1 shadow-sm overflow-hidden">
                                        <img
                                          src={item.blockIcon}
                                          alt={item.label}
                                          loading="eager"
                                          decoding="sync"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/minecraft_textures/grass_block.png';
                                          }}
                                          className="w-full h-full object-contain aspect-square [image-rendering:pixelated]"
                                        />
                                      </div>

                                      <div className="flex items-center gap-2 truncate">
                                        <span className="font-mono text-xs">{item.label}</span>
                                        {item.badge && (
                                          <span
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                                              isChosen
                                                ? 'bg-black text-white'
                                                : item.category === 'snapshot'
                                                ? 'bg-[#181a24] text-[#b0b8cb] border border-[#262b3a]'
                                                : item.category === 'ancient'
                                                ? 'bg-[#161a26] text-[#8e98b0] border border-[#222838]'
                                                : 'bg-[#161822] text-[#8e98b0] border border-[#222736]'
                                            }`}
                                          >
                                            {item.badge}
                                          </span>
                                        )}
                                        {item.description && (
                                          <span
                                            className={`text-[11px] truncate ${isChosen ? 'text-[#333333]' : 'text-[#70788d]'
                                              }`}
                                          >
                                            — {item.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Loaders compatibility mini icons */}
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                      {getSupportedLoaders(item.id, item.category).map((loaderName) => (
                                        <img
                                          key={loaderName}
                                          src={LOADER_METADATA[loaderName]?.icon || '/loaders/vanilla.svg'}
                                          alt={loaderName}
                                          title={`Поддерживается: ${loaderName}`}
                                          className={`w-3.5 h-3.5 object-contain transition-opacity ${
                                            isChosen ? 'opacity-90' : 'opacity-40 hover:opacity-100'
                                          }`}
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                                          }}
                                        />
                                      ))}
                                      {isChosen && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1.5 text-black" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Edit Instance Settings */}
      <AnimatePresence>
        {editingInstance && (
          <div className="fixed top-11 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setEditingInstance(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                width: '960px',
              }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.32, ease: smoothEase }}
              className="relative z-10 w-full rounded-2xl border border-[#262a38] bg-[#0c0d12] shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Top Header */}
              <div className="h-12 px-5 border-b border-[#1c1e29] flex items-center justify-between bg-[#10121a] shrink-0 select-none">
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#c0c6d6] leading-none">
                    Настройки сборки
                  </span>
                  <span className="text-[#3b4156] leading-none text-xs">•</span>
                  <span className="text-xs font-mono text-[#7b8398] leading-none">
                    {editingInstance.name} ({editSelectedVersionItem.label})
                  </span>
                </div>
                <button
                  onClick={() => setEditingInstance(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#707584] hover:text-white hover:bg-[#1c1f2b] transition-colors cursor-pointer mt-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content: Breeze Split Panel Layout */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Panel: Profile Configuration Parameters */}
                <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#1c1e29] p-5 flex flex-col gap-4 overflow-y-auto bg-[#0a0b10] shrink-0">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b92a5]">
                        Название сборки
                      </label>
                      <span className="text-[10px] font-mono text-[#5b6479]">
                        {editName.length}/14
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={14}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value.slice(0, 14))}
                      placeholder="До 14 символов"
                      className="w-full h-10 px-3 rounded-xl bg-[#141620] border border-[#232736] focus:border-white focus:outline-hidden text-xs text-white placeholder-[#52586b] transition-colors font-sans"
                    />
                  </div>

                  {/* Mod Loader Selector */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b92a5]">
                        Загрузчик модов
                      </label>
                      {editSupportedLoaders.length === 1 && editSupportedLoaders[0] === 'Vanilla' && (
                        <span className="text-[10px] font-mono text-[#a6b0c7] bg-[#161822] px-1.5 py-0.5 rounded border border-[#272b3b]">
                          Только Vanilla
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {MOD_LOADERS.map((ld) => {
                        const isSupported = editSupportedLoaders.includes(ld);
                        const isChosen = editLoader === ld;
                        const meta = LOADER_METADATA[ld];
                        return (
                          <button
                            key={ld}
                            type="button"
                            disabled={!isSupported}
                            onClick={() => {
                              if (!isSupported) return;
                              playPalateClick(0.18);
                              setEditLoader(ld);
                            }}
                            title={!isSupported ? `${ld} недоступен для выбранной версии` : `${ld}`}
                            className={`h-9 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                              !isSupported
                                ? 'opacity-25 bg-[#0e1017] text-[#52576b] border-[#1b1e2a] cursor-not-allowed line-through grayscale'
                                : isChosen
                                ? 'bg-white text-black border-white shadow-xs cursor-pointer'
                                : 'bg-[#141620] text-[#9ba2b5] border-[#232736] hover:border-[#383e52] hover:text-white cursor-pointer'
                            }`}
                          >
                            <img
                              src={meta?.icon || '/loaders/vanilla.svg'}
                              alt={ld}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                              }}
                              className={`w-4 h-4 shrink-0 object-contain ${
                                !isSupported ? 'grayscale opacity-60' : ''
                              }`}
                            />
                            <span>{ld}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b92a5]">
                      {t.instanceIconLabel}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PREVIEW_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playPalateClick(0.18);
                            setEditPreview(opt.src);
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            editPreview === opt.src
                              ? 'border-white scale-105 shadow-sm'
                              : 'border-[#232736] hover:border-[#42485c] opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={opt.src}
                            alt={opt.label}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Installed Mods info */}
                  {(editingInstance.modsCount ?? 0) > 0 && (
                    <div className="p-3 rounded-xl bg-[#141622] border border-[#232736] text-[11px] font-mono text-[#8b9bb8]">
                      {language === 'ru'
                        ? `Установлено модов: ${editingInstance.modsCount}. При смене версии моды будут автоматически удалены.`
                        : `Installed mods: ${editingInstance.modsCount}. Changing version will automatically delete all installed mods.`}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="mt-auto pt-4 border-t border-[#1c1e29] flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditingInstance(null)}
                      className="px-4 h-10 rounded-xl bg-transparent hover:bg-[#161822] text-[#8e96ac] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-['Barlow_Condensed',sans-serif]"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="submit"
                      className="px-5 h-10 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
                    >
                      {t.saveBtn}
                    </button>
                  </div>
                </div>

                {/* Right Panel: Version Selector */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0d12]">
                  {/* Top Search & Filter Bar */}
                  <div className="p-4 border-b border-[#1c1e29] flex flex-col sm:flex-row items-center gap-3 bg-[#0e1017]">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-[#666f85] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={editSearchQuery}
                        onChange={(e) => setEditSearchQuery(e.target.value)}
                        placeholder={t.versionSearchPlaceholder}
                        className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#141620] border border-[#232736] focus:border-white focus:outline-hidden text-xs text-white placeholder-[#52586b] font-sans"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-[#141620] p-1 rounded-xl border border-[#232736] shrink-0">
                      {(
                        [
                          { id: 'all', label: t.filterAll },
                          { id: 'release', label: t.filterReleases },
                          { id: 'snapshot', label: t.filterSnapshots },
                          { id: 'ancient', label: t.filterAncient },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            playPalateClick(0.18);
                            setEditActiveTypeTab(tab.id);
                          }}
                          className={`px-2.5 h-7 rounded-lg text-xs font-bold font-['Barlow_Condensed',sans-serif] uppercase tracking-wider transition-all cursor-pointer ${
                            editActiveTypeTab === tab.id
                              ? 'bg-white text-black shadow-xs'
                              : 'text-[#7e869c] hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Versions Scrollable Catalogue */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {editFilteredVersionGroups.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs font-mono text-[#5f677d]">
                        Версий не найдено
                      </div>
                    ) : (
                      editFilteredVersionGroups.map((group) => (
                        <div key={group.group} className="flex flex-col gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6b7389] px-1">
                            {group.group}
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {group.items.map((item) => {
                              const isChosen = editVersion === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    playPalateClick(0.16);
                                    setEditVersion(item.id);
                                  }}
                                  className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                                    isChosen
                                      ? 'bg-white text-black border-white shadow-sm font-semibold'
                                      : 'bg-[#141620] text-[#c0c6d6] border-[#222534] hover:bg-[#1a1d2a] hover:border-[#383e52]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <div className="w-7 h-7 rounded-lg bg-[#0e1017] border border-[#262b3a] flex items-center justify-center shrink-0 p-1 shadow-sm overflow-hidden">
                                      <img
                                        src={item.blockIcon}
                                        alt={item.label}
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src =
                                            '/minecraft_textures/grass_block.png';
                                        }}
                                        className="w-full h-full object-contain aspect-square [image-rendering:pixelated]"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 truncate">
                                      <span className="font-mono text-xs">{item.label}</span>
                                      {item.badge && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                                            isChosen
                                              ? 'bg-black text-white'
                                              : item.category === 'snapshot'
                                              ? 'bg-[#181a24] text-[#b0b8cb] border border-[#262b3a]'
                                              : item.category === 'ancient'
                                              ? 'bg-[#161a26] text-[#8e98b0] border border-[#222838]'
                                              : 'bg-[#161822] text-[#8e98b0] border border-[#222736]'
                                          }`}
                                        >
                                          {item.badge}
                                        </span>
                                      )}
                                      {item.description && (
                                        <span
                                          className={`text-[11px] truncate ${
                                            isChosen ? 'text-[#333333]' : 'text-[#70788d]'
                                          }`}
                                        >
                                          — {item.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    {getSupportedLoaders(item.id, item.category).map((loaderName) => (
                                      <img
                                        key={loaderName}
                                        src={LOADER_METADATA[loaderName]?.icon || '/loaders/vanilla.svg'}
                                        alt={loaderName}
                                        title={`Поддерживается: ${loaderName}`}
                                        className={`w-3.5 h-3.5 object-contain transition-opacity ${
                                          isChosen ? 'opacity-90' : 'opacity-40 hover:opacity-100'
                                        }`}
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                                        }}
                                      />
                                    ))}
                                    {isChosen && (
                                      <Check className="w-3.5 h-3.5 stroke-[3] shrink-0 ml-1.5 text-black" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 3: Version Change Warning Dialog (Deletes Installed Mods) */}
      <AnimatePresence>
        {showVersionChangeWarning && editingInstance && (
          <div className="fixed top-11 bottom-0 left-0 right-0 z-60 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowVersionChangeWarning(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.28, ease: smoothEase }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[#3d2426] bg-[#0f0c0d] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="h-12 px-5 border-b border-[#291719] flex items-center justify-between bg-[#170e10]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#ff6b6b]" />
                  <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#ff8080]">
                    Предупреждение
                  </span>
                </div>
                <button
                  onClick={() => setShowVersionChangeWarning(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7a6468] hover:text-white hover:bg-[#201518] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm text-[#f0f0f0] leading-relaxed">
                  Вы точно хотите изменить версию? При этом все установленные моды будут удалены.
                </p>
                <div className="p-3 rounded-xl bg-[#1c1012] border border-[#3b1c20] text-xs font-mono text-[#d17f8a]">
                  Сборка: <strong className="text-white">{editingInstance.name}</strong> • Установлено модов: <strong className="text-white">{editingInstance.modsCount}</strong>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#241517] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVersionChangeWarning(false)}
                    className="px-4 h-10 rounded-xl bg-transparent hover:bg-[#1a1214] text-[#a09498] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-['Barlow_Condensed',sans-serif]"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmVersionChangeWithModsDelete}
                    className="px-5 h-10 rounded-xl bg-[#dc2626] hover:bg-[#ef4444] active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
                  >
                    Да, изменить версию
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 4: Confirmation Delete */}
      <AnimatePresence>
{
  instanceToDelete && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setInstanceToDelete(null)}
        className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.28, ease: smoothEase }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#2f1b20] bg-[#0d0c10] shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="h-12 px-5 border-b border-[#24171a] flex items-center justify-between bg-[#140e11]">
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#f08a95]">
            Удаление сборки
          </span>
          <button
            onClick={() => setInstanceToDelete(null)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7a6468] hover:text-white hover:bg-[#201518] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-[#e0e0e0] leading-relaxed">
            Вы точно хотите удалить сборку <strong className="text-white">"{instanceToDelete.name}"</strong>?
          </p>
          <p className="text-xs font-mono text-[#8c8286]">
            Это действие необратимо. Файлы сборки будут удалены.
          </p>

          {/* Actions */}
          <div className="pt-3 border-t border-[#201518] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setInstanceToDelete(null)}
              className="px-4 h-10 rounded-xl bg-transparent hover:bg-[#191417] text-[#9c9094] hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-5 h-10 rounded-xl bg-[#dc2626] hover:bg-[#ef4444] active:scale-95 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
            >
              Удалить
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
      </AnimatePresence >
    </div >
  );
}
