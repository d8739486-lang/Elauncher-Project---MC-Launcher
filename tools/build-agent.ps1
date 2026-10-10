$javaBin = "C:\Users\zshaf\AppData\Roaming\ELauncher\runtimes\java-21\jdk-21.0.12.1+1\bin"
$javac = "$javaBin\javac.exe"
$jar = "$javaBin\jar.exe"

$cp = (
  "tools\agent\lib\relocated-asm.jar;" +
  "tools\agent\lib\lwjgl-3.3.3.jar;" +
  "tools\agent\lib\lwjgl-opengl-3.3.3.jar;" +
  "tools\agent\lib\lwjgl-glfw-3.3.3.jar"
)

# Clean classes directory to avoid leftover classes
if (Test-Path "tools\agent\classes") {
  Remove-Item -Recurse -Force "tools\agent\classes"
}
New-Item -ItemType Directory -Force -Path "tools\agent\classes" | Out-Null

Write-Host "Compiling Java files..."
& $javac -cp $cp -d "tools\agent\classes" "tools\agent\src\com\eternal\launcher\agent\ShaderRenderer.java" "tools\agent\src\com\eternal\launcher\agent\BackgroundAgent.java"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Compilation failed!"
  exit $LASTEXITCODE
}

Write-Host "Compilation successful. Unpacking relocated ASM..."

# Unpack relocated-asm into classes directory so agent is self-contained with zero external dependencies
Set-Location "tools\agent\classes"
& $jar -xf "..\..\..\tools\agent\lib\relocated-asm.jar"
Remove-Item -Recurse -Force "META-INF" -ErrorAction SilentlyContinue
Remove-Item -Force "module-info.class" -ErrorAction SilentlyContinue
Set-Location "..\..\.."

# Write MANIFEST.MF
$manifestContent = @"
Manifest-Version: 1.0
Premain-Class: com.eternal.launcher.agent.BackgroundAgent
Boot-Class-Path: elauncher-bg.jar
Can-Redefine-Classes: true
Can-Retransform-Classes: true

"@
[System.IO.File]::WriteAllText("tools\agent\MANIFEST.MF", $manifestContent)

& $jar -cfm "tools\elauncher-bg.jar" "tools\agent\MANIFEST.MF" -C "tools\agent\classes" .

Write-Host "Agent JAR built at tools\elauncher-bg.jar"
