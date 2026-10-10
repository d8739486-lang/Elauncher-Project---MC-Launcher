package com.eternal.launcher.agent;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import org.objectweb.asm.*;

public class BackgroundAgent {

    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("[ELauncher Agent] Initializing custom abstract shader background agent...");
        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined,
                                    ProtectionDomain protectionDomain, byte[] classfileBuffer) {
                if (className == null) return null;

                // 1.21.11: hor is PanoramaRenderer, gsb is Screen
                // In hor, method a(gir, int, int, boolean) renders the 3D rotating cubemap + overlay
                if (className.equals("hor")) {
                    try {
                        return transformPanoramaRenderer(classfileBuffer);
                    } catch (Throwable t) {
                        System.err.println("[ELauncher Agent] Error transforming hor (PanoramaRenderer): " + t);
                        t.printStackTrace();
                    }
                }
                return null;
            }
        });
    }

    private static byte[] transformPanoramaRenderer(byte[] classfileBuffer) {
        ClassReader reader = new ClassReader(classfileBuffer);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);

        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor, String signature, String[] exceptions) {
                MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);
                // Target method: public void a(gir, int, int, boolean) -> descriptor (Lgir;IIZ)V
                if (name.equals("a") && descriptor.equals("(Lgir;IIZ)V")) {
                    System.out.println("[ELauncher Agent] Patching hor.a(gir, int, int, boolean) with custom OpenGL shader renderer!");
                    return new MethodVisitor(Opcodes.ASM9, mv) {
                        @Override
                        public void visitCode() {
                            super.visitCode();
                            // Load arguments:
                            // arg 0 = this (hor)
                            // arg 1 = gir
                            // arg 2 = width (int)
                            // arg 3 = height (int)
                            // arg 4 = boolean
                            mv.visitVarInsn(Opcodes.ILOAD, 2); // width
                            mv.visitVarInsn(Opcodes.ILOAD, 3); // height
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC,
                                    "com/eternal/launcher/agent/ShaderRenderer",
                                    "renderBackground",
                                    "(II)Z",
                                    false);
                            Label continueLabel = new Label();
                            mv.visitJumpInsn(Opcodes.IFEQ, continueLabel); // If returns false, fall back to vanilla panorama
                            mv.visitInsn(Opcodes.RETURN); // Otherwise, our custom shader handled background completely!
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
