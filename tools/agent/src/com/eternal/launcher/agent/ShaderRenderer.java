package com.eternal.launcher.agent;

import org.lwjgl.glfw.GLFW;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.GL20;
import org.lwjgl.opengl.GL30;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

public class ShaderRenderer {

    private static boolean initialized = false;
    private static boolean initFailed = false;

    private static int programId = 0;
    private static int vaoId = 0;
    private static int vboId = 0;

    private static int uResolution = -1;
    private static int uTime = -1;
    private static int uMousePos = -1;

    private static long startTime = System.currentTimeMillis();

    private static final String VERTEX_SHADER = """
        #version 330 core
        layout (location = 0) in vec2 aPos;
        out vec2 vUv;
        void main() {
            vUv = (aPos + 1.0) * 0.5;
            gl_Position = vec4(aPos, 0.0, 1.0);
        }
    """;

    private static final String FRAGMENT_SHADER = """
        #version 330 core
        in vec2 vUv;
        out vec4 FragColor;

        uniform vec2 resolution;
        uniform float time;
        uniform vec2 mousePos;

        // 8x8 Bayer dithering matrix
        float getBayer8x8(vec2 coord) {
            int x = int(mod(coord.x, 8.0));
            int y = int(mod(coord.y, 8.0));
            int idx = y * 8 + x;
            
            if (idx == 0) return 0.0 / 64.0;
            if (idx == 1) return 32.0 / 64.0;
            if (idx == 2) return 8.0 / 64.0;
            if (idx == 3) return 40.0 / 64.0;
            if (idx == 4) return 2.0 / 64.0;
            if (idx == 5) return 34.0 / 64.0;
            if (idx == 6) return 10.0 / 64.0;
            if (idx == 7) return 42.0 / 64.0;
            if (idx == 8) return 48.0 / 64.0;
            if (idx == 9) return 16.0 / 64.0;
            if (idx == 10) return 56.0 / 64.0;
            if (idx == 11) return 24.0 / 64.0;
            if (idx == 12) return 50.0 / 64.0;
            if (idx == 13) return 18.0 / 64.0;
            if (idx == 14) return 58.0 / 64.0;
            if (idx == 15) return 26.0 / 64.0;
            if (idx == 16) return 12.0 / 64.0;
            if (idx == 17) return 44.0 / 64.0;
            if (idx == 18) return 4.0 / 64.0;
            if (idx == 19) return 36.0 / 64.0;
            if (idx == 20) return 14.0 / 64.0;
            if (idx == 21) return 46.0 / 64.0;
            if (idx == 22) return 6.0 / 64.0;
            if (idx == 23) return 38.0 / 64.0;
            if (idx == 24) return 60.0 / 64.0;
            if (idx == 25) return 28.0 / 64.0;
            if (idx == 26) return 52.0 / 64.0;
            if (idx == 27) return 20.0 / 64.0;
            if (idx == 28) return 62.0 / 64.0;
            if (idx == 29) return 30.0 / 64.0;
            if (idx == 30) return 54.0 / 64.0;
            if (idx == 31) return 22.0 / 64.0;
            if (idx == 32) return 3.0 / 64.0;
            if (idx == 33) return 35.0 / 64.0;
            if (idx == 34) return 11.0 / 64.0;
            if (idx == 35) return 43.0 / 64.0;
            if (idx == 36) return 1.0 / 64.0;
            if (idx == 37) return 33.0 / 64.0;
            if (idx == 38) return 9.0 / 64.0;
            if (idx == 39) return 41.0 / 64.0;
            if (idx == 40) return 51.0 / 64.0;
            if (idx == 41) return 19.0 / 64.0;
            if (idx == 42) return 59.0 / 64.0;
            if (idx == 43) return 27.0 / 64.0;
            if (idx == 44) return 49.0 / 64.0;
            if (idx == 45) return 17.0 / 64.0;
            if (idx == 46) return 57.0 / 64.0;
            if (idx == 47) return 25.0 / 64.0;
            if (idx == 48) return 15.0 / 64.0;
            if (idx == 49) return 47.0 / 64.0;
            if (idx == 50) return 7.0 / 64.0;
            if (idx == 51) return 39.0 / 64.0;
            if (idx == 52) return 13.0 / 64.0;
            if (idx == 53) return 45.0 / 64.0;
            if (idx == 54) return 5.0 / 64.0;
            if (idx == 55) return 37.0 / 64.0;
            if (idx == 56) return 63.0 / 64.0;
            if (idx == 57) return 31.0 / 64.0;
            if (idx == 58) return 55.0 / 64.0;
            if (idx == 59) return 23.0 / 64.0;
            if (idx == 60) return 61.0 / 64.0;
            if (idx == 61) return 29.0 / 64.0;
            if (idx == 62) return 53.0 / 64.0;
            return 21.0 / 64.0;
        }

        mat2 rotate2D(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat2(c, -s, s, c);
        }

        void main() {
            vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
            vec2 p = uv;
            
            p += mousePos * 0.015;

            float baseAngle = 0.38;
            p = rotate2D(baseAngle) * p;

            float t = time * 0.48;

            float morphA = sin(0.0);
            float morphB = cos(0.0);

            float warp1 = sin(p.y * 2.8 + t * 0.45) * (0.18 + 0.08 * morphA);
            float warp2 = cos(p.x * 2.2 - t * 0.35 + morphB * 0.6) * (0.15 + 0.06 * morphB);
            vec2 q = vec2(p.x + warp1, p.y + warp2);

            float h1 = sin(q.x * 2.4 + t * 0.5) * cos(q.y * 1.9 - t * 0.35);
            float h2 = sin((q.x * 1.8 - q.y * 2.2) * 1.6 + h1 * 1.6 + t * 0.55) * 0.42;
            float h3 = sin(q.x * 4.2 + q.y * 3.1 + h2 * 2.0 - t * 0.7) * (0.22 + 0.08 * morphA);
            float h4 = sin(q.x * 7.0 - q.y * 5.5 + t * 0.9) * 0.08;

            float elevation = h1 + h2 + h3 + h4;

            float baseCoord = q.y * 12.0 + elevation * 3.4 + t * 0.15;
            float f1 = fract(baseCoord);
            float line1 = 1.0 - smoothstep(0.0, 0.09, abs(f1 - 0.5) * 2.0);

            float f2 = fract(baseCoord / 3.0);
            float lineMajor = (1.0 - smoothstep(0.0, 0.12, abs(f2 - 0.5) * 2.0)) * 0.65;

            float f3 = fract(baseCoord * 2.0 + elevation * 1.2);
            float lineMicro = (1.0 - smoothstep(0.0, 0.06, abs(f3 - 0.5) * 2.0)) * 0.28;

            float contour = clamp(line1 * 0.7 + lineMajor + lineMicro, 0.0, 1.0);

            float lum = 0.10 + 0.48 * contour + 0.18 * (elevation * 0.45 + 0.5);
            float ridgeLight = smoothstep(0.4, -0.4, abs(h2));
            lum += ridgeLight * 0.08;

            vec2 screenPixel = floor(gl_FragCoord.xy / 2.0);
            float bayer = getBayer8x8(screenPixel);
            float dithered = smoothstep(bayer - 0.16, bayer + 0.16, lum);

            vec3 darkBg = vec3(0.032, 0.036, 0.048);
            vec3 wireColor = vec3(0.46, 0.56, 0.72) * (0.6 + 0.4 * lineMajor + 0.3 * contour);
            vec3 color = mix(darkBg, wireColor, dithered * 0.35);

            float vignette = smoothstep(1.3, 0.35, length(uv));
            color = mix(vec3(0.018, 0.022, 0.028), color, vignette);

            FragColor = vec4(color, 1.0);
        }
    """;

