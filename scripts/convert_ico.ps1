Add-Type -AssemblyName System.Drawing
$icoPath = Join-Path $PSScriptRoot "..\public\loaders\forge_fav.ico"
$pngPath = Join-Path $PSScriptRoot "..\public\loaders\forge.png"
$icon = New-Object System.Drawing.Icon($icoPath)
$bitmap = $icon.ToBitmap()
$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
$icon.Dispose()
Write-Host "Converted successfully to $pngPath"
