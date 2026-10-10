Add-Type -AssemblyName System.Drawing

$icoPath = Join-Path $PSScriptRoot "..\public\loaders\forge_fav.ico"
$icon = New-Object System.Drawing.Icon($icoPath, 48, 48)
$orig = $icon.ToBitmap()

$w = $orig.Width
$h = $orig.Height
$transBmp = New-Object System.Drawing.Bitmap($w, $h)

# Sample background color from corner (0,0)
$bg = $orig.GetPixel(0, 0)

for ($x = 0; $x -lt $w; $x++) {
    for ($y = 0; $y -lt $h; $y++) {
        $c = $orig.GetPixel($x, $y)
        # Calculate distance to background color
        $dr = [Math]::Abs($c.R - $bg.R)
        $dg = [Math]::Abs($c.G - $bg.G)
        $db = [Math]::Abs($c.B - $bg.B)
        
        if ($dr -lt 18 -and $dg -lt 18 -and $db -lt 18) {
            # Transparent background
            $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Keep original pixel
            $transBmp.SetPixel($x, $y, $c)
        }
    }
}

$targetPath = Join-Path $PSScriptRoot "..\public\loaders\forge.png"
$transBmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

$transBmp.Dispose()
$orig.Dispose()
$icon.Dispose()
Write-Host "Saved transparent forge.png to $targetPath"
