package com.eternal.launcher.agent;

import java.lang.instrument.ClassFileTransformer;
import java.lang.instrument.Instrumentation;
import java.security.ProtectionDomain;
import com.eternal.bgasm.*;

public class BackgroundAgent {

    public static void premain(String agentArgs, Instrumentation inst) {
        System.out.println("[ELauncher Agent] Initializing custom abstract shader background agent...");
        inst.addTransformer(new ClassFileTransformer() {
            @Override
            public byte[] transform(ClassLoader loader, String className, Class<?> classBeingRedefined,
                                    ProtectionDomain protectionDomain, byte[] classfileBuffer) {
                if (className == null) return null;

                // 1. hor (Vanilla) or net/minecraft/class_766 (Fabric Intermediary) -> PanoramaRenderer
                if (className.equals("hor") || className.equals("net/minecraft/class_766")) {
                    try {
                        return transformPanoramaRenderer(classfileBuffer, className);
                    } catch (Throwable t) {
                        System.err.println("[ELauncher Agent] Error transforming PanoramaRenderer (" + className + "): " + t);
                        t.printStackTrace();
                    }
                }

                // 2. gsb (Vanilla) or net/minecraft/class_437 (Fabric Intermediary) -> Screen
                // Intercept renderPanorama: a(gir, float) or method_57728
                if (className.equals("gsb") || className.equals("net/minecraft/class_437")) {
                    try {
                        return transformScreen(classfileBuffer, className);
                    } catch (Throwable t) {
                        System.err.println("[ELauncher Agent] Error transforming Screen (" + className + "): " + t);
                        t.printStackTrace();
                    }
                }

                return null;
            }
        });
    }

