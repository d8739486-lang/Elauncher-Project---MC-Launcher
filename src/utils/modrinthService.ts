export interface LocalMod {
  fileName: string;
  cleanName: string;
  name?: string;
  iconUrl?: string | null;
  size: number;
  isEnabled: boolean;
  updatedAt: number;
}

export type ModSource = 'modrinth' | 'curseforge' | 'both';
export type ContentType = 'mod' | 'resourcepack' | 'shader' | 'datapack';

export interface UnifiedModItem {
  id: string; // project_id
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  author: string;
  source: ModSource; // 'modrinth' | 'curseforge' | 'both'
  hasModrinth: boolean;
  hasCurseForge: boolean;
  categories: string[];
  environment: 'client' | 'server' | 'both';
  projectType: ContentType;
}

export interface ModDependency {
  version_id: string | null;
  project_id: string | null;
  file_name: string | null;
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
}

export interface ModDownloadVersion {
  id: string;
  version_number: string;
  name: string;
  version_type?: 'release' | 'beta' | 'alpha';
  date_published?: string;
  downloads?: number;
  game_versions?: string[];
  loaders?: string[];
  files: {
    url: string;
    filename: string;
    primary: boolean;
    size: number;
  }[];
  dependencies?: ModDependency[];
}

const MOD_VERSIONS_CACHE = new Map<string, ModDownloadVersion[]>();

/**
 * Fetch all available versions for a project, with compatibility flags for instance
 */
export async function fetchModVersions(
  projectId: string,
  _gameVersion?: string,
  _loader?: string
): Promise<ModDownloadVersion[]> {
  const cacheKey = projectId.toLowerCase();
  if (MOD_VERSIONS_CACHE.has(cacheKey)) {
    return MOD_VERSIONS_CACHE.get(cacheKey)!;
  }

  try {
    const url = `https://api.modrinth.com/v2/project/${projectId}/version`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)',
      },
    });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    const result: ModDownloadVersion[] = (data || []).map((v) => ({
      id: v.id,
      version_number: v.version_number,
      name: v.name || v.version_number,
      version_type: v.version_type || 'release',
      date_published: v.date_published,
      downloads: v.downloads || 0,
      game_versions: v.game_versions || [],
      loaders: v.loaders || [],
      files: (v.files || []).map((f: any) => ({
        url: f.url,
        filename: f.filename,
        primary: Boolean(f.primary),
        size: f.size || 0,
      })),
      dependencies: (v.dependencies || []).map((d: any) => ({
        version_id: d.version_id || null,
        project_id: d.project_id || null,
        file_name: d.file_name || null,
        dependency_type: d.dependency_type || 'required',
      })),
    }));
    MOD_VERSIONS_CACHE.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Failed to fetch mod versions:', err);
    return [];
  }
}

/**
 * Format download numbers clearly (e.g. 91.1M, 850K, 1.2K) without odd artifacts
 */
