import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ShieldAlert,
  Search,
  Download,
  Check,
  Trash2,
  FolderOpen,
  WifiOff,
  Package,
  Layers,
  Power,
  RotateCw,
  Filter,
  Globe,
  X,
} from 'lucide-react';
import type { Instance } from '../types/instance';
import { LOADER_METADATA } from '../types/instance';
import { ModsInstanceSelectModal } from './ModsInstanceSelectModal';
import { ModDetailsModal } from './ModDetailsModal';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';
import { playPalateClick } from '../utils/sound';

const CATEGORIES: { id: string; labelKey: keyof typeof translations.en }[] = [
  { id: 'all', labelKey: 'modCategoryAll' },
  { id: 'adventure', labelKey: 'modCategoryAdventure' },
  { id: 'decoration', labelKey: 'modCategoryDecoration' },
  { id: 'optimization', labelKey: 'modCategoryOptimization' },
  { id: 'utility', labelKey: 'modCategoryUtility' },
  { id: 'technology', labelKey: 'modCategoryTechnology' },
  { id: 'magic', labelKey: 'modCategoryMagic' },
  { id: 'storage', labelKey: 'modCategoryStorage' },
  { id: 'worldgen', labelKey: 'modCategoryWorldgen' },
];
import {
  searchUnifiedMods,
  getModDownloadUrl,
  resolveModWithDependencies,
  formatDownloadCount,
  generateModBadgeIcon,
  type UnifiedModItem,
  type LocalMod,
  type ContentType,
} from '../utils/modrinthService';
import { ProgressiveImage } from './ProgressiveImage';

function ModrinthIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12.252.004a11.78 11.768 0 0 0-8.92 3.73 11 10.999 0 0 0-2.17 3.11 11.37 11.359 0 0 0-1.16 5.169c0 1.42.17 2.5.6 3.77.24.759.77 1.899 1.17 2.529a12.3 12.298 0 0 0 8.85 5.639c.44.05 2.54.07 2.76.02.2-.04.22.1-.26-1.7l-.36-1.37-1.01-.06a8.5 8.489 0 0 1-5.18-1.8 5.34 5.34 0 0 1-1.3-1.26c0-.05.34-.28.74-.5a37.572 37.545 0 0 1 2.88-1.629c.03 0 .5.45 1.06.98l1 .97 2.07-.43 2.06-.43 1.47-1.47c.8-.8 1.48-1.5 1.48-1.52 0-.09-.42-1.63-.46-1.7-.04-.06-.2-.03-1.02.18-.53.13-1.2.3-1.45.4l-.48.15-.53.53-.53.53-.93.1-.93.07-.52-.5a2.7 2.7 0 0 1-.96-1.7l-.13-.6.43-.57c.68-.9.68-.9 1.46-1.1.4-.1.65-.2.83-.33.13-.099.65-.579 1.14-1.069l.9-.9-.7-.7-.7-.7-1.95.54c-1.07.3-1.96.53-1.97.53-.03 0-2.23 2.48-2.63 2.97l-.29.35.28 1.03c.16.56.3 1.16.31 1.34l.03.3-.34.23c-.37.23-2.22 1.3-2.84 1.63-.36.2-.37.2-.44.1-.08-.1-.23-.6-.32-1.03-.18-.86-.17-2.75.02-3.73a8.84 8.839 0 0 1 7.9-6.93c.43-.03.77-.08.78-.1.06-.17.5-2.999.47-3.039-.01-.02-.1-.02-.2-.03Zm3.68.67c-.2 0-.3.1-.37.38-.06.23-.46 2.42-.46 2.52 0 .04.1.11.22.16a8.51 8.499 0 0 1 2.99 2 8.38 8.379 0 0 1 2.16 3.449 6.9 6.9 0 0 1 .4 2.8c0 1.07 0 1.27-.1 1.73a9.37 9.369 0 0 1-1.76 3.769c-.32.4-.98 1.06-1.37 1.38-.38.32-1.54 1.1-1.7 1.14-.1.03-.1.06-.07.26.03.18.64 2.56.7 2.78l.06.06a12.07 12.058 0 0 0 7.27-9.4c.13-.77.13-2.58 0-3.4a11.96 11.948 0 0 0-5.73-8.578c-.7-.42-2.05-1.06-2.25-1.06Z" />
    </svg>
  );
}

function CurseForgeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M18.326 9.2145S23.2261 8.4418 24 6.1882h-7.5066V4.4H0l2.0318 2.3576V9.173s5.1267-.2665 7.1098 1.2372c2.7146 2.516-3.053 5.917-3.053 5.917L5.0995 19.6c1.5465-1.4726 4.494-3.3775 9.8983-3.2857-2.0565.65-4.1245 1.6651-5.7344 3.2857h10.9248l-1.0288-3.2726s-7.918-4.6688-.8336-7.1127z" />
    </svg>
  );
}


interface ModsViewProps {
  instances: Instance[];
  selectedInstanceId: string;
  language?: Language;
  instancesPath: string;
  onSelectInstance: (id: string) => void;
}

type SourceFilter = 'all' | 'modrinth' | 'curseforge';