    private static byte[] transformPanoramaRenderer(byte[] classfileBuffer, String targetClassName) {
        ClassReader reader = new ClassReader(classfileBuffer);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);

        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor, String signature, String[] exceptions) {
                MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);

                // Matches hor.a(gir, int, int, boolean) or method_3317(class_332, int, int, boolean)
                boolean isTargetMethod = (name.equals("a") || name.equals("method_3317"))
                        && (descriptor.endsWith(";IIZ)V") || descriptor.equals("(Lgir;IIZ)V"));

                if (isTargetMethod) {
                    System.out.println("[ELauncher Agent] Hooking " + targetClassName + "." + name + descriptor + " with kinetic shader renderer");
                    return new MethodVisitor(Opcodes.ASM9, mv) {
                        @Override
                        public void visitCode() {
                            super.visitCode();
                            // Reflection invocation ensures zero ClassLoader boundary issues across Knot/Fabric
                            // Calls ShaderRenderer.renderBackground(width, height)
                            Label continueLabel = new Label();

                            mv.visitLdcInsn("com.eternal.launcher.agent.ShaderRenderer");
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC, "java/lang/Class", "forName", "(Ljava/lang/String;)Ljava/lang/Class;", false);

                            mv.visitLdcInsn("renderBackground");
                            mv.visitInsn(Opcodes.ICONST_2);
                            mv.visitTypeInsn(Opcodes.ANEWARRAY, "java/lang/Class");
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_0);
                            mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/Integer", "TYPE", "Ljava/lang/Class;");
                            mv.visitInsn(Opcodes.AASTORE);
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_1);
                            mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/Integer", "TYPE", "Ljava/lang/Class;");
                            mv.visitInsn(Opcodes.AASTORE);

                            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/Class", "getMethod", "(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;", false);

                            mv.visitInsn(Opcodes.ACONST_NULL);
                            mv.visitInsn(Opcodes.ICONST_2);
                            mv.visitTypeInsn(Opcodes.ANEWARRAY, "java/lang/Object");
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_0);
                            mv.visitVarInsn(Opcodes.ILOAD, 2); // width
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC, "java/lang/Integer", "valueOf", "(I)Ljava/lang/Integer;", false);
                            mv.visitInsn(Opcodes.AASTORE);
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_1);
                            mv.visitVarInsn(Opcodes.ILOAD, 3); // height
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC, "java/lang/Integer", "valueOf", "(I)Ljava/lang/Integer;", false);
                            mv.visitInsn(Opcodes.AASTORE);

                            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/reflect/Method", "invoke", "(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;", false);
                            mv.visitTypeInsn(Opcodes.CHECKCAST, "java/lang/Boolean");
                            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/Boolean", "booleanValue", "()Z", false);

                            mv.visitJumpInsn(Opcodes.IFEQ, continueLabel); // If false, fallback
                            mv.visitInsn(Opcodes.RETURN); // Custom background handled!
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

    private static byte[] transformScreen(byte[] classfileBuffer, String targetClassName) {
        ClassReader reader = new ClassReader(classfileBuffer);
        ClassWriter writer = new ClassWriter(reader, ClassWriter.COMPUTE_FRAMES | ClassWriter.COMPUTE_MAXS);

        ClassVisitor visitor = new ClassVisitor(Opcodes.ASM9, writer) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor, String signature, String[] exceptions) {
                MethodVisitor mv = super.visitMethod(access, name, descriptor, signature, exceptions);

                // Matches gsb.a(gir, float) or method_57728(class_332, float) -> renderPanorama
                boolean isRenderPanorama = (name.equals("a") || name.equals("method_57728"))
                        && (descriptor.endsWith(";F)V") || descriptor.equals("(Lgir;F)V"));

                if (isRenderPanorama) {
                    System.out.println("[ELauncher Agent] Hooking " + targetClassName + "." + name + descriptor + " (renderPanorama)");
                    return new MethodVisitor(Opcodes.ASM9, mv) {
                        @Override
                        public void visitCode() {
                            super.visitCode();
                            Label continueLabel = new Label();

                            mv.visitLdcInsn("com.eternal.launcher.agent.ShaderRenderer");
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC, "java/lang/Class", "forName", "(Ljava/lang/String;)Ljava/lang/Class;", false);

                            mv.visitLdcInsn("renderBackground");
                            mv.visitInsn(Opcodes.ICONST_2);
                            mv.visitTypeInsn(Opcodes.ANEWARRAY, "java/lang/Class");
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_0);
                            mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/Integer", "TYPE", "Ljava/lang/Class;");
                            mv.visitInsn(Opcodes.AASTORE);
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_1);
                            mv.visitFieldInsn(Opcodes.GETSTATIC, "java/lang/Integer", "TYPE", "Ljava/lang/Class;");
                            mv.visitInsn(Opcodes.AASTORE);

                            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/Class", "getMethod", "(Ljava/lang/String;[Ljava/lang/Class;)Ljava/lang/reflect/Method;", false);

                            mv.visitInsn(Opcodes.ACONST_NULL);
                            mv.visitInsn(Opcodes.ICONST_2);
                            mv.visitTypeInsn(Opcodes.ANEWARRAY, "java/lang/Object");
                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_0);

                            // Load this.width
                            mv.visitVarInsn(Opcodes.ALOAD, 0);
                            String widthField = targetClassName.equals("gsb") ? "o" : "field_22789";
                            mv.visitFieldInsn(Opcodes.GETFIELD, targetClassName, widthField, "I");
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC, "java/lang/Integer", "valueOf", "(I)Ljava/lang/Integer;", false);
                            mv.visitInsn(Opcodes.AASTORE);

                            mv.visitInsn(Opcodes.DUP);
                            mv.visitInsn(Opcodes.ICONST_1);

                            // Load this.height
                            mv.visitVarInsn(Opcodes.ALOAD, 0);
                            String heightField = targetClassName.equals("gsb") ? "p" : "field_22790";
                            mv.visitFieldInsn(Opcodes.GETFIELD, targetClassName, heightField, "I");
                            mv.visitMethodInsn(Opcodes.INVOKESTATIC, "java/lang/Integer", "valueOf", "(I)Ljava/lang/Integer;", false);
                            mv.visitInsn(Opcodes.AASTORE);

                            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/reflect/Method", "invoke", "(Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/Object;", false);
                            mv.visitTypeInsn(Opcodes.CHECKCAST, "java/lang/Boolean");
                            mv.visitMethodInsn(Opcodes.INVOKEVIRTUAL, "java/lang/Boolean", "booleanValue", "()Z", false);

                            mv.visitJumpInsn(Opcodes.IFEQ, continueLabel);
                            mv.visitInsn(Opcodes.RETURN); // Custom background handled completely!
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
