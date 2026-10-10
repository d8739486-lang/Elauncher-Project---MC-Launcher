Add-Type -AssemblyName System.Drawing

function Measure-OpaqueBounds([string]$filePath) {
    $bmp = [System.Drawing.Bitmap]::FromFile($filePath)
    $minX = 99999
    $maxX = -1
    $minY = 99999
    $maxY = -1

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $bmp.Dispose()

    [PSCustomObject]@{
        Path = [System.IO.Path]::GetFileName($filePath)
        MinX = $minX
        MaxX = $maxX
        MinY = $minY
        MaxY = $maxY
        Width = ($maxX - $minX + 1)
        Height = ($maxY - $minY + 1)
    }
}

$dir = Join-Path $PSScriptRoot "..\mod_assets\textures\gui"
Measure-OpaqueBounds (Join-Path $dir "title_eternal.png") | Format-Table -AutoSize
Measure-OpaqueBounds (Join-Path $dir "title_elauncher_project.png") | Format-Table -AutoSize
Measure-OpaqueBounds (Join-Path $dir "title_banner.png") | Format-Table -AutoSize
Measure-OpaqueBounds (Join-Path $dir "title_banner_elauncher_project.png") | Format-Table -AutoSize