export function ModsView({
  instances,
  selectedInstanceId,
  language = 'en',
  instancesPath,
  onSelectInstance,
}: ModsViewProps) {
  const t = translations[language];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'installed'>('catalog');
  const [contentType, setContentType] = useState<ContentType>('mod');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Online catalog state
  const [catalogMods, setCatalogMods] = useState<UnifiedModItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalHits, setTotalHits] = useState(0);

  // Local installed mods state
  const [installedMods, setInstalledMods] = useState<LocalMod[]>([]);
  const [downloadingModId, setDownloadingModId] = useState<string | null>(null);
  const [downloadingStatusText, setDownloadingStatusText] = useState<string | null>(null);
  const [dependencyNotice, setDependencyNotice] = useState<{ modTitle: string; depTitles: string[] } | null>(null);
  const [selectedModForDetails, setSelectedModForDetails] = useState<UnifiedModItem | null>(null);
  const [modToDelete, setModToDelete] = useState<LocalMod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // World selector for datapacks
  const [worldSelectorMod, setWorldSelectorMod] = useState<UnifiedModItem | null>(null);
  const [worlds, setWorlds] = useState<{ name: string; icon: string | null; installedDatapacks?: string[] }[]>([]);
  const [isLoadingWorlds, setIsLoadingWorlds] = useState(false);
  const [installingToWorld, setInstallingToWorld] = useState<string | null>(null);

  const selectedInstance =
    instances.find((i) => i.id === selectedInstanceId) || instances[0] || null;

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch local items (mods, resourcepacks, shaderpacks) for selected instance
  const refreshInstalledMods = useCallback(async () => {
    if (!selectedInstance || !window.electronAPI?.listInstanceMods) {
      setInstalledMods([]);
      return;
    }
    try {
      const list = await window.electronAPI.listInstanceMods({
        instancesPath,
        instanceId: selectedInstance.id,
        folderType: contentType,
      });
      setInstalledMods(list || []);
    } catch {
      setInstalledMods([]);
    }
  }, [selectedInstance, instancesPath, contentType]);

  useEffect(() => {
    refreshInstalledMods();
  }, [refreshInstalledMods]);

  // Real-time synchronization: refresh installed files and worlds when window gains focus or periodically
  useEffect(() => {
    const handleSync = () => {
      refreshInstalledMods();
      if (worldSelectorMod) {
        fetchWorldsForInstance();
      }
    };

    window.addEventListener('focus', handleSync);
    const interval = setInterval(handleSync, 5000);

    return () => {
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, [refreshInstalledMods, worldSelectorMod]);

  // Keep track of active request ID to discard stale responses
  const activeRequestIdRef = useRef<number>(0);

  // Fetch initial catalog
  const fetchCatalog = useCallback(async (immediateContentType?: ContentType) => {
    const typeToFetch = immediateContentType || contentType;
    const reqId = ++activeRequestIdRef.current;

    if (!isOnline) {
      setCatalogMods([]);
      return;
    }
    // Only mods strictly require a non-vanilla loader. ELauncher also does not support mods and shaders.
    const isUnsupported =
      !selectedInstance ||
      (typeToFetch === 'mod' && (selectedInstance.loader === 'Vanilla' || selectedInstance.loader === 'ELauncher')) ||
      (typeToFetch === 'shader' && selectedInstance.loader === 'ELauncher');
    if (isUnsupported) {
      setCatalogMods([]);
      return;
    }

    setIsLoadingCatalog(true);
    try {
      const result = await searchUnifiedMods({
        query: searchQuery,
        version: selectedInstance.version,
        loader: typeToFetch === 'mod' ? selectedInstance.loader : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        projectType: typeToFetch,
        limit: 24,
        offset: 0,
      });
      // Only commit if this request is still the newest one
      if (activeRequestIdRef.current === reqId) {
        setCatalogMods(result.hits);
        setTotalHits(result.total_hits);
      }
    } catch {
      if (activeRequestIdRef.current === reqId) {
        setCatalogMods([]);
      }
    } finally {
      if (activeRequestIdRef.current === reqId) {
        setIsLoadingCatalog(false);
      }
    }
  }, [isOnline, selectedInstance, searchQuery, selectedCategory, contentType]);

  // Handle switching contentType instantly without showing stale previous content
  const handleSelectContentType = (newType: ContentType) => {
    if (newType === contentType) return;
    playPalateClick(0.18);
    // Cancel previous inflight requests and immediately clear stale items
    activeRequestIdRef.current++;
    setCatalogMods([]);
    setTotalHits(0);
    setIsLoadingCatalog(true);
    setContentType(newType);
    fetchCatalog(newType);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCatalog();
    }, 280);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, isOnline, selectedInstance]);

  // Load more items for infinite browsing
  const handleLoadMore = async () => {
    if (isLoadingMore || !selectedInstance || (contentType === 'mod' && selectedInstance.loader === 'Vanilla')) return;
    setIsLoadingMore(true);
    playPalateClick(0.18);
    try {
      const result = await searchUnifiedMods({
        query: searchQuery,
        version: selectedInstance.version,
        loader: contentType === 'mod' ? selectedInstance.loader : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        projectType: contentType,
        limit: 24,
        offset: catalogMods.length,
      });
      setCatalogMods((prev) => [...prev, ...result.hits]);
      setTotalHits(result.total_hits);
    } catch (err) {
      console.error('Failed to load more items:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSelectInstance = (instanceId: string) => {
    onSelectInstance(instanceId);
    try {
      sessionStorage.setItem('elauncher_mods_session_instance_confirmed', 'true');
    } catch {}
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    playPalateClick(0.24);
    setIsModalOpen(true);
  };

  const handleOpenModsFolder = async () => {
    if (!selectedInstance || !window.electronAPI?.openPath) return;
    playPalateClick(0.24);
    const sep = instancesPath.includes('/') ? '/' : '\\';
    const subFolder = contentType === 'resourcepack' ? 'resourcepacks'
      : contentType === 'shader' ? 'shaderpacks'
      : contentType === 'datapack' ? 'saves'
      : 'mods';
    const folder = `${instancesPath}${sep}instances${sep}${selectedInstance.id}${sep}${subFolder}`;
    await window.electronAPI.openPath(folder);
  };

  const handleToggleMod = async (mod: LocalMod) => {
    if (!selectedInstance || !window.electronAPI?.toggleInstanceMod) return;
    playPalateClick(0.2);
    const success = await window.electronAPI.toggleInstanceMod({
      instancesPath,
      instanceId: selectedInstance.id,
      fileName: mod.fileName,
      enable: !mod.isEnabled,
      folderType: contentType,
    });
    if (success) {
      refreshInstalledMods();
    }
  };

  const handleDeleteMod = (mod: LocalMod) => {
    playPalateClick(0.2);
    setModToDelete(mod);
  };

  const handleConfirmDelete = async () => {
    if (!modToDelete || !selectedInstance || !window.electronAPI?.deleteInstanceMod) return;
    setIsDeleting(true);
    playPalateClick(0.24);
    try {
      const success = await window.electronAPI.deleteInstanceMod({
        instancesPath,
        instanceId: selectedInstance.id,
        fileName: modToDelete.fileName,
        folderType: contentType,
      });
      if (success) {
        setModToDelete(null);
        await refreshInstalledMods();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Transfer animation state for datapacks
  const [transferAnim, setTransferAnim] = useState<{
    active: boolean;
    worldName: string;
    datapackTitle: string;
    iconUrl: string | null;
    completed: boolean;
  } | null>(null);

  const fetchWorldsForInstance = async () => {
    if (!selectedInstance || !window.electronAPI?.listInstanceWorlds) {
      setWorlds([]);
      return;
    }
    setIsLoadingWorlds(true);
    try {
      const list = await window.electronAPI.listInstanceWorlds({
        instancesPath,
        instanceId: selectedInstance.id,
      });
      setWorlds(list || []);
    } catch (err) {
      console.error('Failed to list worlds:', err);
      setWorlds([]);
    } finally {
      setIsLoadingWorlds(false);
    }
  };

  const handleInstallMod = async (
    modItem: UnifiedModItem,
    customVersionFile?: { url: string; fileName: string; size: number }
  ) => {
    if (!selectedInstance || !window.electronAPI?.downloadModFile) return;
    if ((isVanilla || isELauncher) && (contentType === 'mod' || contentType === 'shader')) return;

    // For datapacks: open world selector and scan real saves
    if (contentType === 'datapack') {
      setWorldSelectorMod(modItem);
      fetchWorldsForInstance();
      return;
    }

    setDownloadingModId(modItem.id);
    setDownloadingStatusText(null);
    playPalateClick(0.25);
    try {
      if (contentType === 'mod' && !customVersionFile) {
        // Collect installed identifiers to avoid downloading dependencies that are already in place
        const installedIdentifiers = installedMods.flatMap((m) =>
          [m.fileName, m.cleanName, m.name].filter(Boolean) as string[]
        );

        setDownloadingStatusText(t.modDetailsLoading);
        const plan = await resolveModWithDependencies(
          modItem.id,
          selectedInstance.version,
          selectedInstance.loader,
          installedIdentifiers
        );

        if (plan) {
          const totalFiles = plan.dependencies.length + 1;
          let completedFiles = 0;

          // 1. Automatically download missing required dependencies if any
          const downloadedDepNames: string[] = [];
          if (plan.dependencies.length > 0) {
            for (let i = 0; i < plan.dependencies.length; i++) {
              const dep = plan.dependencies[i];
              const percent = Math.round((completedFiles / totalFiles) * 100);
              setDownloadingStatusText(`${t.downloadingGame} (${percent}%)`);
              const ok = await window.electronAPI.downloadModFile({
                instancesPath,
                instanceId: selectedInstance.id,
                url: dep.url,
                fileName: dep.fileName,
                folderType: 'mod',
              });
              if (ok) {
                downloadedDepNames.push(dep.title);
              }
              completedFiles++;
            }
          }

          // 2. Download the main mod file
          const percent = Math.round((completedFiles / totalFiles) * 100);
          setDownloadingStatusText(`${t.downloadingGame} (${percent}%)`);
          await window.electronAPI.downloadModFile({
            instancesPath,
            instanceId: selectedInstance.id,
            url: plan.mainFile.url,
            fileName: plan.mainFile.fileName,
            folderType: 'mod',
          });
          setDownloadingStatusText(`${t.downloadingGame} (100%)`);

          await refreshInstalledMods();

          // 3. Show notification banner if dependencies were installed
          if (downloadedDepNames.length > 0) {
            setDependencyNotice({
              modTitle: modItem.title,
              depTitles: downloadedDepNames,
            });
            setTimeout(() => {
              setDependencyNotice((curr) => (curr?.modTitle === modItem.title ? null : curr));
            }, 6000);
          }
        }
      } else {
        const fileInfo = customVersionFile || await getModDownloadUrl(
          modItem.id,
          selectedInstance.version,
          contentType === 'mod' ? selectedInstance.loader : undefined
        );
        if (fileInfo) {
          await window.electronAPI.downloadModFile({
            instancesPath,
            instanceId: selectedInstance.id,
            url: fileInfo.url,
            fileName: fileInfo.fileName,
            folderType: contentType,
          });
          await refreshInstalledMods();
        }
      }
    } catch (err) {
      console.error('Failed to download file:', err);
    } finally {
      setDownloadingModId(null);
      setDownloadingStatusText(null);
    }
  };

  const handleInstallDatapackToWorld = async (worldName: string) => {
    if (!worldSelectorMod || !selectedInstance || !window.electronAPI?.downloadModFile) return;

    // Check if datapack is already installed in this world
    const targetWorld = worlds.find((w) => w.name === worldName);
    const slug = worldSelectorMod.slug?.toLowerCase() || '';
    const cleanTitle = worldSelectorMod.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
    const alreadyInWorld = targetWorld?.installedDatapacks?.some((f) => {
      const lower = f.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (slug && lower.includes(slug)) || (cleanTitle && lower.includes(cleanTitle));
    });

    if (alreadyInWorld) {
      // Don't re-download duplicate datapacks into the same world
      return;
    }

    setInstallingToWorld(worldName);
    playPalateClick(0.25);

    // Trigger visual transfer animation
    setTransferAnim({
      active: true,
      worldName,
      datapackTitle: worldSelectorMod.title,
      iconUrl: worldSelectorMod.icon_url,
      completed: false,
    });

    try {
      // Strictly request 'datapack' loader so Modrinth returns the actual .zip datapack, not a neoforge/fabric jar
      const fileInfo = await getModDownloadUrl(
        worldSelectorMod.id,
        selectedInstance.version,
        'datapack'
      );
      if (fileInfo) {
        // Install directly to saves/<worldName>/datapacks/
        const sep = instancesPath.includes('/') ? '/' : '\\';
        const targetPath = `${instancesPath}${sep}instances${sep}${selectedInstance.id}${sep}saves${sep}${worldName}${sep}datapacks`;
        await window.electronAPI.downloadModFile({
          instancesPath: targetPath,
          instanceId: '',
          url: fileInfo.url,
          fileName: fileInfo.fileName,
          folderType: 'datapack',
          targetPath,
        });
        await fetchWorldsForInstance();
        await refreshInstalledMods();
      }

      // Mark transfer as complete for success sparkle animation
      setTransferAnim((prev) => prev ? { ...prev, completed: true } : null);
      await new Promise((r) => setTimeout(r, 900));
    } catch (err) {
      console.error('Failed to install datapack to world:', err);
    } finally {
      setTransferAnim(null);
      setInstallingToWorld(null);
      setWorldSelectorMod(null);
    }
  };

  const isModInstalled = (modItem: UnifiedModItem) => {
    const slug = modItem.slug?.toLowerCase();
    const title = modItem.title?.toLowerCase().replace(/[^a-z0-9]/g, '');
    return installedMods.some((im) => {
      const clean = im.cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return (slug && clean.includes(slug)) || (title && clean.includes(title));
    });
  };

  // Filter catalog mods by active source filter (All, Modrinth, CurseForge)
  const filteredCatalogMods = useMemo(() => {
    if (sourceFilter === 'all') return catalogMods;
    if (sourceFilter === 'modrinth') {
      return catalogMods.filter((m) => m.hasModrinth);
    }
    if (sourceFilter === 'curseforge') {
      return catalogMods.filter((m) => m.hasCurseForge);
    }
    return catalogMods;
  }, [catalogMods, sourceFilter]);

  const loaderMeta = selectedInstance
    ? LOADER_METADATA[selectedInstance.loader] || LOADER_METADATA.Vanilla
    : LOADER_METADATA.Vanilla;

  const isVanilla = selectedInstance?.loader === 'Vanilla';
  const isELauncher = selectedInstance?.loader === 'ELauncher';
  const isUnsupportedContent =
    (isVanilla && (contentType === 'mod' || contentType === 'shader')) ||
    (isELauncher && (contentType === 'mod' || contentType === 'shader'));

  const unsupportedWarning = isELauncher
    ? contentType === 'shader'
      ? t.shadersELauncherWarning
      : t.modsELauncherWarning
    : contentType === 'shader'
    ? t.shadersVanillaWarning
    : t.modsVanillaWarning;

  const unsupportedHint = isELauncher
    ? contentType === 'shader'
      ? t.shadersELauncherHint
      : t.modsELauncherHint
    : contentType === 'shader'
    ? t.shadersVanillaHint
    : t.modsVanillaHint;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none">
      {/* Automatic Dependency Installation Notification Banner */}
      <AnimatePresence>
        {dependencyNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0c1220]/95 border border-[#2563eb]/50 shadow-2xl backdrop-blur-xl text-xs font-mono text-white max-w-[90%] sm:max-w-lg"
          >
            <Package className="w-4 h-4 text-[#60a5fa] shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="text-[#93c5fd] font-bold">{dependencyNotice.modTitle}</span>
              <span className="text-[#94a3b8] mx-1.5">{t.modDependenciesInstalled}</span>
              <span className="text-emerald-400 font-bold">{dependencyNotice.depTitles.join(', ')}</span>
            </div>
            <button
              onClick={() => setDependencyNotice(null)}
              className="p-1 rounded hover:bg-white/10 text-[#64748b] hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar: Target instance indicator, Switcher, Mode tabs, and Folder Button */}
      <div className="h-16 px-6 border-b border-[#1c1f2b] bg-[#0c0d12]/92 backdrop-blur-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#71788e]">
            {t.modsTargetInstance}
          </span>

          {selectedInstance ? (
            <button
              onClick={handleOpenModal}
              className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#14161f] hover:bg-[#1c202d] border border-[#2b3042] hover:border-white/60 transition-all cursor-pointer shadow-sm"
            >
              <img
                src={selectedInstance.preview}
                alt={selectedInstance.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/previews/preset_default.png';
                }}
                className="w-5 h-5 rounded object-cover border border-[#2b3042]"
              />
              <span className="text-xs font-bold text-white tracking-wide">
                {selectedInstance.name}
              </span>
              <span className="text-[11px] font-mono text-[#8b92a5] flex items-center gap-1">
                <span>({selectedInstance.version}</span>
                <span className="text-[#3b4156]">•</span>
                <img
                  src={loaderMeta.icon}
                  alt={selectedInstance.loader}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/loaders/vanilla.svg';
                  }}
                  className="w-3.5 h-3.5 object-contain"
                />
                <span className="text-[#c4cbdd]">{selectedInstance.loader})</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#71788e] group-hover:text-white transition-colors" />
            </button>
          ) : (
            <button
              onClick={handleOpenModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#1a1518] hover:bg-[#281b22] text-[#ff8080] border border-[#4a2228] text-xs font-mono transition-colors cursor-pointer"
            >
              {t.modsNoInstanceSelected}
            </button>
          )}
        </div>

        {/* Center / Right: Content Type Switcher (Mods / Resource Packs / Shaders), Monolith Tabs, Open Folder */}
        <div className="flex items-center gap-3">
          {/* Content Type Selector (Mods / Textures / Shaders / Datapacks) */}
          <div className="flex items-center p-1 bg-[#12141c] rounded-xl border border-[#232736]">
            <button
              onClick={() => handleSelectContentType('mod')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all font-['Barlow_Condensed',sans-serif] ${
                contentType === 'mod'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b92a5] hover:text-white'
              }`}
            >
              {t.contentTabMods}
            </button>
            <button
              onClick={() => handleSelectContentType('resourcepack')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all font-['Barlow_Condensed',sans-serif] ${
                contentType === 'resourcepack'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b92a5] hover:text-white'
              }`}
            >
              {t.contentTabResourcePacks}
            </button>
            <button
              onClick={() => handleSelectContentType('shader')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all font-['Barlow_Condensed',sans-serif] ${
                contentType === 'shader'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b92a5] hover:text-white'
              }`}
            >
              {t.contentTabShaders}
            </button>
            <button
              onClick={() => handleSelectContentType('datapack')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all font-['Barlow_Condensed',sans-serif] flex items-center gap-1.5 ${
                contentType === 'datapack'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b92a5] hover:text-white'
              }`}
            >
              <Globe className="w-3 h-3" />
              {t.contentTabDatapacks}
            </button>
          </div>

          <div className="h-5 w-px bg-[#232736]" />

          {/* Catalog vs Installed */}
          <div className="flex items-center p-1 bg-[#12141c] rounded-xl border border-[#232736]">
            <button
              onClick={() => {
                playPalateClick(0.18);
                setActiveTab('catalog');
              }}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all font-['Barlow_Condensed',sans-serif] ${
                activeTab === 'catalog'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b92a5] hover:text-white'
              }`}
            >
              {t.modsTabCatalog}
            </button>
            <button
              onClick={() => {
                playPalateClick(0.18);
                setActiveTab('installed');
              }}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all font-['Barlow_Condensed',sans-serif] ${
                activeTab === 'installed'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b92a5] hover:text-white'
              }`}
            >
              <span>{t.modsTabInstalled}</span>
              {installedMods.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                    activeTab === 'installed'
                      ? 'bg-black text-white'
                      : 'bg-[#1e2230] text-[#c4cbdd] border border-[#2d3345]'
                  }`}
                >
                  {installedMods.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleOpenModsFolder}
            title={t.modsOpenFolderBtn}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#14161f] hover:bg-[#1e2230] text-[#8e96ac] hover:text-white border border-[#2b3042] hover:border-white/50 text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#8b92a5]" />
            <span>{t.modsOpenFolderBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
        {/* Offline Alert Banner if Internet is down */}
        {!isOnline && (
          <div className="px-4 py-3 rounded-xl bg-[#1b1215] border border-[#482027] flex items-center gap-3 text-red-200">
            <WifiOff className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-red-300 uppercase tracking-wide font-['Barlow_Condensed',sans-serif]">
                {t.modsOfflineTitle}
              </div>
              <div className="text-xs text-red-200/80 mt-0.5">
                {t.modsOfflineDesc}
              </div>
            </div>
          </div>
        )}

        {/* View Selection: Catalog vs Installed with smooth animated transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'catalog' ? (
            <motion.div
              key={`catalog-${contentType}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-1 flex flex-col overflow-hidden gap-4"
            >
            {/* Top Toolbar: Search + Source Filters + Active API Indicators */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Search Bar with Monolith Styling */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7e87a0] pointer-events-none z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    contentType === 'resourcepack'
                      ? t.modsSearchPlaceholderResourcePacks
                      : contentType === 'shader'
                      ? t.modsSearchPlaceholderShaders
                      : contentType === 'datapack'
                      ? t.modsSearchPlaceholderDatapacks
                      : t.modsSearchPlaceholderMods
                  }
                  disabled={!isOnline || ((contentType === 'mod' || contentType === 'shader') && isVanilla)}
                  className="w-full pl-10 pr-9 py-2 bg-[#0c0d12]/92 backdrop-blur-xl border border-[#222534] hover:border-[#383e52] focus:border-white/70 rounded-xl text-xs text-white placeholder-[#60677d] focus:outline-none transition-colors disabled:opacity-40"
                />
                {isLoadingCatalog && (
                  <RotateCw className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-white animate-spin pointer-events-none z-10" />
                )}
              </div>

              {/* Source Filter Group with Monolith Theme */}
              <div className="flex items-center gap-1 p-1 bg-[#0c0d12]/92 backdrop-blur-xl border border-[#222534] rounded-xl text-xs font-mono shrink-0">
                <button
                  onClick={() => {
                    playPalateClick(0.18);
                    setSourceFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all font-['Barlow_Condensed',sans-serif] ${
                    sourceFilter === 'all'
                      ? 'bg-white text-black font-black'
                      : 'text-[#848d9f] hover:text-white'
                  }`}
                >
                  {t.modsSourceFilterAll}
                </button>
                <button
                  onClick={() => {
                    playPalateClick(0.18);
                    setSourceFilter('modrinth');
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all font-['Barlow_Condensed',sans-serif] ${
                    sourceFilter === 'modrinth'
                      ? 'bg-white text-black'
                      : 'text-[#848d9f] hover:text-white'
                  }`}
                >
                  <ModrinthIcon className={`w-3.5 h-3.5 ${sourceFilter === 'modrinth' ? 'text-black' : 'text-[#10b981]'}`} />
                  <span>Modrinth</span>
                </button>
                <button
                  onClick={() => {
                    playPalateClick(0.18);
                    setSourceFilter('curseforge');
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-black uppercase tracking-wider transition-all font-['Barlow_Condensed',sans-serif] ${
                    sourceFilter === 'curseforge'
                      ? 'bg-white text-black'
                      : 'text-[#848d9f] hover:text-white'
                  }`}
                >
                  <CurseForgeIcon className={`w-3.5 h-3.5 ${sourceFilter === 'curseforge' ? 'text-black' : 'text-[#f97316]'}`} />
                  <span>CurseForge</span>
                </button>
              </div>

              {/* Genre / Category Filter Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playPalateClick(0.18);
                    setIsCategoryMenuOpen(!isCategoryMenuOpen);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0d12]/92 backdrop-blur-xl border border-[#222534] hover:border-[#383e52] text-xs font-['Barlow_Condensed',sans-serif] uppercase tracking-wider text-white transition-colors cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-[#8c94ac]" />
                  <span>
                    {t[CATEGORIES.find((c) => c.id === selectedCategory)?.labelKey || 'modCategoryAll']}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#8c94ac] transition-transform duration-200 ${
                      isCategoryMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isCategoryMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsCategoryMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 w-48 bg-[#0d0f17] border border-[#232738] rounded-xl shadow-2xl p-1 z-40 flex flex-col gap-0.5"
                      >
                        {CATEGORIES.map((cat) => {
                          const isSelected = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                playPalateClick(0.18);
                                setSelectedCategory(cat.id);
                                setIsCategoryMenuOpen(false);
                              }}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-['Barlow_Condensed',sans-serif] uppercase tracking-wider transition-colors text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-white text-black font-black'
                                  : 'text-[#94a3b8] hover:text-white hover:bg-[#161926]'
                              }`}
                            >
                              <span>{t[cat.labelKey]}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[2.5]" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {!isOnline ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#64748b]">
                  <WifiOff className="w-12 h-12 stroke-[1.2] mb-3 text-[#475569]" />
                  <span className="text-sm font-bold text-white uppercase font-['Barlow_Condensed',sans-serif] tracking-wider">
                    {t.modsOfflineTitle}
                  </span>
                  <span className="text-xs max-w-sm mt-1 text-[#8b92a5]">
                    {t.modsOfflineDesc}
                  </span>
                </div>
              ) : isUnsupportedContent ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#94a3b8] max-w-2xl mx-auto">
                  <div className="w-20 h-20 rounded-2xl bg-[#261317]/80 border border-[#5c1d27] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(244,63,94,0.15)]">
                    <ShieldAlert className="w-10 h-10 stroke-[1.8] text-[#fb7185]" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white uppercase font-['Barlow_Condensed',sans-serif] tracking-wider mb-2">
                    {unsupportedWarning}
                  </span>
                  <span className="text-sm sm:text-base max-w-lg text-[#94a3b8] leading-relaxed">
                    {unsupportedHint}
                  </span>
                </div>
              ) : isLoadingCatalog && filteredCatalogMods.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-[#8b92a5] gap-3">
                  <RotateCw className="w-8 h-8 text-white animate-spin stroke-[2]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#94a3b8]">
                    {contentType === 'resourcepack' ? t.modsLoadingResourcePacks : contentType === 'shader' ? t.modsLoadingShaders : contentType === 'datapack' ? t.modsLoadingDatapacks : t.modsLoadingMods}
                  </span>
                </div>
              ) : filteredCatalogMods.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#64748b]">
                  <Package className="w-12 h-12 stroke-[1.2] mb-3 text-[#334155]" />
                  <span className="text-sm font-bold text-white uppercase font-['Barlow_Condensed',sans-serif] tracking-wider">
                    {t.modsNotFound}
                  </span>
                  <span className="text-xs max-w-sm mt-1 text-[#71788e]">
                    {t.modsNotFoundHint}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredCatalogMods.map((mod) => {
                      const installed = isModInstalled(mod);
                      const isDownloading = downloadingModId === mod.id;

                      return (
                        <motion.div
                          key={mod.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.18,
                            ease: 'easeOut',
                          }}
                          onClick={() => {
                            playPalateClick(0.18);
                            setSelectedModForDetails(mod);
                          }}
                          className="group relative rounded-2xl bg-[#0c0d12]/92 backdrop-blur-xl border border-[#222534] hover:border-white/60 p-4 flex flex-col justify-between gap-3.5 transition-all shadow-md hover:shadow-xl cursor-pointer"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#14161f] border border-[#242938] shrink-0">
                              <ProgressiveImage
                                src={mod.icon_url || generateModBadgeIcon(mod.title || 'Mod', mod.slug || mod.id)}
                                alt={mod.title}
                                fallbackSrc={generateModBadgeIcon(mod.title || 'Mod', mod.slug || mod.id)}
                                objectFit="cover"
                                className="w-full h-full"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-white transition-colors tracking-wide">
                                {mod.title}
                              </h4>

                              <p className="text-xs text-[#8b92a5] line-clamp-2 mt-1 leading-relaxed">
                                {mod.description}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer: Downloads Count, Environment Badge & Logos next to Button */}
                          <div className="flex items-center justify-between pt-3 border-t border-[#1d202b]">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#71788e]">
                                <Download className="w-3 h-3 text-[#586078] shrink-0" />
                                <span>{formatDownloadCount(mod.downloads, t.modsDownloadsUnit)}</span>
                              </span>
                              {contentType === 'mod' && mod.environment && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-[#151824] border border-[#232838] text-[#94a3b8]">
                                  {mod.environment === 'client'
                                    ? t.modEnvClient
                                    : mod.environment === 'server'
                                    ? t.modEnvServer
                                    : t.modEnvBoth}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Platform availability logos directly to the left of the button */}
                              {(mod.hasModrinth || mod.hasCurseForge) && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#141620] border border-[#252a3b] shrink-0">
                                  {mod.hasModrinth && (sourceFilter === 'all' || sourceFilter === 'modrinth') && (
                                    <span title="Modrinth" className="inline-flex items-center">
                                      <ModrinthIcon className="w-3.5 h-3.5 text-[#10b981]" />
                                    </span>
                                  )}
                                  {mod.hasCurseForge && (sourceFilter === 'all' || sourceFilter === 'curseforge') && (
                                    <span title="CurseForge" className="inline-flex items-center">
                                      <CurseForgeIcon className="w-3.5 h-3.5 text-[#f97316]" />
                                    </span>
                                  )}
                                </div>
                              )}

                              {installed ? (
                                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-[#14231a] border border-[#214c33] px-3 py-1 rounded-xl shrink-0">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                                  <span>{t.modsInstalledBadge}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInstallMod(mod);
                                  }}
                                  disabled={isDownloading}
                                  className="flex items-center gap-2 px-4 h-8 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-['Barlow_Condensed',sans-serif] shadow-sm shrink-0 bg-white hover:bg-[#e4e7ee] active:scale-95 text-black border border-white"
                                >
                                  {isDownloading ? (
                                    <>
                                      <RotateCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                                      <span className="truncate max-w-[150px] text-[11px]">{downloadingStatusText || t.modsInstallingBtn}</span>
                                    </>
                                  ) : (
                                    <>
                                      {contentType === 'datapack' ? <Globe className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5 stroke-[2.5]" />}
                                      <span>{contentType === 'datapack' ? t.datapackInstallTo : t.modsInstallBtn}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Load More Button */}
                  {catalogMods.length < totalHits && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="group relative px-6 h-10 rounded-xl bg-[#14161f] hover:bg-[#1e2230] active:scale-95 border border-[#2b3042] hover:border-white/60 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>{t.modsInstallingBtn}</span>
                          </>
                        ) : (
                          <>
                            <span>{t.modsLoadMoreBtn}</span>
                            <span className="text-[#71788e] font-mono text-[11px]">
                              ({catalogMods.length} / {totalHits})
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Installed Content Management Tab */
          <motion.div
            key={`installed-${contentType}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {installedMods.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#64748b]">
                <Layers className="w-12 h-12 stroke-[1.2] mb-3 text-[#334155]" />
                <span className="text-sm font-bold text-white uppercase font-['Barlow_Condensed',sans-serif] tracking-wider">
                  {t.modsNoInstalled}
                </span>
                <span className="text-xs max-w-sm mt-1 text-[#8b92a5]">
                  {t.modsNoInstalledHint}
                </span>
                <button
                  onClick={handleOpenModsFolder}
                  className="mt-4 px-4 h-9 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
                >
                  {t.modsOpenFolderBtn}
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {installedMods.map((mod) => (
                    <div
                      key={mod.fileName}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        mod.isEnabled
                          ? 'bg-[#0c0d12]/92 backdrop-blur-xl border-[#222534] hover:border-[#383e52]'
                          : 'bg-[#0a0b10]/60 border-[#1a1c26] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {(() => {
                          const iconSrc = mod.iconUrl || (() => {
                            const clean = mod.cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const match = catalogMods.find((c) => {
                              const s = c.slug?.toLowerCase().replace(/[^a-z0-9]/g, '');
                              const t = c.title?.toLowerCase().replace(/[^a-z0-9]/g, '');
                              return (s && (clean.includes(s) || s.includes(clean))) || (t && (clean.includes(t) || t.includes(clean)));
                            });
                            return match?.icon_url || generateModBadgeIcon(mod.cleanName);
                          })();

                          return (
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#14161f] border border-[#242938] shrink-0">
                              <ProgressiveImage
                                src={iconSrc}
                                alt={mod.cleanName}
                                fallbackSrc={generateModBadgeIcon(mod.cleanName)}
                                objectFit="cover"
                                className="w-full h-full"
                              />
                            </div>
                          );
                        })()}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate tracking-wide" title={mod.cleanName}>
                            {mod.cleanName}
                          </div>
                          <div className="text-[10px] font-mono text-[#71788e] mt-0.5 truncate" title={mod.fileName}>
                            {(mod.size / (1024 * 1024)).toFixed(2)} MB &bull; {mod.fileName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button
                          onClick={() => handleToggleMod(mod)}
                          title={mod.isEnabled ? (language === 'ru' ? 'Отключить' : 'Disable') : (language === 'ru' ? 'Включить' : 'Enable')}
                          className={`px-3 h-8 rounded-xl border text-xs font-black uppercase tracking-wider font-['Barlow_Condensed',sans-serif] flex items-center gap-1.5 transition-all cursor-pointer ${
                            mod.isEnabled
                              ? 'bg-white text-black border-white'
                              : 'bg-[#14161f] text-[#8b92a5] border-[#262b3b] hover:text-white hover:border-white/50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{mod.isEnabled ? t.modsPowerOn : t.modsPowerOff}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteMod(mod)}
                          title={t.modsDeleteBtn}
                          className="w-8 h-8 rounded-xl bg-[#201417] hover:bg-[#2e191e] border border-[#482027] text-red-400 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Centered Modal: Select Instance */}
      <AnimatePresence>
        {isModalOpen && (
          <ModsInstanceSelectModal
            instances={instances}
            selectedInstanceId={selectedInstance?.id || ''}
            language={language}
            onSelect={handleSelectInstance}
            onClose={() => {
              try {
                sessionStorage.setItem('elauncher_mods_session_instance_confirmed', 'true');
              } catch {}
              setIsModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* World Selector Modal for Datapacks */}
      <AnimatePresence>
        {worldSelectorMod && (
          <div className="fixed top-11 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { if (!installingToWorld) setWorldSelectorMod(null); }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-[#222534] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="h-14 px-5 border-b border-[#1c1f2b] flex items-center justify-between bg-[#10121a] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1a2e1a] border border-[#2d5c2d] flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-white font-['Barlow_Condensed',sans-serif]">
                      {t.datapackWorldSelectorTitle}
                    </div>
                    <div className="text-[10px] font-mono text-[#71788e] mt-0.5 truncate max-w-[280px]">
                      {worldSelectorMod.title}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWorldSelectorMod(null)}
                  disabled={!!installingToWorld}
                  className="w-8 h-8 rounded-lg bg-[#171924] hover:bg-[#282d3e] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Hint */}
              <div className="px-5 py-3 bg-[#0e1017] border-b border-[#181a24]">
                <p className="text-xs font-mono text-[#71788e]">{t.datapackWorldSelectorHint}</p>
              </div>

              {/* Worlds list */}
              <div className="flex-1 overflow-y-auto p-4 max-h-80">
                {isLoadingWorlds ? (
                  <div className="h-32 flex flex-col items-center justify-center gap-3 text-[#8b92a5]">
                    <RotateCw className="w-6 h-6 animate-spin text-white" />
                    <span className="text-xs font-mono">{language === 'ru' ? 'Поиск миров...' : 'Scanning worlds...'}</span>
                  </div>
                ) : worlds.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-3 text-center">
                    {/* No worlds found - show open folder option */}
                    <div className="w-12 h-12 rounded-2xl bg-[#141620] border border-[#272e40] flex items-center justify-center">
                      <Globe className="w-6 h-6 text-[#4a5568]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white font-['Barlow_Condensed',sans-serif] uppercase tracking-wide">
                        {t.datapackWorldNoWorlds}
                      </div>
                      <div className="text-xs text-[#71788e] mt-1 max-w-[280px]">
                        {t.datapackWorldNoWorldsHint}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!selectedInstance || !window.electronAPI?.openPath) return;
                        const sep = instancesPath.includes('/') ? '/' : '\\';
                        const savesFolder = `${instancesPath}${sep}instances${sep}${selectedInstance.id}${sep}saves`;
                        await window.electronAPI.openPath(savesFolder);
                      }}
                      className="flex items-center gap-2 px-4 h-9 rounded-xl bg-[#14161f] hover:bg-[#1e2230] border border-[#2b3042] hover:border-white/50 text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer font-['Barlow_Condensed',sans-serif]"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>{language === 'ru' ? 'Открыть папку saves' : 'Open saves folder'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {worlds.map((world) => {
                      const slug = worldSelectorMod?.slug?.toLowerCase() || '';
                      const cleanTitle = worldSelectorMod?.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
                      const isAlreadyInstalled = world.installedDatapacks?.some((f) => {
                        const lower = f.toLowerCase().replace(/[^a-z0-9]/g, '');
                        return (slug && lower.includes(slug)) || (cleanTitle && lower.includes(cleanTitle));
                      });
                      const isInstallingThis = installingToWorld === world.name;

                      return (
                        <div
                          key={world.name}
                          className={`w-full flex items-center justify-between gap-3.5 p-3.5 rounded-xl border transition-all ${
                            isInstallingThis
                              ? 'bg-[#121622] border-[#2b3956]'
                              : isAlreadyInstalled
                              ? 'bg-[#0b1411] border-[#163827]'
                              : 'bg-[#0f1018] hover:bg-[#141622] border-[#1d212d] hover:border-[#2b3245]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* World icon or grass block placeholder */}
                            <div className="w-10 h-10 rounded-xl bg-[#141a10] border border-[#253318] flex items-center justify-center shrink-0 overflow-hidden">
                              {world.icon ? (
                                <img src={world.icon} alt={world.name} className="w-full h-full object-cover [image-rendering:pixelated]" />
                              ) : (
                                <Globe className="w-5 h-5 text-[#4a7c3f]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate" title={world.name}>
                                {world.name}
                              </div>
                              <div className="text-xs font-mono text-[#71788e] mt-0.5">
                                {isAlreadyInstalled
                                  ? (language === 'ru' ? 'Датапак уже установлен' : 'Datapack already installed')
                                  : t.datapackWorldLabel}
                              </div>
                            </div>
                          </div>

                          {isInstallingThis ? (
                            <div className="flex items-center gap-2 text-xs font-mono text-white shrink-0">
                              <RotateCw className="w-3.5 h-3.5 animate-spin text-[#8ea0c7]" />
                              <span>{language === 'ru' ? 'Установка...' : 'Installing...'}</span>
                            </div>
                          ) : isAlreadyInstalled ? (
                            <div className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-[#11261d] border border-[#1b4332] text-xs font-bold text-[#34d399] font-mono shrink-0 select-none">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{language === 'ru' ? 'Установлен' : 'Installed'}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleInstallDatapackToWorld(world.name)}
                              disabled={!!installingToWorld}
                              className="flex items-center gap-2 px-3.5 h-8 rounded-xl bg-white hover:bg-[#f0f2f8] active:scale-95 text-black text-xs font-black uppercase font-['Barlow_Condensed',sans-serif] shrink-0 transition-all cursor-pointer shadow-sm disabled:opacity-40"
                            >
                              <Download className="w-3 h-3 stroke-[2.5]" />
                              <span>{t.datapackInstallTo}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#181a24] bg-[#090a0f] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (!selectedInstance || !window.electronAPI?.openPath) return;
                      const sep = instancesPath.includes('/') ? '/' : '\\';
                      await window.electronAPI.openPath(`${instancesPath}${sep}instances${sep}${selectedInstance.id}${sep}saves`);
                    }}
                    className="flex items-center gap-1.5 text-xs font-mono text-[#71788e] hover:text-white transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>{t.datapackOpenFolderBtn}</span>
                  </button>

                  <button
                    onClick={() => fetchWorldsForInstance()}
                    disabled={isLoadingWorlds || !!installingToWorld}
                    title={language === 'ru' ? 'Обновить миры' : 'Refresh worlds'}
                    className="flex items-center gap-1.5 text-xs font-mono text-[#71788e] hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <RotateCw className={`w-3 h-3 ${isLoadingWorlds ? 'animate-spin' : ''}`} />
                    <span>{language === 'ru' ? 'Обновить' : 'Refresh'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setWorldSelectorMod(null)}
                  disabled={!!installingToWorld}
                  className="px-4 h-8 rounded-xl bg-[#141620] hover:bg-[#1d2130] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t.cancel}
                </button>
              </div>

              {/* Clean Minimal Progress Overlay */}
              <AnimatePresence>
                {transferAnim && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-[#07080c]/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 select-none"
                  >
                    <div className="w-full max-w-xs space-y-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-[#141824] border border-[#27314a] flex items-center justify-center shadow-lg">
                          {transferAnim.completed ? (
                            <Check className="w-6 h-6 text-emerald-400 stroke-[3]" />
                          ) : (
                            <RotateCw className="w-6 h-6 animate-spin text-white" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white">
                          {transferAnim.completed
                            ? (language === 'ru' ? 'Датапак установлен!' : 'Datapack Installed!')
                            : (language === 'ru' ? 'Установка датапака...' : 'Installing Datapack...')}
                        </div>
                        <div className="text-xs font-mono text-[#94a3b8] truncate">
                          {transferAnim.datapackTitle} → {transferAnim.worldName}
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-[#171a26] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: '10%' }}
                          animate={{ width: transferAnim.completed ? '100%' : '85%' }}
                          transition={{ duration: transferAnim.completed ? 0.3 : 1.2, ease: 'easeOut' }}
                          className={`h-full ${transferAnim.completed ? 'bg-emerald-400' : 'bg-white'}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Centered Modal: Detailed Mod Inspection */}
      <AnimatePresence>
        {selectedModForDetails && (
          <ModDetailsModal
            mod={selectedModForDetails}
            isInstalled={isModInstalled(selectedModForDetails)}
            isDownloading={downloadingModId === selectedModForDetails.id}
            downloadingStatusText={downloadingStatusText}
            language={language}
            targetVersion={selectedInstance?.version}
            targetLoader={contentType === 'mod' ? selectedInstance?.loader : undefined}
            onInstall={handleInstallMod}
            onClose={() => setSelectedModForDetails(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {modToDelete && (
          <div className="fixed top-11 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => !isDeleting && setModToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[#2e2327] bg-[#0e0f14] shadow-2xl p-6 overflow-hidden flex flex-col gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#231519] border border-[#482027] flex items-center justify-center text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {language === 'ru' ? 'Вы правда хотите его удалить?' : 'Are you sure you want to delete this mod?'}
                  </h3>
                  <p className="text-xs font-mono text-[#8b92a5] mt-1 break-all">
                    {modToDelete.cleanName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1a1c26]">
                <button
                  type="button"
                  onClick={() => setModToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 h-9 rounded-xl bg-[#141620] hover:bg-[#1d2130] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 h-9 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer font-['Barlow_Condensed',sans-serif] flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'ru' ? 'Удаление...' : 'Deleting...'}</span>
                    </>
                  ) : (
                    <span>{t.modsDeleteBtn}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
