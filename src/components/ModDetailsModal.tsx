import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Download,
  Check,
  RotateCw,
  Users,
  ImageIcon,
  FileText,
  Scale,
  Heart,
  Globe,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
  History,
  AlertTriangle,
} from 'lucide-react';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';
import { playPalateClick } from '../utils/sound';
import {
  fetchModFullDetails,
  fetchModVersions,
  formatDownloadCount,
  generateModBadgeIcon,
  type ModFullDetails,
  type UnifiedModItem,
  type ModDownloadVersion,
} from '../utils/modrinthService';
import { ProgressiveImage } from './ProgressiveImage';

interface ModDetailsModalProps {
  mod: UnifiedModItem;
  isInstalled: boolean;
  isDownloading: boolean;
  downloadingStatusText?: string | null;
  language?: Language;
  targetVersion?: string;
  targetLoader?: string;
  onInstall: (mod: UnifiedModItem, customVersionFile?: { url: string; fileName: string; size: number }) => void;
  onClose: () => void;
}

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

function renderFormattedMarkdown(text: string, onOpenLink: (url: string) => void) {
  if (!text) return null;

  // Pre-process: handle raw HTML links <a href="...">...</a>, raw HTML image tags <img ... src="..." ... /> and <br>
  const cleanHtmlPass = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '![]($1)')
    .replace(/<\/?[a-z0-9_-]+[^>]*>/gi, ''); // remove residual html tags

  const lines = cleanHtmlPass.split('\n');

  return lines.map((line, idx) => {
    let trimmed = line.trim();

    // Check if line is an image badge: ![alt](url) or [![alt](imgUrl)](linkUrl)
    // E.g. [![discord](img)](link) or ![discord](url)
    if (trimmed.startsWith('![') || trimmed.startsWith('[![')) {
      // Check if it's a linked image badge: [![alt](imgUrl)](linkUrl)
      const linkedImgMatch = trimmed.match(/^\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)$/);
      if (linkedImgMatch) {
        const alt = linkedImgMatch[1];
        const imgUrl = linkedImgMatch[2];
        const targetUrl = linkedImgMatch[3];
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onOpenLink(targetUrl)}
            className="inline-block my-1.5 mr-2 cursor-pointer hover:opacity-85 transition-opacity align-middle"
          >
            <img src={imgUrl} alt={alt || 'badge'} className="max-h-8 inline-block rounded-xs" loading="lazy" />
          </button>
        );
      }

      // Check if it's a standalone image: ![alt](url)
      const standaloneImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (standaloneImgMatch) {
        const alt = standaloneImgMatch[1];
        const imgUrl = standaloneImgMatch[2];
        return (
          <div key={idx} className="my-2.5">
            <img
              src={imgUrl}
              alt={alt || 'Image'}
              className="max-h-64 max-w-full rounded-xl border border-[#202534] bg-[#08090d] object-contain"
              loading="lazy"
            />
          </div>
        );
      }
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-sm font-bold text-white mt-4 mb-1.5 font-['Barlow_Condensed',sans-serif] tracking-wider uppercase">
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-base font-bold text-white mt-5 mb-2 font-['Barlow_Condensed',sans-serif] tracking-wider uppercase border-b border-[#202534] pb-1">
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={idx} className="text-lg font-black text-white mt-6 mb-2.5 font-['Barlow_Condensed',sans-serif] tracking-wider uppercase border-b border-[#262c3e] pb-1.5">
          {trimmed.slice(2)}
        </h2>
      );
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      return <hr key={idx} className="my-4 border-[#222738]" />;
    }

    // Empty line
    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }

    // Bullet line
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
    const content = isBullet ? trimmed.slice(2) : line;

    // Parse inline tokens:
    // 1. Linked badge / image: [![alt](imgUrl)](linkUrl)
    // 2. Inline image: ![alt](imgUrl)
    // 3. Link: [title](url)
    // 4. Bold: **text**
    // 5. Code: `code`
    const parts: (string | React.ReactNode)[] = [];
    const inlineRegex = /(\[!\[(.*?)\]\((.*?)\)\]\(([^)]+)\))|(!\[(.*?)\]\(([^)]+)\))|(\[(.*?)\]\(([^)]+)\))|(\*\*(.*?)\*\*)|(`(.*?)`)/g;
    let lastIdx = 0;
    let match;

    while ((match = inlineRegex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        parts.push(content.substring(lastIdx, match.index));
      }

      if (match[1]) {
        // Linked badge [![alt](img)](url)
        const alt = match[2];
        const imgUrl = match[3];
        const linkUrl = match[4];
        parts.push(
          <button
            key={`lkimg-${idx}-${match.index}`}
            type="button"
            onClick={() => onOpenLink(linkUrl)}
            className="inline-flex items-center my-0.5 mx-1 cursor-pointer hover:opacity-80 transition-opacity align-middle"
          >
            <img src={imgUrl} alt={alt || 'badge'} className="max-h-6 rounded-xs" loading="lazy" />
          </button>
        );
      } else if (match[5]) {
        // Inline image ![alt](url)
        const alt = match[6];
        const imgUrl = match[7];
        parts.push(
          <img
            key={`img-${idx}-${match.index}`}
            src={imgUrl}
            alt={alt || 'image'}
            className="max-h-8 inline-block mx-1 rounded-xs align-middle"
            loading="lazy"
          />
        );
      } else if (match[8]) {
        // Normal link [title](url)
        const linkTitle = match[9];
        const linkUrl = match[10];
        parts.push(
          <button
            key={`a-${idx}-${match.index}`}
            type="button"
            onClick={() => onOpenLink(linkUrl)}
            className="text-[#60a5fa] hover:text-[#93c5fd] underline hover:no-underline font-medium cursor-pointer transition-colors"
          >
            {linkTitle}
          </button>
        );
      } else if (match[11]) {
        // Bold **text**
        parts.push(
          <strong key={`b-${idx}-${match.index}`} className="font-bold text-white">
            {match[12]}
          </strong>
        );
      } else if (match[13]) {
        // Code `code`
        parts.push(
          <code key={`c-${idx}-${match.index}`} className="px-1.5 py-0.5 rounded bg-[#161a26] text-[#e2e8f0] font-mono text-[11px] border border-[#252b3d]">
            {match[14]}
          </code>
        );
      }

      lastIdx = inlineRegex.lastIndex;
    }

    if (lastIdx < content.length) {
      parts.push(content.substring(lastIdx));
    }

    return (
      <div key={idx} className={`leading-relaxed text-[#cbd5e1] text-xs ${isBullet ? 'flex items-start gap-2 pl-2' : ''}`}>
        {isBullet && <span className="text-[#94a3b8] select-none leading-relaxed">•</span>}
        <span className="flex-1">{parts.length > 0 ? parts : content}</span>
      </div>
    );
  });
}

