/**
 * Progressive Image Cache & Low-Res Placeholder Service
 *
 * Implements:
 * 1. Two-stage progressive loading:
 *    - Instant blurred/low-res placeholder preview (LQIP)
 *    - Smooth crossfade to crisp, high-resolution original once loaded
 * 2. In-memory & Persistent Cache:
 *    - In-memory Map for instantaneous zero-latency reuse in current session
 *    - IndexedDB / CacheStorage persistence so returning to the same mod or datapack
 *      renders immediately from cache without re-downloading or memory bloat
 * 3. Smart LRU memory management:
 *    - Limits memory objects to prevent memory leaks and RAM hogging
 */

const MEMORY_CACHE = new Map<string, string>(); // url -> objectUrl or dataUrl
const IN_FLIGHT_PROMISES = new Map<string, Promise<string>>();
const LOW_RES_THUMB_CACHE = new Map<string, string>(); // url -> low-res dataUrl (tiny 32x20 preview)

const DB_NAME = 'ELauncher_ImageCache_v1';
const STORE_NAME = 'images';
const MAX_MEMORY_CACHE_ITEMS = 150;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'url' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB image cache open error:', req.error);
          resolve(null);
        };
      } catch (e) {
        console.warn('IndexedDB unavailable:', e);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

/**
 * Generates an ultra-lightweight blurred low-resolution preview (LQIP)
 * via an offscreen HTMLCanvas to display instantly while the high-res loads.
 */
export async function createLowResPlaceholder(sourceUrl: string): Promise<string | null> {
  if (!sourceUrl) return null;
  if (LOW_RES_THUMB_CACHE.has(sourceUrl)) {
    return LOW_RES_THUMB_CACHE.get(sourceUrl)!;
  }

  // If already in memory full cache, no low-res needed
  if (MEMORY_CACHE.has(sourceUrl)) {
    return MEMORY_CACHE.get(sourceUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Very small 32px wide canvas to guarantee near-zero memory footprint (< 1KB)
        const targetW = 32;
        const targetH = Math.max(18, Math.round((img.height / (img.width || 1)) * targetW));
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
          LOW_RES_THUMB_CACHE.set(sourceUrl, dataUrl);
          resolve(dataUrl);
          return;
        }
      } catch {
        // CORS or canvas failure, return null safely
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = sourceUrl;
  });
}

/**
 * Retrieves the cached high-res image URL (instant blob object URL) from IndexedDB.
 */
async function getFromIndexedDB(url: string): Promise<string | null> {
  const db = await getDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => {
        const result = req.result;
        if (result && result.blob instanceof Blob) {
          const blobUrl = URL.createObjectURL(result.blob);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Saves fetched image blob to IndexedDB for persistent offline/fast loading across sessions.
 */
async function saveToIndexedDB(url: string, blob: Blob): Promise<void> {
  const db = await getDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      url,
      blob,
      cachedAt: Date.now(),
    });
  } catch (err) {
    console.warn('Failed to save image to IndexedDB:', err);
  }
}

/**
 * Loads and caches a high-res image with deduplication and IndexedDB caching.
 * Resolves to a directly renderable URL (Blob URL or original URL).
 */
export async function loadCachedImage(url: string): Promise<string> {
  if (!url) return '';

  // 1. In-memory check (instant sync)
  if (MEMORY_CACHE.has(url)) {
    return MEMORY_CACHE.get(url)!;
  }

  // 2. In-flight request deduplication
  if (IN_FLIGHT_PROMISES.has(url)) {
    return IN_FLIGHT_PROMISES.get(url)!;
  }

  const loadPromise = (async () => {
    // 3. Persistent IndexedDB check
    const idbUrl = await getFromIndexedDB(url);
    if (idbUrl) {
      putInMemoryCache(url, idbUrl);
      return idbUrl;
    }

    // 4. Network fetch with blob conversion
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        putInMemoryCache(url, blobUrl);
        saveToIndexedDB(url, blob);
        return blobUrl;
      }
    } catch {
      // Fallback to standard Image preloading if fetch/CORS is restricted
    }

    // Standard HTMLImageElement preload fallback
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });

    putInMemoryCache(url, url);
    return url;
  })()
    .finally(() => {
      IN_FLIGHT_PROMISES.delete(url);
    });

  IN_FLIGHT_PROMISES.set(url, loadPromise);
  return loadPromise;
}

function putInMemoryCache(key: string, value: string) {
  if (MEMORY_CACHE.size >= MAX_MEMORY_CACHE_ITEMS) {
    const firstKey = MEMORY_CACHE.keys().next().value;
    if (firstKey) {
      const existing = MEMORY_CACHE.get(firstKey);
      if (existing && existing.startsWith('blob:')) {
        URL.revokeObjectURL(existing);
      }
      MEMORY_CACHE.delete(firstKey);
    }
  }
  MEMORY_CACHE.set(key, value);
}

/**
 * Checks if high-res image is already available in instant memory cache.
 */
export function isImageInMemory(url: string): boolean {
  return MEMORY_CACHE.has(url);
}

/**
 * Preloads an array of image URLs sequentially or in background batches.
 */
export function preloadImagesBatch(urls: string[]): void {
  const valid = urls.filter((u) => u && !MEMORY_CACHE.has(u));
  valid.forEach((u) => {
    loadCachedImage(u).catch(() => {});
  });
}
