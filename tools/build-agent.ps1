$javaBin = "C:\Users\zshaf\AppData\Roaming\ELauncher\runtimes\java-21\jdk-21.0.12.1+1\bin"
$javac = "$javaBin\javac.exe"
$jar = "$javaBin\jar.exe"

$cp = (
  "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\ow2\asm\asm\9.10.1\asm-9.10.1.jar;" +
  "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\ow2\asm\asm-commons\9.10.1\asm-commons-9.10.1.jar;" +
  "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\ow2\asm\asm-tree\9.10.1\asm-tree-9.10.1.jar;" +
  "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\lwjgl\lwjgl\3.3.3\lwjgl-3.3.3.jar;" +
  "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\lwjgl\lwjgl-opengl\3.3.3\lwjgl-opengl-3.3.3.jar;" +
  "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\lwjgl\lwjgl-glfw\3.3.3\lwjgl-glfw-3.3.3.jar"
)

Write-Host "Compiling Java files..."
& $javac -cp $cp -d "tools\agent\classes" "tools\agent\src\com\eternal\launcher\agent\ShaderRenderer.java" "tools\agent\src\com\eternal\launcher\agent\BackgroundAgent.java"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Compilation failed!"
  exit $LASTEXITCODE
}

Write-Host "Compilation successful. Creating JAR..."

# Unpack ASM into classes so the agent is completely self-contained!
Set-Location "tools\agent\classes"
& $jar -xf "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\ow2\asm\asm\9.10.1\asm-9.10.1.jar"
& $jar -xf "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\ow2\asm\asm-commons\9.10.1\asm-commons-9.10.1.jar"
& $jar -xf "C:\Users\zshaf\AppData\Roaming\.minecraft\libraries\org\ow2\asm\asm-tree\9.10.1\asm-tree-9.10.1.jar"
Remove-Item -Recurse -Force "META-INF" -ErrorAction SilentlyContinue
Set-Location "..\..\.."

# Write MANIFEST.MF
$manifestContent = @"
Manifest-Version: 1.0
Premain-Class: com.eternal.launcher.agent.BackgroundAgent
Can-Redefine-Classes: true
Can-Retransform-Classes: true

"@
[System.IO.File]::WriteAllText("tools\agent\MANIFEST.MF", $manifestContent)

& $jar -cfm "tools\elauncher-bg.jar" "tools\agent\MANIFEST.MF" -C "tools\agent\classes" .

Write-Host "Agent JAR built at tools\elauncher-bg.jar"