    private static boolean initGL() {
        if (initFailed) return false;
        if (initialized) return true;

        try {
            int vert = GL20.glCreateShader(GL20.GL_VERTEX_SHADER);
            GL20.glShaderSource(vert, VERTEX_SHADER);
            GL20.glCompileShader(vert);
            if (GL20.glGetShaderi(vert, GL20.GL_COMPILE_STATUS) == GL11.GL_FALSE) {
                System.err.println("[ELauncher Agent] Vertex shader compile error: " + GL20.glGetShaderInfoLog(vert));
                initFailed = true;
                return false;
            }

            int frag = GL20.glCreateShader(GL20.GL_FRAGMENT_SHADER);
            GL20.glShaderSource(frag, FRAGMENT_SHADER);
            GL20.glCompileShader(frag);
            if (GL20.glGetShaderi(frag, GL20.GL_COMPILE_STATUS) == GL11.GL_FALSE) {
                System.err.println("[ELauncher Agent] Fragment shader compile error: " + GL20.glGetShaderInfoLog(frag));
                initFailed = true;
                return false;
            }

            programId = GL20.glCreateProgram();
            GL20.glAttachShader(programId, vert);
            GL20.glAttachShader(programId, frag);
            GL20.glLinkProgram(programId);
            if (GL20.glGetProgrami(programId, GL20.GL_LINK_STATUS) == GL11.GL_FALSE) {
                System.err.println("[ELauncher Agent] Program link error: " + GL20.glGetProgramInfoLog(programId));
                initFailed = true;
                return false;
            }

            GL20.glDeleteShader(vert);
            GL20.glDeleteShader(frag);

            uResolution = GL20.glGetUniformLocation(programId, "resolution");
            uTime = GL20.glGetUniformLocation(programId, "time");
            uMousePos = GL20.glGetUniformLocation(programId, "mousePos");

            // Fullscreen quad [-1, -1] to [1, 1]
            float[] quadVertices = {
                -1.0f,  1.0f,
                -1.0f, -1.0f,
                 1.0f, -1.0f,

                -1.0f,  1.0f,
                 1.0f, -1.0f,
                 1.0f,  1.0f
            };

            vaoId = GL30.glGenVertexArrays();
            vboId = GL20.glGenBuffers();

            GL30.glBindVertexArray(vaoId);
            GL20.glBindBuffer(GL20.GL_ARRAY_BUFFER, vboId);

            FloatBuffer buffer = ByteBuffer.allocateDirect(quadVertices.length * 4)
                    .order(ByteOrder.nativeOrder())
                    .asFloatBuffer();
            buffer.put(quadVertices).flip();

            GL20.glBufferData(GL20.GL_ARRAY_BUFFER, buffer, GL20.GL_STATIC_DRAW);
            GL20.glVertexAttribPointer(0, 2, GL11.GL_FLOAT, false, 2 * 4, 0);
            GL20.glEnableVertexAttribArray(0);

            GL20.glBindBuffer(GL20.GL_ARRAY_BUFFER, 0);
            GL30.glBindVertexArray(0);

            initialized = true;
            System.out.println("[ELauncher Agent] GLSL Abstract Shader initialized successfully!");
            return true;
        } catch (Throwable t) {
            System.err.println("[ELauncher Agent] Error initializing OpenGL shader: " + t);
            t.printStackTrace();
            initFailed = true;
            return false;
        }
    }

