Add-Type -AssemblyName System.Drawing

$icoPath = Join-Path $PSScriptRoot "..\public\loaders\forge_fav.ico"
$icon = New-Object System.Drawing.Icon($icoPath, 48, 48)
$bitmap = $icon.ToBitmap()

# Make background color (#1e2f47 / dark blue) transparent if desired or save crisp PNG
$targetPath = Join-Path $PSScriptRoot "..\public\loaders\forge.png"
$bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)

$bitmap.Dispose()
$icon.Dispose()
Write-Host "Saved 48x48 icon to $targetPath"