const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function ModDetailsModal({
  mod,
  isInstalled,
  isDownloading,
  downloadingStatusText,
  language = 'en',
  targetVersion,
  targetLoader,
  onInstall,
  onClose,
}: ModDetailsModalProps) {
  const t = translations[language];
  const [details, setDetails] = useState<ModFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'members' | 'versions'>('overview');
  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);

  // Versions state
  const [versionsList, setVersionsList] = useState<ModDownloadVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchModFullDetails(mod.slug || mod.id)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setIsLoading(false);

          // Eagerly preload all high-res gallery images in browser cache for instant switching
          if (data?.gallery && data.gallery.length > 0) {
            data.gallery.forEach((item) => {
              if (item.url) {
                const img = new Image();
                img.decoding = 'async';
                img.src = item.url;
              }
            });
          }
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    // Also fetch all versions
    setIsLoadingVersions(true);
    fetchModVersions(mod.id, targetVersion, targetLoader)
      .then((vList) => {
        if (isMounted) {
          setVersionsList(vList);
          setIsLoadingVersions(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingVersions(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mod, targetVersion, targetLoader]);

  const handleOpenExternal = async (rawUrl: string) => {
    if (!rawUrl) return;
    const url = rawUrl.trim().startsWith('http://') || rawUrl.trim().startsWith('https://')
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;

    try {
      if (window.electronAPI?.openExternal) {
        const ok = await window.electronAPI.openExternal(url);
        if (!ok) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const galleryItems = details?.gallery || [];
  const currentScreenshot = galleryItems[activeGalleryIdx] || null;

  return (
    <div className="fixed top-11 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Dimmed backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-xs cursor-pointer"
      />

      {/* Floating Centered Window - Fixed Dimensions with Smooth Transition */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: smoothEase }}
        className="relative z-10 w-full max-w-5xl h-[84vh] rounded-2xl border border-[#222534] bg-[#0c0d12] shadow-[0_35px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
      >
        {/* Header Bar */}
        <div className="h-16 px-6 border-b border-[#1c1f2b] flex items-center justify-between bg-[#10121a] shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#14161f] border border-[#242938] shrink-0">
              <ProgressiveImage
                src={mod.icon_url || generateModBadgeIcon(mod.title || 'Mod', mod.slug || mod.id)}
                alt={mod.title}
                fallbackSrc={generateModBadgeIcon(mod.title || 'Mod', mod.slug || mod.id)}
                objectFit="cover"
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white tracking-wide truncate">
                {mod.title}
              </h3>
              <div className="text-xs font-mono text-[#71788e] flex items-center gap-2 mt-0.5">
                {mod.author && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenExternal(`https://modrinth.com/user/${encodeURIComponent(mod.author)}`)}
                      className="text-[#94a3b8] hover:text-[#60a5fa] hover:underline transition-colors cursor-pointer flex items-center gap-1 font-medium"
                      title={mod.author}
                    >
                      <span>{mod.author}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                    <span className="text-[#3b4156]">•</span>
                  </>
                )}
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3 text-[#586078] shrink-0" />
                  <span>{formatDownloadCount(mod.downloads, t.modsDownloadsUnit)}</span>
                </span>
                {details?.followers ? (
                  <>
                    <span className="text-[#3b4156]">•</span>
                    <span>{details.followers.toLocaleString()} {t.modDetailsFollowers}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isInstalled ? (
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-[#14231a] border border-[#214c33] px-3.5 py-1.5 rounded-xl">
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>{t.modsInstalledBadge}</span>
              </div>
            ) : (
              <button
                onClick={() => onInstall(mod)}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 font-['Barlow_Condensed',sans-serif] shadow-sm"
              >
                {isDownloading ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{downloadingStatusText || t.modsInstallingBtn}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>{t.modsInstallBtn}</span>
                  </>
                )}
              </button>
            )}

            {/* Clear, High-Contrast Close Button */}
            <button
              onClick={onClose}
              title={t.close}
              className="w-8 h-8 rounded-xl bg-[#171924] hover:bg-[#282d3e] border border-[#2c3246] hover:border-white/50 text-[#cbd5e1] hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Quick Navigation */}
        <div className="px-6 py-2.5 border-b border-[#181a24] bg-[#0e1017] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-[#090a0e] rounded-xl border border-[#1e212e] text-xs font-bold">
            <button
              onClick={() => {
                playPalateClick(0.18);
                setActiveTab('overview');
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase font-['Barlow_Condensed',sans-serif] tracking-wider transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-black'
                  : 'text-[#858d9f] hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.modDetailsOverview}</span>
            </button>

            <button
              onClick={() => {
                playPalateClick(0.18);
                setActiveTab('gallery');
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase font-['Barlow_Condensed',sans-serif] tracking-wider transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-white text-black'
                  : 'text-[#858d9f] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t.modDetailsGallery}</span>
              {galleryItems.length > 0 && (
                <span className="text-[10px] font-mono opacity-80">({galleryItems.length})</span>
              )}
            </button>

            <button
              onClick={() => {
                playPalateClick(0.18);
                setActiveTab('versions');
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase font-['Barlow_Condensed',sans-serif] tracking-wider transition-all cursor-pointer ${
                activeTab === 'versions'
                  ? 'bg-white text-black'
                  : 'text-[#858d9f] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t.modDetailsVersions}</span>
              {versionsList.length > 0 && (
                <span className="text-[10px] font-mono opacity-80">({versionsList.length})</span>
              )}
            </button>

            <button
              onClick={() => {
                playPalateClick(0.18);
                setActiveTab('members');
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase font-['Barlow_Condensed',sans-serif] tracking-wider transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-white text-black'
                  : 'text-[#858d9f] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t.modDetailsMembers}</span>
              {details?.members && details.members.length > 0 && (
                <span className="text-[10px] font-mono opacity-80">({details.members.length})</span>
              )}
            </button>
          </div>

          {/* Quick External Links (Modrinth, CurseForge, or Both) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {mod.hasModrinth && (mod.slug || mod.id) && (
              <button
                type="button"
                onClick={() => handleOpenExternal(`https://modrinth.com/mod/${encodeURIComponent(mod.slug || mod.id)}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161f] hover:bg-[#1e2230] text-[#10b981] hover:text-[#34d399] border border-[#23352c] text-xs font-mono transition-all cursor-pointer"
                title="Modrinth"
              >
                <ModrinthIcon className="w-3.5 h-3.5 text-[#10b981]" />
                <span>modrinth.com</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
            )}

            {mod.hasCurseForge && (
              <button
                type="button"
                onClick={() => {
                  const cfSlug = (mod.slug || mod.title || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                  handleOpenExternal(`https://www.curseforge.com/minecraft/mc-mods/${encodeURIComponent(cfSlug || mod.slug || mod.id)}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161f] hover:bg-[#1e2230] text-[#f97316] hover:text-[#fb923c] border border-[#3e271c] text-xs font-mono transition-all cursor-pointer"
                title="CurseForge"
              >
                <CurseForgeIcon className="w-3.5 h-3.5 text-[#f97316]" />
                <span>curseforge.com</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Content Body - Fixed flex child with scroll */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-[#71788e] gap-3">
              <RotateCw className="w-6 h-6 animate-spin text-white" />
              <span className="text-xs font-mono uppercase tracking-wider">{t.modDetailsLoading}</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="tab-overview"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-5"
                >
                  {/* Summary Callout */}
                  <div className="p-4 rounded-xl bg-[#13151f] border border-[#222534] text-xs text-[#cbd5e1] leading-relaxed">
                    {details?.description || mod.description}
                  </div>

                  {/* Metadata Cards Grid: License, Categories, Loaders (Strict Minimal Monolith Styling) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* License */}
                    <div className="p-3.5 rounded-xl bg-[#10121a] border border-[#202433]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#818a9e] uppercase font-['Barlow_Condensed',sans-serif] tracking-wider mb-1.5">
                        <Scale className="w-4 h-4 text-[#94a3b8]" />
                        <span>{t.modDetailsLicense}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white truncate" title={details?.license?.name || details?.license?.id || 'Unknown'}>
                        {details?.license?.name || details?.license?.id || 'Custom / All Rights Reserved'}
                      </div>
                    </div>

                    {/* Loaders */}
                    <div className="p-3.5 rounded-xl bg-[#10121a] border border-[#202433]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#818a9e] uppercase font-['Barlow_Condensed',sans-serif] tracking-wider mb-1.5">
                        <Layers className="w-4 h-4 text-[#94a3b8]" />
                        <span>{t.modDetailsSupportedLoaders}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(details?.loaders || ['fabric']).map((loader) => (
                          <span
                            key={loader}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141620] border border-[#252a3b] text-[#cbd5e1] uppercase"
                          >
                            {loader}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="p-3.5 rounded-xl bg-[#10121a] border border-[#202433]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#818a9e] uppercase font-['Barlow_Condensed',sans-serif] tracking-wider mb-1.5">
                        <Tag className="w-4 h-4 text-[#94a3b8]" />
                        <span>{t.modDetailsCategories}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(details?.categories || mod.categories || []).slice(0, 4).map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141620] border border-[#252a3b] text-[#cbd5e1] uppercase"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* External Links Bar */}
                  {(details?.source_url || details?.issues_url || details?.wiki_url || details?.discord_url || (details?.donation_urls && details.donation_urls.length > 0)) && (
                    <div className="p-4 rounded-xl bg-[#10121a] border border-[#202433]">
                      <div className="text-xs font-bold text-[#818a9e] uppercase font-['Barlow_Condensed',sans-serif] tracking-wider mb-2.5">
                        {t.modDetailsExternalLinks}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {details.source_url && (
                          <button
                            onClick={() => handleOpenExternal(details.source_url!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] hover:bg-[#1f2333] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#94a3b8]" />
                            <span>{t.modDetailsSource}</span>
                          </button>
                        )}
                        {details.issues_url && (
                          <button
                            onClick={() => handleOpenExternal(details.issues_url!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] hover:bg-[#1f2333] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                          >
                            <span>{t.modDetailsIssues}</span>
                          </button>
                        )}
                        {details.wiki_url && (
                          <button
                            onClick={() => handleOpenExternal(details.wiki_url!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] hover:bg-[#1f2333] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                          >
                            <span>{t.modDetailsWiki}</span>
                          </button>
                        )}
                        {details.discord_url && (
                          <button
                            onClick={() => handleOpenExternal(details.discord_url!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] hover:bg-[#1f2333] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                          >
                            <span>{t.modDetailsDiscord}</span>
                          </button>
                        )}
                        {details.donation_urls?.map((d) => (
                          <button
                            key={d.url}
                            onClick={() => handleOpenExternal(d.url)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141620] hover:bg-[#1f2333] border border-[#252a3b] text-xs font-mono text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5 text-[#94a3b8]" />
                            <span>{t.modDetailsDonate} ({d.platform})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mod Description Body (clean preview) */}
                  <div className="p-6 rounded-xl bg-[#0a0b10] border border-[#1d202b]">
                    <div className="text-xs font-bold text-[#94a3b8] uppercase font-['Barlow_Condensed',sans-serif] tracking-wider mb-3">
                      Описание
                    </div>
                    {details?.body ? (
                      <div className="space-y-1.5 overflow-y-visible">
                        {renderFormattedMarkdown(details.body, handleOpenExternal)}
                      </div>
                    ) : (
                      <div className="text-xs text-[#64748b]">{t.modDetailsNoDescription}</div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Gallery Tab: Integrated In-Place Theater (All in 1 place without window resizing or popup jumps) */}
              {activeTab === 'gallery' && (
                <motion.div
                  key="tab-gallery"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="h-full flex flex-col gap-4"
                >
                  {galleryItems.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-[#64748b] gap-2">
                      <ImageIcon className="w-10 h-10 text-[#334155]" />
                      <span className="text-xs font-mono">{t.modDetailsNoGallery}</span>
                    </div>
                  ) : (
                    <>
                      {/* Featured In-Place Cinema Preview */}
                      <div className="relative flex-1 min-h-[300px] max-h-[460px] rounded-xl bg-[#08090d] border border-[#202433] overflow-hidden flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          {currentScreenshot && (
                            <motion.div
                              key={currentScreenshot.url}
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2, ease: smoothEase }}
                              className="w-full h-full"
                            >
                              <ProgressiveImage
                                src={currentScreenshot.url}
                                alt={currentScreenshot.title || 'Screenshot'}
                                objectFit="contain"
                                className="w-full h-full"
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Prev / Next controls */}
                        {galleryItems.length > 1 && (
                          <>
                            <button
                              onClick={() => {
                                playPalateClick(0.18);
                                setActiveGalleryIdx((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1));
                              }}
                              className="absolute left-3 w-9 h-9 rounded-xl bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                playPalateClick(0.18);
                                setActiveGalleryIdx((prev) => (prev < galleryItems.length - 1 ? prev + 1 : 0));
                              }}
                              className="absolute right-3 w-9 h-9 rounded-xl bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* Title caption overlay */}
                        {currentScreenshot?.title && (
                          <div className="absolute bottom-2 left-3 right-3 text-center pointer-events-none">
                            <span className="inline-block text-[11px] font-mono font-bold text-white bg-black/75 px-3 py-1 rounded-lg border border-white/10">
                              {currentScreenshot.title}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Filmstrip Thumbnails Row */}
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 shrink-0">
                        {galleryItems.map((img, idx) => (
                          <button
                            key={img.url}
                            onClick={() => {
                              playPalateClick(0.18);
                              setActiveGalleryIdx(idx);
                            }}
                            className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                              activeGalleryIdx === idx
                                ? 'border-white scale-102 shadow-md'
                                : 'border-[#222534] opacity-50 hover:opacity-100 hover:border-[#3e445a]'
                            }`}
                          >
                            <ProgressiveImage
                              src={img.url}
                              alt={`Thumbnail ${idx + 1}`}
                              objectFit="cover"
                              enableBlur={false}
                              className="w-full h-full"
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <motion.div
                  key="tab-members"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                >
                  {(!details?.members || details.members.length === 0) ? (
                    <div className="h-64 flex flex-col items-center justify-center text-[#64748b] gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenExternal(`https://modrinth.com/user/${encodeURIComponent(mod.author || 'Author')}`)}
                        className="px-4 py-2 rounded-xl bg-[#10121a] hover:bg-[#161a26] border border-[#202433] hover:border-[#38415c] text-xs font-mono text-white hover:text-[#60a5fa] transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span>{mod.author || 'Author'}</span>
                        <ExternalLink className="w-3 h-3 text-[#60a5fa]" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {details.members.map((mem) => (
                        <button
                          key={mem.username}
                          type="button"
                          onClick={() => handleOpenExternal(`https://modrinth.com/user/${encodeURIComponent(mem.username)}`)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#10121a] hover:bg-[#161a26] border border-[#202433] hover:border-[#38415c] transition-all text-left cursor-pointer group"
                        >
                          {mem.avatar ? (
                            <img
                              src={mem.avatar}
                              alt={mem.username}
                              className="w-10 h-10 rounded-full object-cover bg-[#171924] border border-[#282d3e] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#171924] border border-[#282d3e] flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {mem.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-white truncate tracking-wide group-hover:text-[#60a5fa] transition-colors flex items-center gap-1.5">
                              <span>{mem.username}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#60a5fa] shrink-0" />
                            </div>
                            <div className="text-[10px] font-mono text-[#828b9f] mt-0.5 uppercase tracking-wider">
                              {mem.role}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Versions Tab */}
              {activeTab === 'versions' && (
                <motion.div
                  key="tab-versions"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-3"
                >
                  {isLoadingVersions ? (
                    <div className="h-64 flex flex-col items-center justify-center text-[#858d9f] gap-3">
                      <RotateCw className="w-7 h-7 text-white animate-spin stroke-[2]" />
                      <span className="text-xs font-mono uppercase tracking-widest">{t.modDetailsLoading}</span>
                    </div>
                  ) : versionsList.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-[#64748b] gap-2">
                      <History className="w-8 h-8 text-[#3e445a]" />
                      <span className="text-xs font-mono text-[#8b92a5]">{t.modDetailsNoVersions}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {versionsList.map((ver) => {
                        const targetFile = ver.files.find((f) => f.primary) || ver.files[0];

                        // Compatibility check against selected instance
                        const matchesGameVersion = !targetVersion || (ver.game_versions && ver.game_versions.includes(targetVersion));
                        const matchesLoader = !targetLoader || targetLoader === 'Vanilla' || (ver.loaders && ver.loaders.map((l) => l.toLowerCase()).includes(targetLoader.toLowerCase()));
                        const isCompatible = matchesGameVersion && matchesLoader;

                        const isDownloadingThis = downloadingVersionId === ver.id;

                        return (
                          <div
                            key={ver.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isCompatible
                                ? 'bg-[#0f121a] hover:bg-[#141824] border-[#222a3d] hover:border-[#384666]'
                                : 'bg-[#101014]/60 border-[#1f2029] opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-bold text-white tracking-wide font-mono">
                                    {ver.version_number}
                                  </span>

                                  {/* Version release channel badge */}
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      ver.version_type === 'release'
                                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                        : ver.version_type === 'beta'
                                        ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {ver.version_type || 'release'}
                                  </span>

                                  {/* Compatibility Status Badge */}
                                  {targetVersion && (
                                    <span
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        isCompatible
                                          ? 'bg-[#16291a] border border-[#2b5934] text-emerald-300'
                                          : 'bg-[#261517] border border-[#522228] text-rose-300'
                                      }`}
                                    >
                                      {isCompatible ? (
                                        <>
                                          <Check className="w-3 h-3 stroke-[2.5]" />
                                          <span>{t.modDetailsVersionCompatible}</span>
                                        </>
                                      ) : (
                                        <>
                                          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                                          <span>{t.modDetailsVersionIncompatible}</span>
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs font-mono text-[#8c94aa] mt-1 truncate" title={ver.name}>
                                  {ver.name}
                                </div>

                                {/* Supported game versions & loaders info */}
                                <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px] font-mono text-[#6c748c]">
                                  {ver.game_versions && ver.game_versions.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[#4e556b]">{t.modDetailsVersionGameVersions}:</span>
                                      <span className="text-[#a6b0cc]">
                                        {ver.game_versions.slice(0, 3).join(', ')}
                                        {ver.game_versions.length > 3 && ` +${ver.game_versions.length - 3}`}
                                      </span>
                                    </div>
                                  )}

                                  {ver.loaders && ver.loaders.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[#4e556b]">{t.modDetailsVersionLoaders}:</span>
                                      <span className="text-[#a6b0cc] uppercase">
                                        {ver.loaders.slice(0, 3).join(', ')}
                                      </span>
                                    </div>
                                  )}

                                  {targetFile && targetFile.size > 0 && (
                                    <div className="text-[#4e556b]">
                                      {(targetFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </div>
                                  )}
                                </div>

                                {!isCompatible && (
                                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-amber-400/90">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    <span>{t.modDetailsVersionWarning}</span>
                                  </div>
                                )}
                              </div>

                              {/* Install this specific version button */}
                              {targetFile && (
                                <button
                                  type="button"
                                  disabled={isDownloading || isDownloadingThis}
                                  onClick={() => {
                                    playPalateClick(0.24);
                                    setDownloadingVersionId(ver.id);
                                    onInstall(mod, {
                                      url: targetFile.url,
                                      fileName: targetFile.filename,
                                      size: targetFile.size,
                                    });
                                  }}
                                  className={`px-3.5 h-8.5 rounded-xl border text-xs font-black uppercase tracking-wider font-['Barlow_Condensed',sans-serif] flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                                    isCompatible
                                      ? 'bg-white hover:bg-[#e2e8f0] text-black border-white shadow-sm'
                                      : 'bg-[#181924] hover:bg-[#252738] text-[#cbd5e1] hover:text-white border-[#2c3046]'
                                  }`}
                                >
                                  {isDownloadingThis ? (
                                    <>
                                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>{t.modsInstallingBtn}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>{t.modDetailsVersionInstall}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
