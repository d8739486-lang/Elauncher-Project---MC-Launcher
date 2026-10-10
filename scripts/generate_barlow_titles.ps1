Add-Type -AssemblyName System.Drawing

$fontPath = "C:\Users\zshaf\OneDrive\Desktop\Projects\Eternal Launcher\mod_assets\BarlowCondensed-Black.ttf"
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
$pfc.AddFontFile($fontPath)
$family = $pfc.Families[0]
Write-Host "Loaded font:" $family.Name

function Create-BarlowTitle {
    param (
        [string]$prefixText = "",
        [string]$mainText = "LAUNCHER PROJECT",
        [string]$suffixText = "",
        [int]$width = 512,
        [int]$height = 128,
        [string]$outputPath,
        [float]$fontSize = 82.0,
        [float]$shear = -0.20,
        [float]$eScale = 1.05
    )

    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $font = New-Object System.Drawing.Font($family, $fontSize, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = [System.Drawing.Brushes]::White

    $eImgPath = "C:\Users\zshaf\OneDrive\Desktop\Projects\Eternal Launcher\public\letter_e_tight.png"
    $eBmp = [System.Drawing.Image]::FromFile($eImgPath)

    # In Barlow Condensed Bold, the cap height is roughly fontSize * 0.95
    $targetEH = [int]($fontSize * 0.96 * $eScale)
    $targetEW = [int]($eBmp.Width * ($targetEH / $eBmp.Height))

    # Measure text strings
    $fullText = $mainText
    if ($suffixText) { $fullText += " " + $suffixText }
    $textMeasure = $g.MeasureString($fullText, $font)

    $spacing = 6
    $totalContentW = $targetEW + $spacing + $textMeasure.Width
    $startX = [int](($width - $totalContentW) / 2)
    # Align vertically in 128 px height
    $startY = [int](($height - $targetEH) / 2)

    # Matrix for slant
    $matrix = New-Object System.Drawing.Drawing2D.Matrix
    # Center origin shear
    $matrix.Translate([float]($width / 2), [float]($height / 2))
    $matrix.Shear($shear, 0)
    $matrix.Translate([float](-$width / 2), [float](-$height / 2))
    $g.Transform = $matrix

    # Draw E
    $g.DrawImage($eBmp, $startX, $startY, $targetEW, $targetEH)

    # Draw Text
    $textX = $startX + $targetEW + $spacing
    # Font baseline fine-tune
    $textY = $startY - [int]($fontSize * 0.12)
    $g.DrawString($fullText, $font, $whiteBrush, [float]$textX, [float]$textY)

    $g.Dispose()
    $eBmp.Dispose()
    $font.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $outputPath"
}

$dir = "C:\Users\zshaf\OneDrive\Desktop\Projects\Eternal Launcher\mod_assets\textures\gui"

# 1. title_elauncher_project.png (512x128)
# text is 'LAUNCHER PROJECT'
Create-BarlowTitle -mainText "LAUNCHER PROJECT" -width 512 -height 128 -outputPath (Join-Path $dir "title_elauncher_project.png") -fontSize 48.0 -shear -0.19

# 2. title_banner_elauncher_project.png (1024x128)
Create-BarlowTitle -mainText "LAUNCHER PROJECT" -width 1024 -height 128 -outputPath (Join-Path $dir "title_banner_elauncher_project.png") -fontSize 82.0 -shear -0.20

# 3. title_elauncher_project_minecraft.png (1024x128)
Create-BarlowTitle -mainText "LAUNCHER PROJECT" -suffixText "MINECRAFT" -width 1024 -height 128 -outputPath (Join-Path $dir "title_elauncher_project_minecraft.png") -fontSize 62.0 -shear -0.20

# 4. title_elauncher.png (512x128)
Create-BarlowTitle -mainText "LAUNCHER" -width 512 -height 128 -outputPath (Join-Path $dir "title_elauncher.png") -fontSize 80.0 -shear -0.20

$pfc.Dispose()
