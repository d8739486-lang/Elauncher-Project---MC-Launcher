---
name: minecraft-javaagent-hacks
description: Comprehensive workflow and architecture for modifying, injecting, and controlling Minecraft (all versions, Vanilla/Fabric/Forge/NeoForge) using JavaAgent (-javaagent), ASM bytecode manipulation, LWJGL/OpenGL hooks, and runtime class transforms without writing client mods. Trigger whenever the user mentions JavaAgent, javaagent, injecting bytecode, ASM transformers, OpenGL hooks in Minecraft, or asks to implement in-game features from a single .md spec.
---

# Minecraft JavaAgent & Bytecode Hook System

This skill explains how the JavaAgent system works in Minecraft, how to inject bytecode, hook OpenGL/GLFW, and build features across all versions without compiling version-specific mods.

## 1. Core Architecture: How JavaAgent Works in Minecraft

A JavaAgent is an official JVM mechanism (`java.lang.instrument.Instrumentation`) passed via `-javaagent:<jar-path>[=<args>]`.

1. **Premain execution:** The agent runs BEFORE `net.minecraft.client.main.Main` loads any Minecraft class.
2. **Bytecode interception (`ClassFileTransformer`):** Every `.class` file loaded by any ClassLoader (including Fabric Knot or Forge ClassLoader) passes through `transform()`.
3. **Zero mod dependency:** The agent works on 100% Vanilla, Fabric, Forge, NeoForge, and Snapshots because it sits at the JVM runtime layer.
4. **No NBT/registry breakage:** It modifies bytecode at load-time (rendering, GLFW callbacks, hooks) without depending on game registry classes.

---

## 2. Directory Layout in This Project

In this repository, the agent is housed in:
```text
tools/
├── agent/
│   ├── src/com/eternal/launcher/agent/
│   │   ├── BackgroundAgent.java   # Premain + ClassFileTransformer
│   │   └── ShaderRenderer.java     # LWJGL 3 OpenGL shader / rendering engine
│   ├── lib/
│   │   ├── relocated-asm.jar       # Shaded ASM 9.x (org.objectweb.asm)
│   │   ├── lwjgl-3.3.3.jar
│   │   ├── lwjgl-opengl-3.3.3.jar
│   │   └── lwjgl-glfw-3.3.3.jar
│   ├── classes/                   # Compiled .class files
│   └── MANIFEST.MF                # Premain-Class & Boot-Class-Path
├── build-agent.ps1                # 1-click build script to create tools/elauncher-bg.jar
└── elauncher-bg.jar               # Final fat JAR with embedded ASM
```

---

## 3. How to Build & Deploy the JavaAgent

To rebuild the agent after changing Java files:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-agent.ps1
```
The script compiles `BackgroundAgent.java` and `ShaderRenderer.java`, unpacks `relocated-asm.jar` into the classes directory, writes `MANIFEST.MF`, and produces a self-contained `tools\elauncher-bg.jar`.

To copy it to the launcher runtime:
```powershell
Copy-Item "tools\elauncher-bg.jar" "C:\Users\zshaf\AppData\Roaming\ELauncher\tools\elauncher-bg.jar" -Force
```

---

## 4. Hook Patterns & Recipes

### A. Screen / Background Hook (ASM Method Entry)
In Minecraft 1.21+, the main title panorama is rendered by `hor.class` (Vanilla) or `net/minecraft/class_766` (Fabric Intermediary) via `render(gir, int, int, boolean)`:
```java
if (className.equals("hor") || className.equals("net/minecraft/class_766")) {
    // Transform render method:
    // Insert call to ShaderRenderer.renderBackground(width, height)
    // If it returns true, insert RETURN opcode to skip vanilla panorama
}
```

### B. Calling Agent Classes from Game ClassLoaders
To avoid `ClassNotFoundException` between the System ClassLoader and Minecraft's Knot/Module ClassLoader, use Reflection or register in `Boot-Class-Path`:
```java
Class<?> clazz = Class.forName("com.eternal.launcher.agent.ShaderRenderer");
Method m = clazz.getMethod("renderBackground", int.class, int.class);
boolean handled = (Boolean) m.invoke(null, width, height);
if (handled) return;
```

### C. OpenGL / Shaders with LWJGL 3
Minecraft initializes OpenGL before rendering screens. The agent can compile shaders and draw quads directly:
- `GL20.glCreateShader`, `GL20.glShaderSource`, `GL20.glCompileShader`
- `GL20.glUseProgram`, `GL20.glUniform1f`
- Fullscreen Quad rendering with VAO / VBO
- Alpha blending with `GL11.glEnable(GL11.GL_BLEND)`

---

## 5. Rapid Feature Execution Protocol (When User Gives a .md Spec)

When the user provides an instruction or a `.md` specification:
1. **Locate Target Hook:** Determine if the feature is rendering (OpenGL/LWJGL), input (GLFW callback), or logic (bytecode injection).
2. **Update/Create Java Class in `tools/agent/src/...`**: Add the feature implementation.
3. **Register in `BackgroundAgent.java`**: Hook the corresponding obfuscated/intermediary Minecraft class.
4. **Rebuild via `build-agent.ps1`**: Run PowerShell build script.
5. **Verify JVM Argument in `minecraftEngine.js`**: Ensure `-javaagent:${bgAgentPath}` is appended to `jvmArgs`.
6. **Launch & Test**: Run and monitor logs in console.
