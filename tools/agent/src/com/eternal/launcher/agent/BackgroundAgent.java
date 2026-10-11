package com.eternal.launcher.agent;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import com.eternal.bgasm.*;

/**
 * ELauncher JavaAgent — Universal Minecraft Main Menu Bridge & Injector
 *
 * Intercepts TitleScreen to track active status, suppress vanilla UI,
 * and execute custom menu actions on Minecraft's render thread.
 * Starts AgentServer to bridge state with Electron Web Overlay.
 */
public class BackgroundAgent {

    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("[ELauncher Agent] ========================================");
        System.out.println("[ELauncher Agent] ELauncher Web Overlay Bridge Agent v4.0");
        System.out.println("[ELauncher Agent] Zero Mod Dependency / Universal Engine");
        System.out.println("[ELauncher Agent] ========================================");

        // Start lightweight local IPC server
        try {
            AgentServer.start();
        } catch (Throwable t) {
            System.err.println("[ELauncher Agent] Failed to start AgentServer: " + t);
        }

        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined,
                                    ProtectionDomain protectionDomain, byte[] classfileBuffer) {
                if (className == null || classfileBuffer == null) return null;

                // ── 1. RENDER SYSTEM FLIP FRAME HOOK ────────────────────────────────────
                // RenderSystem is never obfuscated by Mojang.
                // We hook flipFrame to update GLFW window metrics on Minecraft's render thread.
                if (className.equals("com/mojang/blaze3d/systems/RenderSystem")) {
                    try {
                        return transformRenderSystem(classfileBuffer);
                    } catch (Throwable t) {
                        System.err.println("[ELauncher Agent] Error patching RenderSystem: " + t);
                    }
                }

                // ── 2. UNIVERSAL TITLE SCREEN HOOK ─────────────────────────────────────
                if (isTitleScreen(className, classfileBuffer)) {
                    System.out.println("[ELauncher Agent] Detected TitleScreen class: " + className);
                    try {
                        return transformTitleScreen(classfileBuffer, className);
                    } catch (Throwable t) {
                        System.err.println("[ELauncher Agent] Error patching TitleScreen (" + className + "): " + t);
                        t.printStackTrace();
                    }
                }

                // ── 3. PANORAMA SUPPRESSION HOOK ───────────────────────────────────────
                if (isPanoramaClass(className, classfileBuffer)) {
                    try {
                        return suppressPanorama(classfileBuffer, className);
                    } catch (Throwable t) {
                        System.err.println("[ELauncher Agent] Error suppressing panorama (" + className + "): " + t);
                    }
                }

                return null;
            }
        }, true);
    }

    private static boolean isTitleScreen(String className, byte[] buffer) {
        if (className.equals("gsd") || className.equals("gsf")
                || className.equals("net/minecraft/class_442")
                || className.equals("net/minecraft/client/gui/screens/TitleScreen")
                || className.equals("net/minecraft/client/gui/screen/TitleScreen")
                || className.equals("net/minecraft/client/gui/GuiMainMenu")) {
            return true;
        }
        return containsUtf8(buffer, "menu.singleplayer") && containsUtf8(buffer, "menu.multiplayer");
    }

    private static boolean isPanoramaClass(String className, byte[] buffer) {
        if (className.equals("hor") || className.equals("net/minecraft/class_766")
                || className.equals("net/minecraft/client/renderer/PanoramaRenderer")) {
            return true;
        }
        return containsUtf8(buffer, "textures/gui/title/background/panorama_")
                || containsUtf8(buffer, "panorama_0.png");
    }

    private static boolean containsUtf8(byte[] data, String target) {
        byte[] pattern = target.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (data.length < pattern.length) return false;
        int max = data.length - pattern.length;
        for (int i = 0; i <= max; i++) {
            boolean match = true;
            for (int j = 0; j < pattern.length; j++) {
                if (data[i + j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
        return false;
    }

    /**
     * Injects MenuState.onTitleScreenTick(this) and early return into TitleScreen.render(...)
     */
    private static byte[] transformTitleScreen(byte[] classfileBuffer, String targetClassName) {
        ClassReader reader = new ClassReader(classfileBuffer);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);

        final boolean[] hooked = new boolean[1];

        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor,
                                             String signature, String[] exceptions) {
                MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);

                boolean isRenderMethod = descriptor.endsWith("IIF)V")
                        && !name.equals("<init>")
                        && !name.equals("b");

                if (isRenderMethod && !hooked[0]) {
                    hooked[0] = true;
                    System.out.println("[ELauncher Agent] Intercepting TitleScreen render: " + targetClassName + "." + name + descriptor);
                    return new MethodVisitor(Opcodes.ASM9, mv) {
                        @Override
                        public void visitCode() {
                            super.visitCode();
                            // MenuState.onTitleScreenTick(this);
                            mv.visitVarInsn(Opcodes.ALOAD, 0);
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC,
                                    "com/eternal/launcher/agent/MenuState",
                                    "onTitleScreenTick",
                                    "(Ljava/lang/Object;)V",
                                    false);
                            // NOTE: Do not return early here! If we return early, OpenGL
                            // never updates or buffers stay cleared black, causing black screens when transitioning!
                            // Vanilla renders in the background while our Electron window overlays it cleanly.
                        }
                    };
                }
                return mv;
            }
        };

        reader.accept(visitor, 0);
        return writer.toByteArray();
    }

    /**
     * Hooks RenderSystem.flipFrame to update GLFW window metrics on Minecraft's render thread.
     */
    private static byte[] transformRenderSystem(byte[] classfileBuffer) {
        ClassReader reader = new ClassReader(classfileBuffer);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);

        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor,
                                             String signature, String[] exceptions) {
                MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);

                if (name.equals("flipFrame")) {
                    System.out.println("[ELauncher Agent] Hooked RenderSystem.flipFrame");
                    return new MethodVisitor(Opcodes.ASM9, mv) {
                        @Override
                        public void visitCode() {
                            super.visitCode();
                            // Call MenuState.onRenderFrame() at the very start of flipFrame
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC,
                                    "com/eternal/launcher/agent/MenuState",
                                    "onRenderFrame",
                                    "()V",
                                    false);
                        }
                    };
                }
                return mv;
            }
        };

        reader.accept(visitor, 0);
        return writer.toByteArray();
    }

    /**
     * Suppresses panorama rendering calls so they return immediately without drawing anything.
     */
    private static byte[] suppressPanorama(byte[] classfileBuffer, String targetClassName) {
        ClassReader reader = new ClassReader(classfileBuffer);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);

        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor,
                                             String signature, String[] exceptions) {
                MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);

                if (descriptor.endsWith(";IIZ)V") || descriptor.contains("gir") && descriptor.endsWith(")V")) {
                    return new MethodVisitor(Opcodes.ASM9, mv) {
                        @Override
                        public void visitCode() {
                            super.visitCode();
                            // If our agent is active, suppress panorama rendering.
                            // If agent is inactive (vanilla mode), allow panorama to render normally!
                            Label continueLabel = new Label();
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC,
                                    "com/eternal/launcher/agent/MenuState",
                                    "isAgentActive",
                                    "()Z",
                                    false);
                            mv.visitJumpInsn(Opcodes.IFEQ, continueLabel);
                            mv.visitInsn(Opcodes.RETURN);
                            mv.visitLabel(continueLabel);
                        }
                    };
                }
                return mv;
            }
        };

        reader.accept(visitor, 0);
        return writer.toByteArray();
    }
}
