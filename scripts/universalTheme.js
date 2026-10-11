import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

/**
 * Prepares the universal ELauncher Theme assets directory:
 * - 6 panorama cube textures (panorama_0.png .. panorama_5.png) made from menu_background.jpg
 * - Custom Katana logo (minecraft.png) with title_banner_elauncher_project.png
 * - Blank/transparent edition.png (removes "Java Edition" subtext cleanly)
 * - pack.mcmeta with universal supported formats (pack_format 1 to 99)
 *
 * Can be mounted either as a classpath root or as an automatic resourcepack!
 */
export async function setupUniversalThemeAssets({ projectRoot, launcherPath, instancesPath }) {
  const root = projectRoot || process.cwd();
  const themeDir = path.join(launcherPath, 'tools', 'elauncher-theme');
  const titleDir = path.join(themeDir, 'assets', 'minecraft', 'textures', 'gui', 'title');
  const panoramaDir = path.join(titleDir, 'background');

  fs.mkdirSync(panoramaDir, { recursive: true });

  const bgSourcePath = path.join(root, 'menu_background.jpg');
  const bannerSourcePath = path.join(root, 'mod_assets', 'textures', 'gui', 'title_banner_elauncher_project.png');

  if (!fs.existsSync(bgSourcePath) || !fs.existsSync(bannerSourcePath)) {
    console.warn('[THEME] Required assets missing for universal theme setup:', { bgSourcePath, bannerSourcePath });
    return null;
  }

  // Generate 1024x1024 cubic panorama faces from menu_background.jpg
  // and 1024x256 composite title (minecraft.png) + 1x1 transparent edition.png
  const psScript = `
Add-Type -AssemblyName System.Drawing

function Create-PanoramaFace {
    param([string]$SrcPath, [string]$DestPath, [int]$Size)
    $src = [System.Drawing.Image]::FromFile($SrcPath)
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $Size, $Size))
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Create-TitleBanner {
    param([string]$SrcPath, [string]$DestPath)
    $src = [System.Drawing.Image]::FromFile($SrcPath)
    $bmp = New-Object System.Drawing.Bitmap 1024, 256
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    # Draw banner centered in upper half (0, 48, 1024, 128)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 48, 1024, 128))
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Create-BlankPng {
    param([string]$DestPath)
    $bmp = New-Object System.Drawing.Bitmap 1, 1
    $bmp.SetPixel(0, 0, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    $bmp.Save($DestPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$bg = "${bgSourcePath.replace(/\\/g, '\\\\')}"
$panDir = "${panoramaDir.replace(/\\/g, '\\\\')}"
$titDir = "${titleDir.replace(/\\/g, '\\\\')}"
$banner = "${bannerSourcePath.replace(/\\/g, '\\\\')}"

for ($i = 0; $i -lt 6; $i++) {
    $outP = Join-Path $panDir "panorama_$i.png"
    Create-PanoramaFace $bg $outP 1024
}

$titlePng = Join-Path $titDir "minecraft.png"
Create-TitleBanner $banner $titlePng

$editionPng = Join-Path $titDir "edition.png"
Create-BlankPng $editionPng
`;

  const scriptPath = path.join(themeDir, 'build_theme.ps1');
  fs.writeFileSync(scriptPath, psScript, 'utf8');

  await new Promise((resolve, reject) => {
    const child = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
      windowsHide: true,
      stdio: 'ignore',
    });
    child.on('close', (code) => {
      try { fs.unlinkSync(scriptPath); } catch {}
      if (code === 0) resolve();
      else reject(new Error(`PowerShell theme generation failed with code ${code}`));
    });
  });

  // Write universal pack.mcmeta (compatible with all Minecraft formats from 1 to 99)
  const mcmeta = {
    pack: {
      pack_format: 48,
      supported_formats: { min_inclusive: 1, max_inclusive: 99 },
      description: 'ELauncher High-Performance Visual Overhaul',
    },
  };
  fs.writeFileSync(path.join(themeDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2), 'utf8');

  return themeDir;
}

/**
 * Injects ELauncher Theme directly into an instance's options.txt and resourcepacks folder
 * so that Vanilla or any loader loads the theme cleanly as the highest priority resourcepack!
 */
export async function injectUniversalThemeToInstance({ themeDir, instanceDir }) {
  if (!themeDir || !fs.existsSync(themeDir)) return;

  const packsDir = path.join(instanceDir, 'resourcepacks');
  fs.mkdirSync(packsDir, { recursive: true });

  const targetPackFolder = path.join(packsDir, 'ELauncher_Theme');
  // Copy directory structure recursively
  fs.cpSync(themeDir, targetPackFolder, { recursive: true });

  // Update options.txt so "file/ELauncher_Theme" is active at the very top of resourcePacks
  const optionsPath = path.join(instanceDir, 'options.txt');
  let content = fs.existsSync(optionsPath) ? fs.readFileSync(optionsPath, 'utf8') : '';

  const packName = 'file/ELauncher_Theme';
  let lines = content.split(/\r?\n/);
  let found = false;

  lines = lines.map((line) => {
    if (line.startsWith('resourcePacks:')) {
      found = true;
      try {
        const jsonStr = line.substring('resourcePacks:'.length).trim();
        let list = JSON.parse(jsonStr);
        if (Array.isArray(list)) {
          list = list.filter((p) => p !== packName && p !== 'file/ELauncher_Theme.zip');
          list.push(packName); // In Minecraft, items later in resourcePacks array have HIGHER priority!
          return `resourcePacks:${JSON.stringify(list)}`;
        }
      } catch {}
      return `resourcePacks:["vanilla","${packName}"]`;
    }
    return line;
  });

  if (!found) {
    lines.unshift(`resourcePacks:["vanilla","${packName}"]`);
  }

  fs.writeFileSync(optionsPath, lines.join('\n'), 'utf8');
}
