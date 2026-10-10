import { VERSION_GROUPS, type VersionGroup, type VersionItem } from '../types/instance';

const MOJANG_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const CACHE_STORAGE_KEY = 'elauncher_synced_version_groups';
const LAST_SYNC_KEY = 'elauncher_last_version_sync_time';

export interface SyncStatus {
  isChecking: boolean;
  lastChecked: number | null;
  newVersionsCount: number;
  latestVersion?: string;
}

interface MojangManifestVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
}

interface MojangManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MojangManifestVersion[];
}

/**
 * Derives a clean block icon and preview cover for dynamically detected new versions.
 */
function deriveAssetMetadata(id: string, type: string): { blockIcon: string; coverImage: string; description: string; badge?: string } {
  if (type === 'snapshot') {
    if (id.includes('-rc')) {
      return {
        blockIcon: '/minecraft_textures/anvil.png',
        coverImage: '/version_covers/cover_1_21.svg',
        description: `Release Candidate: ${id}`,
        badge: 'RC',
      };
    }
    if (id.includes('-pre')) {
      return {
        blockIcon: '/minecraft_textures/redstone_torch.png',
        coverImage: '/version_covers/cover_1_21.svg',
        description: `Официальный пре-релиз: ${id}`,
        badge: 'Pre-release',
      };
    }
    return {
      blockIcon: '/minecraft_textures/creaking_heart.png',
      coverImage: '/version_covers/cover_1_21_4.svg',
      description: `Свежий официальный снапшот: ${id}`,
      badge: 'Снапшот',
    };
  }

  return {
    blockIcon: '/minecraft_textures/grass_block.png',
    coverImage: '/version_covers/cover_1_21.svg',
    description: `Официальный релиз Minecraft ${id}`,
  };
}

/**
 * Chronological order of 2026 series drops and snapshots as registered by Mojang:
 * Newer builds appear earlier in the array.
 */
const V26_OFFICIAL_ORDER: string[] = [
  '26.4-snapshot-3', '26.4-snapshot-2', '26.4-snapshot-1',
  '26.4',
  '26.3',
  '26.3-rc-3', '26.3-rc-2', '26.3-rc-1',
  '26.3-pre-3', '26.3-pre-2', '26.3-pre-1',
  '26.3-snapshot-10', '26.3-snapshot-9', '26.3-snapshot-8', '26.3-snapshot-7', '26.3-snapshot-6',
  '26.3-snapshot-5', '26.3-snapshot-4', '26.3-snapshot-3', '26.3-snapshot-2', '26.3-snapshot-1',
  '26.2',
  '26.2-rc-2', '26.2-rc-1',
  '26.2-pre-6', '26.2-pre-5', '26.2-pre-4', '26.2-pre-3', '26.2-pre-2', '26.2-pre-1',
  '26.2-snapshot-8', '26.2-snapshot-7', '26.2-snapshot-6', '26.2-snapshot-5', '26.2-snapshot-4', '26.2-snapshot-3', '26.2-snapshot-2',
  '26.1.2',
  '26.1.2-rc-1',
  '26.2-snapshot-1',
  '26w14a',
  '26.1.1',
  '26.1.1-rc-1',
  '26.1',
  '26.1-rc-3', '26.1-rc-2', '26.1-rc-1',
  '26.1-pre-3', '26.1-pre-2', '26.1-pre-1',
  '26.1-snapshot-11', '26.1-snapshot-10', '26.1-snapshot-9', '26.1-snapshot-8', '26.1-snapshot-7', '26.1-snapshot-6',
  '26.1-snapshot-5', '26.1-snapshot-4', '26.1-snapshot-3', '26.1-snapshot-2', '26.1-snapshot-1'
];

/**
 * Universal version rank comparator: higher score = newer version (appears higher in list).
 * Strictly guarantees that 26.4 > 26.3 > 26.2 > 26.1, and snapshots are placed correctly.
 */