export function formatDownloadCount(count: number, unitText = 'скачиваний'): string {
  if (!count || count <= 0) return `0 ${unitText}`;

  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(1)}B ${unitText}`;
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M ${unitText}`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K ${unitText}`;
  }
  return `${count} ${unitText}`;
}

/**
 * List of popular mods known to be hosted on both CurseForge and Modrinth
 */
const CURSEFORGE_CROSS_MODS = new Set([
  'fabric-api', 'fabric', 'jei', 'just-enough-items', 'geckolib', 'simple-voice-chat', 'voicechat', 'jade',
  'more-culling', 'zoomify', '3dskinlayers', 'skinlayers3d', 'cloth-config', 'cloth-config-api',
  'architectury-api', 'architectury', 'sodium', 'iris', 'iris-shaders', 'ferrite-core', 'ferritecore',
  'lithium', 'appleskin', 'modmenu', 'mod-menu', 'immediatelyfast', 'yacl', 'yetanotherconfiglib',
  'clumps', 'controlling', 'xaeros-minimap', 'xaeros-world-map', 'journeymap',
  'mouse-tweaks', 'continuity', 'indium', 'entityculling', 'entity-culling', 'dynamic-lights',
  'lambdynamiclights', 'wthit', 'badpackets', 'krypton', 'spark', 'distanthorizons',
  'physics-mod', 'essential', 'sodium-extra', 'reeses-sodium-options', 'optifine',
]);

// Known fallback icon URLs for popular mods missing icon_url on Modrinth
export const KNOWN_MOD_ICONS: Record<string, string> = {
  'badoptimizations': 'https://raw.githubusercontent.com/ItsThosea/BadOptimizations/26.2/forge/src/main/resources/badoptimizations-icon.png',
  'playeranimator': 'https://raw.githubusercontent.com/KosmX/minecraftPlayerAnimator/1.21/icon.png',
};

/**
 * Generates an SVG data URL with the mod's initial letter and brand gradient
 * so that any mod without an official icon displays a sleek, branded badge rather than an ugly question mark.
 */
export function generateModBadgeIcon(title: string, idOrSlug = ''): string {
  const cleanTitle = (title || 'Mod').trim();
  const initial = (cleanTitle.charAt(0) || 'M').toUpperCase();
  
  // Deterministic vibrant hue from title string
  let hash = 0;
  const str = cleanTitle + idOrSlug;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 45) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 75%, 28%)" />
        <stop offset="100%" stop-color="hsl(${hue2}, 85%, 15%)" />
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.0" />
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="22" fill="url(#grad)" />
    <rect width="96" height="96" rx="22" fill="url(#glow)" />
    <rect x="1" y="1" width="94" height="94" rx="21" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="-1">
      ${initial}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Search mods matching the Minecraft version and ModLoader
 */
export async function searchUnifiedMods(params: {
  query?: string;
  version?: string;
  loader?: string;
  category?: string;
  projectType?: ContentType;
  limit?: number;
  offset?: number;
}): Promise<{ hits: UnifiedModItem[]; total_hits: number }> {
  const currentType = params.projectType || 'mod';
  const facets: string[][] = [
    [`project_type:${currentType}`],
  ];

  if (params.version) {
    facets.push([`versions:${params.version}`]);
  }

  // Loaders are applicable to mods and shaders (shader loaders like iris/optifine)
  if (params.loader && params.loader !== 'Vanilla' && currentType === 'mod') {
    facets.push([`categories:${params.loader.toLowerCase()}`]);
  }

  if (params.category && params.category !== 'all') {
    facets.push([`categories:${params.category.toLowerCase()}`]);
  }

  const queryParams = new URLSearchParams({
    facets: JSON.stringify(facets),
    limit: String(params.limit || 24),
    offset: String(params.offset || 0),
    index: 'downloads',
  });

  if (params.query?.trim()) {
    queryParams.set('query', params.query.trim());
  }

  const url = `https://api.modrinth.com/v2/search?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)',
    },
  });

  if (!response.ok) {
    throw new Error(`Modrinth API error: ${response.status}`);
  }

  const data = await response.json();
  const rawHits = data.hits || [];

  const hits: UnifiedModItem[] = rawHits.map((item: any) => {
    const cleanSlug = (item.slug || '').toLowerCase();
    const cleanTitle = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Determine presence on CurseForge:
    // Only check cross-mods list if we are searching for mods, so that general mods (like Dynamic Lights)
    // are never mistakenly tagged as CurseForge items when browsing datapacks, resourcepacks, or shaders.
    const isBoth = currentType === 'mod' && (
      CURSEFORGE_CROSS_MODS.has(cleanSlug) ||
      Array.from(CURSEFORGE_CROSS_MODS).some((k) => cleanSlug.includes(k) || cleanTitle.includes(k))
    );

    // Determine environment (Client, Server, Client & Server)
    let environment: 'client' | 'server' | 'both' = 'both';
    if (currentType === 'resourcepack' || currentType === 'shader') {
      environment = 'client';
    } else if (currentType === 'datapack') {
      environment = 'server';
    } else {
      const isClient = item.client_side === 'required' || item.client_side === 'optional';
      const isServer = item.server_side === 'required' || item.server_side === 'optional';
      if (isClient && !isServer) {
        environment = 'client';
      } else if (!isClient && isServer) {
        environment = 'server';
      } else {
        environment = 'both';
      }
    }

    const iconUrl = item.icon_url || KNOWN_MOD_ICONS[cleanSlug] || generateModBadgeIcon(item.title || 'Mod', cleanSlug || item.project_id);

    return {
      id: item.project_id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      icon_url: iconUrl,
      downloads: item.downloads,
      author: item.author,
      source: isBoth ? 'both' : 'modrinth',
      hasModrinth: true,
      hasCurseForge: isBoth,
      categories: item.categories || [],
      environment,
      projectType: currentType,
    };
  });

  return {
    hits,
    total_hits: data.total_hits || 0,
  };
}

