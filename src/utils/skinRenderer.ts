/**
 * Minecraft skin parser, validator, and canvas renderer (Head avatar + Full body front preview)
 */

export interface SkinValidationResult {
  isValid: boolean;
  error?: string;
  dataUrl?: string;
  width?: number;
  height?: number;
  isLegacy?: boolean; // 64x32 legacy skin format
}

/**
 * Validates an uploaded skin PNG file
 */
export async function validateSkinFile(file: File): Promise<SkinValidationResult> {
  if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
    return { isValid: false, error: 'Скин должен быть файлом в формате .PNG' };
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      if ((w === 64 && h === 64) || (w === 64 && h === 32)) {
        resolve({
          isValid: true,
          dataUrl,
          width: w,
          height: h,
          isLegacy: h === 32,
        });
      } else if (w === 128 && h === 128) {
        // High-definition HD skin
        resolve({
          isValid: true,
          dataUrl,
          width: w,
          height: h,
          isLegacy: false,
        });
      } else {
        resolve({
          isValid: false,
          error: `Неверное разрешение (${w}x${h}). Поддерживаются только скины 64x64 или 64x32.`,
        });
      }
    };
    img.onerror = () => {
      resolve({ isValid: false, error: 'Не удалось прочитать изображение скина' });
    };
    img.src = dataUrl;
  });
}

/**
 * Ensures any skin image source (URL or data URL) is converted to a base64 Data URL
 * to strictly prevent CORS errors, image load failures, or canvas tainting.
 */