export function getVersionSortScore(id: string): number {
  // 1. Explicit 26.x official chronological order
  const idx26 = V26_OFFICIAL_ORDER.indexOf(id);
  if (idx26 !== -1) {
    return 3000000000 - idx26 * 1000;
  }

  // 2. Modern 26.x / future year drops fallback (e.g. 26.5, 27.1)
  const m26 = id.match(/^(\d{2})\.(\d+)(?:\.(\d+))?(?:-(rc|pre|snapshot)-?(\d+))?$/);
  if (m26) {
    const yr = parseInt(m26[1], 10);
    const minor = parseInt(m26[2], 10);
    const patch = m26[3] ? parseInt(m26[3], 10) : 0;
    let stage = 3; // final release
    let sNum = 0;
    if (m26[4] === 'rc') { stage = 2; sNum = parseInt(m26[5], 10) || 0; }
    else if (m26[4] === 'pre') { stage = 1; sNum = parseInt(m26[5], 10) || 0; }
    else if (m26[4] === 'snapshot') { stage = 0; sNum = parseInt(m26[5], 10) || 0; }
    return yr * 100000000 + minor * 1000000 + patch * 10000 + stage * 100 + sNum;
  }

  // 3. Weekly snapshots (e.g. 26w14a, 25w46a, 24w45a, 23w12a...)
  const mw = id.match(/^(\d{2})w(\d{2})([a-z])?(?:.*)?$/);
  if (mw) {
    const yr = parseInt(mw[1], 10);
    const week = parseInt(mw[2], 10);
    const letter = mw[3] ? mw[3].charCodeAt(0) - 96 : 0;
    return yr * 100000000 + week * 10000 + letter * 100;
  }

  // 4. Standard Semver 1.x.y (e.g. 1.21.11, 1.20.4, 1.16.5)
  const m1 = id.match(/^1\.(\d+)(?:\.(\d+))?(?:-(rc|pre)-?(\d+))?$/);
  if (m1) {
    const minor = parseInt(m1[1], 10);
    const patch = m1[2] ? parseInt(m1[2], 10) : 0;
    let stage = 3;
    let sNum = 0;
    if (m1[3] === 'rc') { stage = 2; sNum = parseInt(m1[4], 10) || 0; }
    else if (m1[3] === 'pre') { stage = 1; sNum = parseInt(m1[4], 10) || 0; }
    return 100000000 + minor * 100000 + patch * 1000 + stage * 10 + sNum;
  }

  // 5. Beta
  const mb = id.match(/^b1\.(\d+)(?:\.(\d+))?$/);
  if (mb) {
    return 50000000 + parseInt(mb[1], 10) * 100 + (mb[2] ? parseInt(mb[2], 10) : 0);
  }

  // 6. Alpha
  const ma = id.match(/^a1\.(\d+)(?:\.(\d+))?$/);
  if (ma) {
    return 40000000 + parseInt(ma[1], 10) * 100 + (ma[2] ? parseInt(ma[2], 10) : 0);
  }

  // 7. Classic
  const mc = id.match(/^c(\d+)\.(\d+)/);
  if (mc) {
    return 10000000 + parseInt(mc[1], 10) * 100 + parseInt(mc[2], 10);
  }

  return 0;
}

/**
 * Sorts items inside a version group strictly by version rank descending.
 */
export function sortGroupItems(items: VersionItem[]): VersionItem[] {
  return [...items].sort((a, b) => getVersionSortScore(b.id) - getVersionSortScore(a.id));
}

/**
 * Loads cached custom groups or returns initial static groups, ensuring sorted items.
 */
export function getStoredVersionGroups(): VersionGroup[] {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VersionGroup[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((grp) => ({
          ...grp,
          items: sortGroupItems(grp.items),
        }));
      }
    }
  } catch {
    // Ignore localStorage parse errors
  }
  return VERSION_GROUPS.map((grp) => ({
    ...grp,
    items: sortGroupItems(grp.items),
  }));
}

/**
 * Fetches Mojang official manifest, identifies any new snapshots/releases
 * not currently in our list, and smoothly prepends them into the version catalogue.
 */
export async function syncOfficialVersions(
  currentGroups: VersionGroup[]
): Promise<{ updatedGroups: VersionGroup[]; newFound: number; latestSnapshot?: string }> {
  try {
    const response = await fetch(MOJANG_MANIFEST_URL, {
      cache: 'no-cache',
    });

    if (!response.ok) {
      return { updatedGroups: currentGroups, newFound: 0 };
    }

    const manifest: MojangManifest = await response.json();
    const existingIds = new Set<string>();
    currentGroups.forEach((g) => g.items.forEach((i) => existingIds.add(i.id)));

    const newItems: VersionItem[] = [];

    // Check top 60 recent entries from Mojang manifest for anything new
    for (const v of manifest.versions.slice(0, 60)) {
      if (!existingIds.has(v.id)) {
        const category = v.type === 'release' ? 'release' : 'snapshot';
        const meta = deriveAssetMetadata(v.id, v.type);

        newItems.push({
          id: v.id,
          label: v.id,
          majorGroup: category === 'release' ? 'Новые релизы' : 'Новые снапшоты',
          category,
          blockIcon: meta.blockIcon,
          coverImage: meta.coverImage,
          description: meta.description,
          badge: meta.badge,
        });
      }
    }

    if (newItems.length === 0) {
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      return { updatedGroups: currentGroups, newFound: 0, latestSnapshot: manifest.latest.snapshot };
    }

    // Clone groups and insert new items into the first matching group
    const clonedGroups: VersionGroup[] = JSON.parse(JSON.stringify(currentGroups));
    
    // Put new releases and snapshots into the top group and re-sort strictly by rank
    clonedGroups[0].items = sortGroupItems([...newItems, ...clonedGroups[0].items]);

    // Persist to local storage
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(clonedGroups));
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    return {
      updatedGroups: clonedGroups,
      newFound: newItems.length,
      latestSnapshot: manifest.latest.snapshot,
    };
  } catch (error) {
    console.warn('[VersionSync] Could not check Mojang manifest:', error);
    return { updatedGroups: currentGroups, newFound: 0 };
  }
}