/**
 * Fetch compatible version download file for a mod
 */
export async function getModDownloadUrl(
  projectId: string,
  gameVersion: string,
  loader?: string
): Promise<{ url: string; fileName: string; size: number } | null> {
  const isDatapack = loader && loader.toLowerCase() === 'datapack';

  const queryParams = new URLSearchParams({
    game_versions: JSON.stringify([gameVersion]),
  });

  if (isDatapack) {
    queryParams.set('loaders', JSON.stringify(['datapack']));
  } else if (loader && loader !== 'Vanilla') {
    queryParams.set('loaders', JSON.stringify([loader.toLowerCase()]));
  }

  const url = `https://api.modrinth.com/v2/project/${projectId}/version?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)',
    },
  });

  let versions: ModDownloadVersion[] = [];

  if (response.ok) {
    versions = await response.json();
  }

  // If specific version query returned empty, query all versions of the project
  if (!versions || versions.length === 0) {
    try {
      const allUrl = isDatapack
        ? `https://api.modrinth.com/v2/project/${projectId}/version?loaders=${encodeURIComponent(JSON.stringify(['datapack']))}`
        : `https://api.modrinth.com/v2/project/${projectId}/version`;

      const fallbackRes = await fetch(allUrl, {
        headers: { 'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)' },
      });
      if (fallbackRes.ok) {
        versions = await fallbackRes.json();
      }
    } catch {}
  }

  if (!versions || versions.length === 0) {
    return null;
  }

  // For datapacks, strictly filter/prefer versions that declare 'datapack' loader or have .zip files
  if (isDatapack) {
    const datapackVersions = versions.filter(
      (v) => (v.loaders && v.loaders.includes('datapack')) || v.files.some((f) => f.filename.endsWith('.zip'))
    );
    if (datapackVersions.length > 0) {
      versions = datapackVersions;
    }
  }

  const bestVersion = versions[0];
  let targetFile = bestVersion.files.find((f) => f.primary) || bestVersion.files[0];

  // For datapacks, prefer the .zip file over any .jar file if both exist in the files array
  if (isDatapack && bestVersion.files.length > 1) {
    const zipFile = bestVersion.files.find((f) => f.filename.endsWith('.zip'));
    if (zipFile) targetFile = zipFile;
  }

  if (!targetFile) return null;

  return {
    url: targetFile.url,
    fileName: targetFile.filename,
    size: targetFile.size,
  };
}

export interface ResolvedDependencyItem {
  projectId: string;
  title: string;
  url: string;
  fileName: string;
  size: number;
}

export interface ResolvedModInstallPlan {
  mainFile: { url: string; fileName: string; size: number };
  dependencies: ResolvedDependencyItem[];
}

/**
 * Resolves a mod along with all its required dependencies that are not yet installed in the instance
 */
