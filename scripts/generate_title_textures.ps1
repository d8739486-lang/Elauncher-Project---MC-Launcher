Add-Type -AssemblyName System.Drawing

function Generate-TitleTexture {
    param (
        [string]$text,
        [int]$width,
        [int]$height,
        [string]$outputPath,
        [bool]$includeSlashE = $true,
        [float]$fontSize = 62.0
    )

    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Black)
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Font setup: Impact or Arial Black with bold italic
    $fontFamily = New-Object System.Drawing.FontFamily("Impact")
    $font = New-Object System.Drawing.Font($fontFamily, $fontSize, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = [System.Drawing.Brushes]::White

    # Measure total width
    $eImgPath = Join-Path $PSScriptRoot "..\public\letter_e_tight.png"
    $hasE = $includeSlashE -and (Test-Path $eImgPath)

    $eWidth = 0
    $eHeight = 0
    $eBmp = $null

    if ($hasE) {
        $eBmp = [System.Drawing.Image]::FromFile($eImgPath)
        # Scale E to match font cap height approx 76px
        $targetEH = [int]($fontSize * 1.35)
        $targetEW = [int]($eBmp.Width * ($targetEH / $eBmp.Height))
        $eWidth = $targetEW
        $eHeight = $targetEH
    }

    $extraWidth = 0
    if ($hasE) {
        $extraWidth = $eWidth + $spacing
    }
    $totalWidth = $textSize.Width + $extraWidth

    $startX = [int](($width - $totalWidth) / 2)
    $startY = [int](($height - $fontSize * 1.3) / 2)

    # Slanted shear matrix for racing italic look (-10 degrees)
    $matrix = New-Object System.Drawing.Drawing2D.Matrix
    $matrix.Shear(-0.22, 0)
    $g.Transform = $matrix

    # Compensate X offset after shear
    $compX = [int]($startY * 0.22)
    $drawX = $startX + $compX

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
    Write-Host "Created: $outputPath ($width x $height)"
}

$dir = Join-Path $PSScriptRoot "..\mod_assets\textures\gui"

# 1. title_elauncher_project.png (512x128) -> E + LAUNCHER PROJECT
Generate-TitleTexture -text "LAUNCHER PROJECT" -width 512 -height 128 -outputPath (Join-Path $dir "title_elauncher_project.png") -includeSlashE $true -fontSize 38.0

# 2. title_banner_elauncher.png (1024x128) -> E + LAUNCHER PROJECT MINECRAFT
Generate-TitleTexture -text "LAUNCHER PROJECT MINECRAFT" -width 1024 -height 128 -outputPath (Join-Path $dir "title_banner_elauncher.png") -includeSlashE $true -fontSize 42.0

# 3. title_elauncher_minecraft.png (1024x128) -> E + LAUNCHER PROJECT
Generate-TitleTexture -text "LAUNCHER PROJECT" -width 1024 -height 128 -outputPath (Join-Path $dir "title_elauncher_minecraft.png") -includeSlashE $true -fontSize 56.0

# 4. title_elauncher_pure.png (512x128) -> E + LAUNCHER
Generate-TitleTexture -text "LAUNCHER" -width 512 -height 128 -outputPath (Join-Path $dir "title_elauncher.png") -includeSlashE $true -fontSize 58.0