    public static boolean renderBackground(int width, int height) {
        if (!initGL()) return false;

        try {
            // Read mouse position if GLFW context is present
            double mouseX = 0.0;
            double mouseY = 0.0;
            long window = GLFW.glfwGetCurrentContext();
            if (window != 0) {
                double[] mx = new double[1];
                double[] my = new double[1];
                GLFW.glfwGetCursorPos(window, mx, my);
                // Normalize mouse position to [-1, 1]
                int[] winW = new int[1];
                int[] winH = new int[1];
                GLFW.glfwGetWindowSize(window, winW, winH);
                if (winW[0] > 0 && winH[0] > 0) {
                    mouseX = (mx[0] / winW[0]) * 2.0 - 1.0;
                    mouseY = 1.0 - (my[0] / winH[0]) * 2.0;
                }
            }

            // Save essential state
            boolean depthTest = GL11.glIsEnabled(GL11.GL_DEPTH_TEST);
            boolean blend = GL11.glIsEnabled(GL11.GL_BLEND);
            boolean cullFace = GL11.glIsEnabled(GL11.GL_CULL_FACE);

            GL11.glDisable(GL11.GL_DEPTH_TEST);
            GL11.glDisable(GL11.GL_CULL_FACE);
            GL11.glDisable(GL11.GL_BLEND);

            GL20.glUseProgram(programId);

            // Pass framebuffer dimensions
            int[] viewport = new int[4];
            GL11.glGetIntegerv(GL11.GL_VIEWPORT, viewport);
            float resW = viewport[2] > 0 ? viewport[2] : width;
            float resH = viewport[3] > 0 ? viewport[3] : height;

            GL20.glUniform2f(uResolution, resW, resH);
            float elapsedTime = (System.currentTimeMillis() - startTime) / 1000.0f;
            GL20.glUniform1f(uTime, elapsedTime);
            GL20.glUniform2f(uMousePos, (float) mouseX, (float) mouseY);

            GL30.glBindVertexArray(vaoId);
            GL11.glDrawArrays(GL11.GL_TRIANGLES, 0, 6);
            GL30.glBindVertexArray(0);

            GL20.glUseProgram(0);

            // Restore state
            if (depthTest) GL11.glEnable(GL11.GL_DEPTH_TEST);
            if (blend) GL11.glEnable(GL11.GL_BLEND);
            if (cullFace) GL11.glEnable(GL11.GL_CULL_FACE);

            return true;
        } catch (Throwable t) {
            System.err.println("[ELauncher Agent] Render error: " + t);
            return false;
        }
    }
}