export async function ensureSkinDataUrl(source: string): Promise<string> {
  if (!source || source.startsWith('data:')) return source;

  // 1. If IPC is available in Electron
  if (typeof window !== 'undefined' && window.electronAPI?.fetchElyBySkin) {
    if (source.includes('ely.by/skins/')) {
      const match = source.match(/\/skins\/([^/.]+)/);
      if (match && match[1]) {
        try {
          const res = await window.electronAPI.fetchElyBySkin(decodeURIComponent(match[1]));
          if (res && res.startsWith('data:image')) return res;
        } catch {}
      }
    }
  }

  // 2. Localhost Vite proxy rewrite for Ely.by skins
  let fetchUrl = source;
  if (
    typeof window !== 'undefined' &&
    (window.location?.origin?.includes('localhost') || window.location?.origin?.includes('127.0.0.1')) &&
    fetchUrl.includes('skinsystem.ely.by')
  ) {
    fetchUrl = fetchUrl.replace('https://skinsystem.ely.by', `${window.location.origin}/api/elyby-skins`);
  }

  try {
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const blob = await res.blob();
      if (blob.size > 50) {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(source);
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch {}

  return source;
}

/**
 * Checks if a given avatar URL matches the default Steve face or is empty
 */
export function isDefaultSteveAvatar(avatarUrl?: string | null): boolean {
  if (!avatarUrl || avatarUrl.length < 50) return true;
  // A true 3D isometric avatar or custom skin avatar has distinct pixel patterns
  return avatarUrl === defaultSteveCached;
}

let defaultSteveCached: string | null = null;

/**
 * Renders an isometric 3D Minecraft head cube (with outer 3D hat layer & shading)
 */
export async function render3DIsometricHead(skinSource: string, size = 64): Promise<string> {
  const safeSource = await ensureSkinDataUrl(skinSource);

  return new Promise((resolve) => {
    const img = new Image();
    if (!safeSource.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const s = img.naturalWidth / 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.imageSmoothingEnabled = false;

        // Draw source to memory canvas to inspect pixels
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.naturalWidth;
        srcCanvas.height = img.naturalHeight;
        const srcCtx = srcCanvas.getContext('2d');
        if (!srcCtx) {
          resolve('');
          return;
        }
        srcCtx.drawImage(img, 0, 0);
        const imgData = srcCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;

        const getPixel = (x: number, y: number): [number, number, number, number] => {
          const px = Math.floor(x * s);
          const py = Math.floor(y * s);
          if (px < 0 || px >= img.naturalWidth || py < 0 || py >= img.naturalHeight) {
            return [0, 0, 0, 0];
          }
          const idx = (py * img.naturalWidth + px) * 4;
          return [imgData[idx], imgData[idx + 1], imgData[idx + 2], imgData[idx + 3]];
        };

        // Perfectly centered isometric projection coordinates inside `size`x`size` canvas
        const cx = size / 2;
        const cy = size * 0.18;
        const scale = size / 23;

        // 1. Top face (y = 0..7, x = 0..7)
        for (let x = 0; x < 8; x++) {
          for (let y = 0; y < 8; y++) {
            let [r, g, b, a] = getPixel(8 + x, y);
            const [hr, hg, hb, ha] = getPixel(40 + x, y);
            if (ha > 20) {
              const alpha = ha / 255;
              r = Math.round(hr * alpha + r * (1 - alpha));
              g = Math.round(hg * alpha + g * (1 - alpha));
              b = Math.round(hb * alpha + b * (1 - alpha));
              a = 255;
            }
            if (a > 20) {
              // Top lighting +15%
              r = Math.min(255, Math.round(r * 1.15));
              g = Math.min(255, Math.round(g * 1.15));
              b = Math.min(255, Math.round(b * 1.15));

              const isoX = cx + (x - y) * scale * 0.866;
              const isoY = cy + (x + y) * scale * 0.5;

              ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
              ctx.beginPath();
              ctx.moveTo(isoX, isoY);
              ctx.lineTo(isoX + scale * 0.866, isoY + scale * 0.5);
              ctx.lineTo(isoX, isoY + scale);
              ctx.lineTo(isoX - scale * 0.866, isoY + scale * 0.5);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // 2. Front face (Лицо) (x = 0..7, z = 0..7)
        for (let x = 0; x < 8; x++) {
          for (let z = 0; z < 8; z++) {
            let [r, g, b, a] = getPixel(8 + x, 8 + z);
            const [hr, hg, hb, ha] = getPixel(40 + x, 8 + z);
            if (ha > 20) {
              const alpha = ha / 255;
              r = Math.round(hr * alpha + r * (1 - alpha));
              g = Math.round(hg * alpha + g * (1 - alpha));
              b = Math.round(hb * alpha + b * (1 - alpha));
              a = 255;
            }
            if (a > 20) {
              const isoX = cx + (x - 7) * scale * 0.866;
              const isoY = cy + (x + 7) * scale * 0.5 + z * scale;

              ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
              ctx.beginPath();
              ctx.moveTo(isoX, isoY);
              ctx.lineTo(isoX + scale * 0.866, isoY + scale * 0.5);
              ctx.lineTo(isoX + scale * 0.866, isoY + scale * 0.5 + scale);
              ctx.lineTo(isoX, isoY + scale);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        // 3. Right face (Боковина) (y = 0..7, z = 0..7)
        for (let y = 0; y < 8; y++) {
          for (let z = 0; z < 8; z++) {
            let [r, g, b, a] = getPixel(y, 8 + z);
            const [hr, hg, hb, ha] = getPixel(32 + y, 8 + z);
            if (ha > 20) {
              const alpha = ha / 255;
              r = Math.round(hr * alpha + r * (1 - alpha));
              g = Math.round(hg * alpha + g * (1 - alpha));
              b = Math.round(hb * alpha + b * (1 - alpha));
              a = 255;
            }
            if (a > 20) {
              // Right side shading 0.78x
              r = Math.round(r * 0.78);
              g = Math.round(g * 0.78);
              b = Math.round(b * 0.78);

              const isoX = cx + (7 - y) * scale * 0.866;
              const isoY = cy + (7 + y) * scale * 0.5 + z * scale;

              ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
              ctx.beginPath();
              ctx.moveTo(isoX, isoY);
              ctx.lineTo(isoX - scale * 0.866, isoY + scale * 0.5);
              ctx.lineTo(isoX - scale * 0.866, isoY + scale * 0.5 + scale);
              ctx.lineTo(isoX, isoY + scale);
              ctx.closePath();
              ctx.fill();
            }
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('render3DIsometricHead error, falling back:', err);
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = safeSource;
  });
}

/**
 * Extract 2D head avatar (with outer 3D hat overlay) from skin Data URL or URL
 */
export async function extract2DHeadAvatar(skinSource: string, size = 64): Promise<string> {
  const safeSource = await ensureSkinDataUrl(skinSource);

  return new Promise((resolve) => {
    const img = new Image();
    if (!safeSource.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        ctx.imageSmoothingEnabled = false;

        const s = img.naturalWidth / 64;

        // 1. Base head layer: src (8*s, 8*s, 8*s, 8*s)
        ctx.drawImage(img, 8 * s, 8 * s, 8 * s, 8 * s, 0, 0, size, size);

        // 2. Outer hat/helmet 3D layer: src (40*s, 8*s, 8*s, 8*s)
        ctx.drawImage(img, 40 * s, 8 * s, 8 * s, 8 * s, 0, 0, size, size);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve('');
      }
    };
    img.onerror = () => {
      resolve('');
    };
    img.src = safeSource;
  });
}

/**
 * Extract head avatar from skin Data URL or URL:
 * Clean 2D Minecraft face with outer hat/helmet layer filling the entire frame edge-to-edge.
 */
export async function extractSkinAvatar(skinSource: string, size = 64): Promise<string> {
  return extract2DHeadAvatar(skinSource, size);
}

/**
 * Renders Minecraft character full-body front view on a target canvas
 */
export async function renderFullBodySkin(
  canvas: HTMLCanvasElement,
  skinSource: string,
  model: 'classic' | 'slim' = 'classic'
): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;

      const scaleUnit = img.naturalWidth / 64;
      const isLegacy = img.naturalHeight === 32 * scaleUnit;
      const armWidth = model === 'slim' ? 3 : 4;

      // In Minecraft, total front width is (armWidth + 8 + armWidth) = 16 (or 14 for slim)
      // Total height is 32 (Head 8, Body 12, Legs 12)
      const totalCharWidth = 8 + armWidth * 2;
      const totalCharHeight = 32;

      // Calculate pixel scaling factor to fit canvas with margin
      const padding = 16;
      const pixelScale = Math.floor(Math.min((cw - padding * 2) / totalCharWidth, (ch - padding * 2) / totalCharHeight));

      const renderW = totalCharWidth * pixelScale;
      const renderH = totalCharHeight * pixelScale;
      const startX = Math.round((cw - renderW) / 2);
      const startY = Math.round((ch - renderH) / 2);

      const px = (val: number) => val * pixelScale;
      const s = (val: number) => val * scaleUnit;

      // Coordinate anchors
      const headX = startX + px(armWidth);
      const headY = startY;
      const bodyX = headX;
      const bodyY = headY + px(8);
      const rightArmX = startX;
      const rightArmY = bodyY;
      const leftArmX = bodyX + px(8);
      const leftArmY = bodyY;
      const rightLegX = bodyX;
      const rightLegY = bodyY + px(12);
      const leftLegX = bodyX + px(4);
      const leftLegY = bodyY + px(12);

      // --- 1. HEAD ---
      // Base: (8, 8, 8, 8)
      ctx.drawImage(img, s(8), s(8), s(8), s(8), headX, headY, px(8), px(8));
      // Hat overlay: (40, 8, 8, 8)
      ctx.drawImage(img, s(40), s(8), s(8), s(8), headX - px(0.5), headY - px(0.5), px(9), px(9));

      // --- 2. TORSO / BODY ---
      // Base: (20, 20, 8, 12)
      ctx.drawImage(img, s(20), s(20), s(8), s(12), bodyX, bodyY, px(8), px(12));
      // Jacket overlay: (20, 36, 8, 12) on modern skins
      if (!isLegacy) {
        ctx.drawImage(img, s(20), s(36), s(8), s(12), bodyX, bodyY, px(8), px(12));
      }

      // --- 3. RIGHT ARM ---
      // Base: (44, 20, armWidth, 12)
      ctx.drawImage(img, s(44), s(20), s(armWidth), s(12), rightArmX, rightArmY, px(armWidth), px(12));
      if (!isLegacy) {
        // Overlay: (44, 36, armWidth, 12)
        ctx.drawImage(img, s(44), s(36), s(armWidth), s(12), rightArmX, rightArmY, px(armWidth), px(12));
      }

      // --- 4. LEFT ARM ---
      if (!isLegacy) {
        // Modern Left Arm: (36, 52, armWidth, 12)
        ctx.drawImage(img, s(36), s(52), s(armWidth), s(12), leftArmX, leftArmY, px(armWidth), px(12));
        // Overlay: (52, 52, armWidth, 12)
        ctx.drawImage(img, s(52), s(52), s(armWidth), s(12), leftArmX, leftArmY, px(armWidth), px(12));
      } else {
        // Legacy: Mirror right arm horizontally
        ctx.save();
        ctx.translate(leftArmX + px(armWidth), leftArmY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, s(44), s(20), s(armWidth), s(12), 0, 0, px(armWidth), px(12));
        ctx.restore();
      }

      // --- 5. RIGHT LEG ---
      // Base: (4, 20, 4, 12)
      ctx.drawImage(img, s(4), s(20), s(4), s(12), rightLegX, rightLegY, px(4), px(12));
      if (!isLegacy) {
        // Pants overlay: (4, 36, 4, 12)
        ctx.drawImage(img, s(4), s(36), s(4), s(12), rightLegX, rightLegY, px(4), px(12));
      }

      // --- 6. LEFT LEG ---
      if (!isLegacy) {
        // Modern Left Leg: (20, 52, 4, 12)
        ctx.drawImage(img, s(20), s(52), s(4), s(12), leftLegX, leftLegY, px(4), px(12));
        // Overlay: (4, 52, 4, 12)
        ctx.drawImage(img, s(4), s(52), s(4), s(12), leftLegX, leftLegY, px(4), px(12));
      } else {
        // Legacy: Mirror right leg
        ctx.save();
        ctx.translate(leftLegX + px(4), leftLegY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, s(4), s(20), s(4), s(12), 0, 0, px(4), px(12));
        ctx.restore();
      }

      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = skinSource;
  });
}

/**
 * Standard Steve default skin generator in base64 if none uploaded
 */
export function getDefaultSteveAvatar(): string {
  // 8x8 Steve face pattern
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = false;
  // Hair & face colors
  ctx.fillStyle = '#261b14'; // Hair
  ctx.fillRect(0, 0, 64, 20);
  ctx.fillStyle = '#b77953'; // Skin
  ctx.fillRect(0, 20, 64, 44);
  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 28, 16, 8);
  ctx.fillRect(40, 28, 16, 8);
  ctx.fillStyle = '#2c358f'; // Blue pupil
  ctx.fillRect(16, 28, 8, 8);
  ctx.fillRect(40, 28, 8, 8);
  // Nose
  ctx.fillStyle = '#9b5b37';
  ctx.fillRect(24, 36, 16, 8);
  // Beard / mouth
  ctx.fillStyle = '#4c2d1b';
  ctx.fillRect(16, 44, 32, 12);
  ctx.fillStyle = '#894f31';
  ctx.fillRect(24, 44, 16, 6);

  return canvas.toDataURL('image/png');
}