export async function resolveModWithDependencies(
  projectId: string,
  gameVersion: string,
  loader?: string,
  installedIdentifiers: string[] = []
): Promise<ResolvedModInstallPlan | null> {
  const queryParams = new URLSearchParams({
    game_versions: JSON.stringify([gameVersion]),
  });

  if (loader && loader !== 'Vanilla') {
    queryParams.set('loaders', JSON.stringify([loader.toLowerCase()]));
  }

  const url = `https://api.modrinth.com/v2/project/${projectId}/version?${queryParams.toString()}`;

  let versions: any[] = [];
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)' },
    });
    if (res.ok) {
      versions = await res.json();
    }
  } catch {}

  if (!versions || versions.length === 0) {
    try {
      const fallbackRes = await fetch(`https://api.modrinth.com/v2/project/${projectId}/version`, {
        headers: { 'User-Agent': 'ELauncher/1.0.0' },
      });
      if (fallbackRes.ok) {
        versions = await fallbackRes.json();
      }
    } catch {}
  }

  if (!versions || versions.length === 0) return null;

  const bestVersion = versions[0];
  const targetFile = bestVersion.files.find((f: any) => f.primary) || bestVersion.files[0];
  if (!targetFile) return null;

  const mainFile = {
    url: targetFile.url,
    fileName: targetFile.filename,
    size: targetFile.size,
  };

  const rawDeps: any[] = bestVersion.dependencies || [];
  const requiredDeps = rawDeps.filter((d: any) => d.dependency_type === 'required');

  // Check if this mod implicitly requires Fabric API (e.g. sodium, iris, modmenu, etc. on Fabric loader)
  const ldrLower = (loader || '').toLowerCase();
  const projLower = projectId.toLowerCase();
  if (ldrLower === 'fabric' && !requiredDeps.some((d: any) => d.project_id === 'P7dR8mSH' || d.project_id === 'fabric-api')) {
    const knownNeedingFabricApi = ['sodium', 'iris', 'modmenu', 'appleskin', 'cloth-config', 'betterf3', 'zoomify'];
    if (knownNeedingFabricApi.includes(projLower)) {
      requiredDeps.push({
        project_id: 'P7dR8mSH', // Fabric API official project ID
        dependency_type: 'required',
      });
    }
  }

  const dependencies: ResolvedDependencyItem[] = [];
  const seen = new Set<string>([projectId.toLowerCase()]);

  // Clean identifier matching to prevent downloading already existing mods
  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isInstalled = (query: string) => {
    const qClean = cleanStr(query);
    if (!qClean) return false;
    return installedIdentifiers.some((id) => {
      const idClean = cleanStr(id);
      return idClean.includes(qClean) || qClean.includes(idClean);
    });
  };

  for (const dep of requiredDeps) {
    let depProjectId = dep.project_id;
    const depVersionId = dep.version_id;

    // If version_id is provided directly, fetch version object to obtain project_id
    if (!depProjectId && depVersionId) {
      try {
        const vRes = await fetch(`https://api.modrinth.com/v2/version/${depVersionId}`, {
          headers: { 'User-Agent': 'ELauncher/1.0.0' },
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          depProjectId = vData.project_id;
        }
      } catch {}
    }

    if (!depProjectId || seen.has(depProjectId.toLowerCase())) continue;
    seen.add(depProjectId.toLowerCase());

    try {
      // 1. Fetch dep project details for clean name & slug
      let title = depProjectId;
      let slug = depProjectId;
      try {
        const pRes = await fetch(`https://api.modrinth.com/v2/project/${depProjectId}`, {
          headers: { 'User-Agent': 'ELauncher/1.0.0' },
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          slug = pData.slug || depProjectId;
          title = pData.title || slug;
        }
      } catch {}

      // Check if this dependency is already installed in the instance
      if (isInstalled(slug) || isInstalled(title) || isInstalled(depProjectId)) {
        continue;
      }

      // 2. Fetch compatible version for this dependency
      let bestDepFile: any = null;

      if (depVersionId) {
        try {
          const vRes = await fetch(`https://api.modrinth.com/v2/version/${depVersionId}`, {
            headers: { 'User-Agent': 'ELauncher/1.0.0' },
          });
          if (vRes.ok) {
            const vData = await vRes.json();
            bestDepFile = vData.files?.find((f: any) => f.primary) || vData.files?.[0];
          }
        } catch {}
      }

      if (!bestDepFile) {
        const depQueryParams = new URLSearchParams({
          game_versions: JSON.stringify([gameVersion]),
        });
        if (loader && loader !== 'Vanilla') {
          depQueryParams.set('loaders', JSON.stringify([loader.toLowerCase()]));
        }

        let depVersions: any[] = [];
        try {
          const dRes = await fetch(
            `https://api.modrinth.com/v2/project/${depProjectId}/version?${depQueryParams.toString()}`,
            { headers: { 'User-Agent': 'ELauncher/1.0.0' } }
          );
          if (dRes.ok) {
            depVersions = await dRes.json();
          }
        } catch {}

        if (!depVersions || depVersions.length === 0) {
          try {
            const dFallback = await fetch(`https://api.modrinth.com/v2/project/${depProjectId}/version`, {
              headers: { 'User-Agent': 'ELauncher/1.0.0' },
            });
            if (dFallback.ok) {
              depVersions = await dFallback.json();
            }
          } catch {}
        }

        if (depVersions && depVersions.length > 0) {
          const bestDep = depVersions[0];
          bestDepFile = bestDep.files?.find((f: any) => f.primary) || bestDep.files?.[0];
        }
      }

      if (bestDepFile) {
        if (!isInstalled(bestDepFile.filename)) {
          dependencies.push({
            projectId: depProjectId,
            title,
            url: bestDepFile.url,
            fileName: bestDepFile.filename,
            size: bestDepFile.size,
          });
        }
      }
    } catch (err) {
      console.warn('Could not resolve required dependency:', depProjectId, err);
    }
  }

  return {
    mainFile,
    dependencies,
  };
}

export interface ModMember {
  username: string;
  role: string;
  avatar: string | null;
}

export interface ModGalleryItem {
  url: string;
  title?: string;
  description?: string;
  featured?: boolean;
}

export interface ModFullDetails {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  icon_url: string | null;
  downloads: number;
  followers: number;
  categories: string[];
  loaders: string[];
  game_versions: string[];
  license?: {
    id?: string;
    name?: string;
    url?: string;
  };
  gallery: ModGalleryItem[];
  members: ModMember[];
  issues_url?: string | null;
  source_url?: string | null;
  wiki_url?: string | null;
  discord_url?: string | null;
  donation_urls?: { id: string; platform: string; url: string }[];
}

const MOD_DETAILS_CACHE = new Map<string, ModFullDetails>();

export async function fetchModFullDetails(slugOrId: string): Promise<ModFullDetails | null> {
  const cacheKey = slugOrId.toLowerCase();
  if (MOD_DETAILS_CACHE.has(cacheKey)) {
    return MOD_DETAILS_CACHE.get(cacheKey)!;
  }

  try {
    const [projRes, memRes] = await Promise.all([
      fetch(`https://api.modrinth.com/v2/project/${slugOrId}`, {
        headers: { 'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)' },
      }),
      fetch(`https://api.modrinth.com/v2/project/${slugOrId}/members`, {
        headers: { 'User-Agent': 'ELauncher/1.0.0 (contact@elauncher.local)' },
      }).catch(() => null),
    ]);

    if (!projRes.ok) return null;
    const proj = await projRes.json();

    let members: ModMember[] = [];
    if (memRes && memRes.ok) {
      try {
        const memData = await memRes.json();
        members = (memData || []).map((m: any) => ({
          username: m.user?.username || m.username || 'Contributor',
          role: m.role || 'Member',
          avatar: m.user?.avatar_url || null,
        }));
      } catch {}
    }

    const gallery: ModGalleryItem[] = (proj.gallery || []).map((g: any) => ({
      url: g.url,
      title: g.title,
      description: g.description,
      featured: g.featured,
    }));

    const cleanSlug = (proj.slug || '').toLowerCase();
    const resolvedIcon = proj.icon_url || KNOWN_MOD_ICONS[cleanSlug] || generateModBadgeIcon(proj.title || 'Mod', cleanSlug || proj.id);

    const fullDetails: ModFullDetails = {
      id: proj.id,
      slug: proj.slug,
      title: proj.title,
      description: proj.description,
      body: proj.body || '',
      icon_url: resolvedIcon,
      downloads: proj.downloads || 0,
      followers: proj.followers || 0,
      categories: proj.categories || [],
      loaders: proj.loaders || [],
      game_versions: proj.game_versions || [],
      license: proj.license,
      gallery,
      members,
      issues_url: proj.issues_url,
      source_url: proj.source_url,
      wiki_url: proj.wiki_url,
      discord_url: proj.discord_url,
      donation_urls: proj.donation_urls,
    };

    MOD_DETAILS_CACHE.set(cacheKey, fullDetails);
    if (proj.slug) {
      MOD_DETAILS_CACHE.set(proj.slug.toLowerCase(), fullDetails);
    }
    if (proj.id) {
      MOD_DETAILS_CACHE.set(proj.id.toLowerCase(), fullDetails);
    }

    return fullDetails;
  } catch (err) {
    console.error('Failed to fetch mod full details:', err);
    return null;
  }
}

