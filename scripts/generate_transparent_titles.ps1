Add-Type -AssemblyName System.Drawing

function Create-TransparentTitle {
    param (
        [string]$text,
        [int]$width,
        [int]$height,
        [string]$outputPath,
        [bool]$includeSlashE = $true,
        [float]$fontSize = 62.0,
        [float]$shear = -0.21
    )

    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0)) # Full transparent background
    
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Font: Arial Black or Impact
    $fontFamily = New-Object System.Drawing.FontFamily("Arial Black")
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = [System.Drawing.Brushes]::White

    $eImgPath = Join-Path $PSScriptRoot "..\public\letter_e_tight.png"
    $hasE = $includeSlashE -and (Test-Path $eImgPath)

    $eWidth = 0
    $eHeight = 0
    $eBmp = $null

    if ($hasE) {
        $eBmp = [System.Drawing.Image]::FromFile($eImgPath)
        # Match font height
        $targetEH = [int]($fontSize * 1.30)
        $targetEW = [int]($eBmp.Width * ($targetEH / $eBmp.Height))
        $eWidth = $targetEW
        $eHeight = $targetEH
    }

    $textSize = $g.MeasureString($text, $font)
    $spacing = 8
    
    $extraWidth = 0
    if ($hasE) {
        $extraWidth = $eWidth + $spacing
    }
    $totalWidth = $textSize.Width + $extraWidth

    $startX = [int](($width - $totalWidth) / 2)
    $startY = [int](($height - ($fontSize * 1.35)) / 2)

    # Shear transformation with proper origin offset
    $matrix = New-Object System.Drawing.Drawing2D.Matrix
    # When shearing x by shear*y, points with large y shift left when shear < 0.
    # We apply shear relative to middle height to avoid left drift clipping:
    $matrix.Translate([float]($width / 2), [float]($height / 2))
    $matrix.Shear($shear, 0)
    $matrix.Translate([float](-$width / 2), [float](-$height / 2))
    $g.Transform = $matrix

    $drawX = $startX

    if ($hasE) {
        $g.DrawImage($eBmp, $drawX, $startY, $eWidth, $eHeight)
        $drawX += $eWidth + $spacing
    }

    $g.DrawString($text, $font, $whiteBrush, [float]$drawX, [float]($startY - 2))

    $g.Dispose()
    if ($eBmp) { $eBmp.Dispose() }
    $font.Dispose()
    $fontFamily.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated transparent texture: $outputPath ($width x $height)"
}

$dir = Join-Path $PSScriptRoot "..\mod_assets\textures\gui"

# 1. title_elauncher_project.png (512x128) - Direct replacement copy for title_eternal.png
Create-TransparentTitle -text "LAUNCHER PROJECT" -width 512 -height 128 -outputPath (Join-Path $dir "title_elauncher_project.png") -includeSlashE $true -fontSize 31.0 -shear -0.21

# 2. title_banner_elauncher_project.png (1024x128) - Direct replacement copy for title_banner.png
Create-TransparentTitle -text "LAUNCHER PROJECT" -width 1024 -height 128 -outputPath (Join-Path $dir "title_banner_elauncher_project.png") -includeSlashE $true -fontSize 55.0 -shear -0.21

# 3. title_elauncher_project_minecraft.png (1024x128) - Direct replacement copy for title_eternal_minecraft.png
Create-TransparentTitle -text "LAUNCHER PROJECT MINECRAFT" -width 1024 -height 128 -outputPath (Join-Path $dir "title_elauncher_project_minecraft.png") -includeSlashE $true -fontSize 36.0 -shear -0.21

# 4. title_elauncher.png (512x128) - Short ELAUNCHER version
Create-TransparentTitle -text "LAUNCHER" -width 512 -height 128 -outputPath (Join-Path $dir "title_elauncher.png") -includeSlashE $true -fontSize 46.0 -shear -0.21
