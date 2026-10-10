Add-Type -AssemblyName System.Drawing
[System.Drawing.FontFamily]::Families | ForEach-Object {
    if ($_.Name -match "sans|arial|impact|agency|bebas|dela|futura|oswald|gothic|din|eurostile|bank|bahnschrift|franklin|trebuchet") {
        Write-Host $_.Name
    }
}
