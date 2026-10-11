package com.eternal.launcher.agent;

import org.lwjgl.glfw.GLFW;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.GL12;
import org.lwjgl.opengl.GL13;
import org.lwjgl.opengl.GL20;
import org.lwjgl.opengl.GL30;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;

/**
 * ELauncher High-Polish OpenGL Minecraft In-Game Menu
 *
 * Renders the ELauncher Client UI (Dark castle wallpaper, glowing cards,
 * logo, top badges, and Apple/Framer smooth animations) directly to Framebuffer 0
 * right before GLFW swaps the display buffer.
 */
public class ShaderRenderer {

    private static boolean initialized = false;
    private static boolean initFailed  = false;

    // OpenGL objects
    private static int quadProgram    = 0;
    private static int quadVao        = 0;
    private static int quadVbo        = 0;

    // Textures
    private static int bgTexId        = 0;
    private static int logoTexId      = 0;
    private static int pillTexId      = 0;
    private static int topBarTexId    = 0;
    private static int footerTexId    = 0;

    // Card textures [4 cards][normal = 0, hover = 1]
    private static int[][] cardTexIds = new int[4][2];

    // Uniforms
    private static int u_tex          = -1;
    private static int u_rect         = -1; // vec4(x, y, w, h) in NDC
    private static int u_alpha        = -1;

    // Card definitions
    private static final String[][] CARDS = {
        { "SINGLEPLAYER", "Local worlds & adventure" },
        { "MULTIPLAYER",  "Servers, realms & friends"  },
        { "SETTINGS",     "Video, audio, controls"    },
        { "QUIT GAME",    "Exit to desktop"           }
    };

    // State
    private static final float[] hoverAnim = new float[4];
    private static long lastFrameNs = System.nanoTime();
    private static boolean wasMouseDown = false;
    private static boolean actionConsumed = false;

    // GLSL Shaders
    private static final String VERT_SRC = """
        #version 150
        in vec2 aPos;
        uniform vec4 u_rect; // left, top, width, height in NDC
        out vec2 vUV;
        void main() {
            vUV = vec2((aPos.x + 1.0) * 0.5, (1.0 - aPos.y) * 0.5);
            vec2 pos = vec2(
                u_rect.x + (aPos.x + 1.0) * 0.5 * u_rect.z,
                u_rect.y - (1.0 - aPos.y) * 0.5 * u_rect.w
            );
            gl_Position = vec4(pos, 0.0, 1.0);
        }
    """;

    private static final String FRAG_SRC = """
        #version 150
        in vec2 vUV;
        uniform sampler2D u_tex;
        uniform float u_alpha;
        out vec4 fragColor;
        void main() {
            vec4 col = texture(u_tex, vUV);
            fragColor = vec4(col.rgb, col.a * u_alpha);
        }
    """;

    // ──────────────────────────────────────────────────────────────────────────
    // Initialization
    // ──────────────────────────────────────────────────────────────────────────
    private static boolean initGL() {
        if (initialized) return true;
        if (initFailed)  return false;

        try {
            int vs = GL20.glCreateShader(GL20.GL_VERTEX_SHADER);
            GL20.glShaderSource(vs, VERT_SRC);
            GL20.glCompileShader(vs);
            if (GL20.glGetShaderi(vs, GL20.GL_COMPILE_STATUS) == GL11.GL_FALSE) {
                System.err.println("[ELauncher Agent] Vertex shader compile error:\n" + GL20.glGetShaderInfoLog(vs));
                initFailed = true;
                return false;
            }

            int fs = GL20.glCreateShader(GL20.GL_FRAGMENT_SHADER);
            GL20.glShaderSource(fs, FRAG_SRC);
            GL20.glCompileShader(fs);
            if (GL20.glGetShaderi(fs, GL20.GL_COMPILE_STATUS) == GL11.GL_FALSE) {
                System.err.println("[ELauncher Agent] Fragment shader compile error:\n" + GL20.glGetShaderInfoLog(fs));
                initFailed = true;
                return false;
            }

            quadProgram = GL20.glCreateProgram();
            GL20.glAttachShader(quadProgram, vs);
            GL20.glAttachShader(quadProgram, fs);

            // Explicitly bind attribute & frag output locations before linking
            GL20.glBindAttribLocation(quadProgram, 0, "aPos");
            GL30.glBindFragDataLocation(quadProgram, 0, "fragColor");

            GL20.glLinkProgram(quadProgram);
            GL20.glDeleteShader(vs);
            GL20.glDeleteShader(fs);

            if (GL20.glGetProgrami(quadProgram, GL20.GL_LINK_STATUS) == GL11.GL_FALSE) {
                System.err.println("[ELauncher Agent] Program link error:\n" + GL20.glGetProgramInfoLog(quadProgram));
                initFailed = true;
                return false;
            }

            u_tex   = GL20.glGetUniformLocation(quadProgram, "u_tex");
            u_rect  = GL20.glGetUniformLocation(quadProgram, "u_rect");
            u_alpha = GL20.glGetUniformLocation(quadProgram, "u_alpha");

            // Unit quad: [-1..1]
            float[] verts = {
                -1f,  1f,
                -1f, -1f,
                 1f, -1f,
                -1f,  1f,
                 1f, -1f,
                 1f,  1f
            };
            quadVao = GL30.glGenVertexArrays();
            quadVbo = GL20.glGenBuffers();
            GL30.glBindVertexArray(quadVao);
            GL20.glBindBuffer(GL20.GL_ARRAY_BUFFER, quadVbo);
            FloatBuffer fb = ByteBuffer.allocateDirect(verts.length * 4)
                    .order(ByteOrder.nativeOrder()).asFloatBuffer();
            fb.put(verts).flip();
            GL20.glBufferData(GL20.GL_ARRAY_BUFFER, fb, GL20.GL_STATIC_DRAW);
            GL20.glVertexAttribPointer(0, 2, GL11.GL_FLOAT, false, 8, 0);
            GL20.glEnableVertexAttribArray(0);
            GL20.glBindBuffer(GL20.GL_ARRAY_BUFFER, 0);
            GL30.glBindVertexArray(0);

            // Load textures
            bgTexId     = loadBackgroundTexture();
            logoTexId   = loadLogoTexture();
            pillTexId   = generatePillTexture("✦ NEXT-GEN CLIENT SHELL");
            topBarTexId = generateTopBarTexture();
            footerTexId = generateFooterTexture();

            for (int i = 0; i < 4; i++) {
                cardTexIds[i][0] = generateCardTexture(CARDS[i][0], CARDS[i][1], false);
                cardTexIds[i][1] = generateCardTexture(CARDS[i][0], CARDS[i][1], true);
            }

            initialized = true;
            System.out.println("[ELauncher Agent] MenuRenderer successfully initialized!");
            return true;
        } catch (Throwable t) {
            System.err.println("[ELauncher Agent] Failed to init OpenGL in ShaderRenderer: " + t);
            t.printStackTrace();
            initFailed = true;
            return false;
        }
    }

    /**
     * Called every frame right before glfwSwapBuffers from RenderSystem.flipFrame
     */
    public static void onRenderFrame() {
        if (MenuState.framesSinceTitleScreen <= 2 && MenuState.activeTitleScreen != null) {
            renderMenu(MenuState.activeTitleScreen);
        }
        MenuState.framesSinceTitleScreen++;
    }

    /**
     * Renders the custom menu directly into the window buffer (Framebuffer 0).
     */
    public static boolean renderMenu(Object titleScreen) {
        if (!initGL()) return false;

        long win = GLFW.glfwGetCurrentContext();
        if (win == 0) return false;

        // ── 1. Save Complete OpenGL State ────────────────────────────────────
        boolean wasDepth     = GL11.glIsEnabled(GL11.GL_DEPTH_TEST);
        boolean wasCull      = GL11.glIsEnabled(GL11.GL_CULL_FACE);
        boolean wasBlend     = GL11.glIsEnabled(GL11.GL_BLEND);
        boolean wasScissor   = GL11.glIsEnabled(GL11.GL_SCISSOR_TEST);
        boolean wasDepthMask = GL11.glGetBoolean(GL11.GL_DEPTH_WRITEMASK);
        int[] oldVp = new int[4];
        GL11.glGetIntegerv(GL11.GL_VIEWPORT, oldVp);

        int oldFbo           = GL11.glGetInteger(GL30.GL_FRAMEBUFFER_BINDING);
        int oldProgram       = GL11.glGetInteger(GL20.GL_CURRENT_PROGRAM);
        int oldVao           = GL11.glGetInteger(GL30.GL_VERTEX_ARRAY_BINDING);
        int oldVbo           = GL11.glGetInteger(GL20.GL_ARRAY_BUFFER_BINDING);
        int oldTex           = GL11.glGetInteger(GL11.GL_TEXTURE_BINDING_2D);
        int oldActiveTex     = GL11.glGetInteger(GL13.GL_ACTIVE_TEXTURE);

        try {
            int[] winW = new int[1], winH = new int[1];
            double[] mx = new double[1], my = new double[1];
            GLFW.glfwGetWindowSize(win, winW, winH);
            GLFW.glfwGetCursorPos(win, mx, my);

            int W = winW[0], H = winH[0];
            if (W <= 0 || H <= 0) return false;

            float mouseX = (float) mx[0];
            float mouseY = (float) my[0];

            // Delta time
            long now = System.nanoTime();
            float dt = (now - lastFrameNs) / 1_000_000_000f;
            if (dt > 0.1f) dt = 0.016f;
            lastFrameNs = now;

            // Metrics
            float cardW = Math.min(480f, W * 0.40f);
            float cardH = 62f;
            float cardGap = 12f;
            float startY = H * 0.45f;
            float cardX = (W - cardW) * 0.5f;

            // Mouse hover test
            int hoveredCard = -1;
            for (int i = 0; i < 4; i++) {
                float cy = startY + i * (cardH + cardGap);
                if (mouseX >= cardX && mouseX <= cardX + cardW && mouseY >= cy && mouseY <= cy + cardH) {
                    hoveredCard = i;
                    break;
                }
            }

            // Animate hover smoothly
            for (int i = 0; i < 4; i++) {
                float target = (i == hoveredCard) ? 1.0f : 0.0f;
                hoverAnim[i] += (target - hoverAnim[i]) * Math.min(1.0f, dt * 14.0f);
            }

            // Mouse click handling
            boolean mouseDown = GLFW.glfwGetMouseButton(win, GLFW.GLFW_MOUSE_BUTTON_LEFT) == GLFW.GLFW_PRESS;
            if (mouseDown && !wasMouseDown && !actionConsumed) {
                actionConsumed = true;
                if (hoveredCard >= 0) {
                    dispatchCardClick(titleScreen, hoveredCard);
                }
            } else if (!mouseDown) {
                actionConsumed = false;
            }
            wasMouseDown = mouseDown;

            // ── Draw into Window Default Framebuffer (0) ─────────────────────
            GL30.glBindFramebuffer(GL30.GL_FRAMEBUFFER, 0);
            GL11.glViewport(0, 0, W, H);
            GL11.glDisable(GL11.GL_DEPTH_TEST);
            GL11.glDepthMask(false);
            GL11.glDisable(GL11.GL_CULL_FACE);
            GL11.glDisable(GL11.GL_SCISSOR_TEST);
            GL11.glEnable(GL11.GL_BLEND);
            GL11.glBlendFunc(GL11.GL_SRC_ALPHA, GL11.GL_ONE_MINUS_SRC_ALPHA);

            GL20.glUseProgram(quadProgram);
            GL30.glBindVertexArray(quadVao);
            GL20.glBindBuffer(GL20.GL_ARRAY_BUFFER, quadVbo);
            GL20.glEnableVertexAttribArray(0);
            GL20.glVertexAttribPointer(0, 2, GL11.GL_FLOAT, false, 8, 0);

            // 1. Fullscreen Background Quad (menu_background.jpg)
            drawQuadPx(0, 0, W, H, W, H, bgTexId, 1.0f);

            // 2. Top Bar (ELAUNCHER CORE + ENGLISH US)
            drawQuadPx(0, 0, W, 70, W, H, topBarTexId, 1.0f);

            // 3. Hero Title Logo (ELAUNCHER PROJECT)
            float logoW = Math.min(420f, W * 0.45f);
            float logoH = logoW * (128f / 512f);
            float logoX = (W - logoW) * 0.5f;
            float logoY = startY - logoH - 40f;
            drawQuadPx(logoX, logoY, logoW, logoH, W, H, logoTexId, 1.0f);

            // 4. Subtitle Pill (✦ NEXT-GEN CLIENT SHELL)
            float pillW = 210f, pillH = 26f;
            float pillX = (W - pillW) * 0.5f;
            float pillY = logoY + logoH + 8f;
            drawQuadPx(pillX, pillY, pillW, pillH, W, H, pillTexId, 1.0f);

            // 5. Four Interactive Cards
            for (int i = 0; i < 4; i++) {
                float cy = startY + i * (cardH + cardGap);
                float h = hoverAnim[i];

                // Normal state
                drawQuadPx(cardX, cy, cardW, cardH, W, H, cardTexIds[i][0], 1.0f - h);

                // Hover state
                if (h > 0.005f) {
                    drawQuadPx(cardX, cy, cardW, cardH, W, H, cardTexIds[i][1], h);
                }
            }

            // 6. Bottom Footer
            drawQuadPx(0, H - 42, W, 42, W, H, footerTexId, 1.0f);

        } finally {
            // ── 2. Strictly Restore Complete OpenGL State ────────────────────
            GL30.glBindFramebuffer(GL30.GL_FRAMEBUFFER, oldFbo);
            GL30.glBindVertexArray(oldVao);
            GL20.glBindBuffer(GL20.GL_ARRAY_BUFFER, oldVbo);
            GL13.glActiveTexture(oldActiveTex);
            GL11.glBindTexture(GL11.GL_TEXTURE_2D, oldTex);
            GL20.glUseProgram(oldProgram);
            GL11.glViewport(oldVp[0], oldVp[1], oldVp[2], oldVp[3]);

            if (wasDepth) GL11.glEnable(GL11.GL_DEPTH_TEST); else GL11.glDisable(GL11.GL_DEPTH_TEST);
            if (wasCull)  GL11.glEnable(GL11.GL_CULL_FACE);  else GL11.glDisable(GL11.GL_CULL_FACE);
            if (wasBlend) GL11.glEnable(GL11.GL_BLEND);      else GL11.glDisable(GL11.GL_BLEND);
            if (wasScissor) GL11.glEnable(GL11.GL_SCISSOR_TEST); else GL11.glDisable(GL11.GL_SCISSOR_TEST);
            GL11.glDepthMask(wasDepthMask);
        }

        return true;
    }

    private static void dispatchCardClick(Object titleScreen, int index) {
        switch (index) {
            case 0:
                MenuDispatcher.openSingleplayer(titleScreen);
                break;
            case 1:
                MenuDispatcher.openMultiplayer(titleScreen);
                break;
            case 2:
                MenuDispatcher.openSettings(titleScreen);
                break;
            case 3:
                MenuDispatcher.quitGame(titleScreen);
                break;
        }
    }

    private static void drawQuadPx(float px, float py, float pw, float ph, int winW, int winH, int texId, float alpha) {
        if (texId == 0 || alpha <= 0.001f) return;

        float ndcX = (px / winW) * 2.0f - 1.0f;
        float ndcY = 1.0f - (py / winH) * 2.0f;
        float ndcW = (pw / winW) * 2.0f;
        float ndcH = (ph / winH) * 2.0f;

        GL20.glUniform4f(u_rect, ndcX, ndcY, ndcW, ndcH);
        GL20.glUniform1f(u_alpha, alpha);
        if (u_tex >= 0) GL20.glUniform1i(u_tex, 0);
        GL13.glActiveTexture(GL13.GL_TEXTURE0);
        GL11.glBindTexture(GL11.GL_TEXTURE_2D, texId);
        GL11.glDrawArrays(GL11.GL_TRIANGLES, 0, 6);
    }

    private static int loadBackgroundTexture() {
        BufferedImage img = null;
        String bgPath = System.getProperty("elauncher.bgImage");
        if (bgPath != null) {
            try {
                File f = new File(bgPath);
                if (f.exists()) {
                    img = ImageIO.read(f);
                    System.out.println("[ELauncher Agent] Loaded bgImage: " + f.getAbsolutePath());
                }
            } catch (Exception e) {
                System.err.println("[ELauncher Agent] Failed to read bgImage: " + e);
            }
        }
        if (img == null) {
            try {
                File candidate = new File("menu_background.jpg");
                if (candidate.exists()) img = ImageIO.read(candidate);
            } catch (Exception ignored) {}
        }
        if (img == null) {
            img = new BufferedImage(1920, 1080, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = img.createGraphics();
            g.setColor(new Color(8, 10, 15));
            g.fillRect(0, 0, 1920, 1080);
            g.dispose();
        }
        return uploadTexture(img);
    }

    private static int loadLogoTexture() {
        String assets = System.getProperty("elauncher.assetsDir");
        if (assets != null) {
            try {
                File f = new File(assets, "textures/gui/title_elauncher_project.png");
                if (f.exists()) {
                    System.out.println("[ELauncher Agent] Loaded logo: " + f.getAbsolutePath());
                    return uploadTexture(ImageIO.read(f));
                }
            } catch (Exception ignored) {}
        }

        BufferedImage img = new BufferedImage(760, 128, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setQuality(g);

        g.setFont(new Font("Impact", Font.ITALIC, 68));
        FontMetrics fm = g.getFontMetrics();
        String text = "ELAUNCHER PROJECT";
        int tx = (760 - fm.stringWidth(text)) / 2;
        int ty = (128 + fm.getAscent() - fm.getDescent()) / 2;

        g.setColor(new Color(0, 0, 0, 180));
        g.drawString(text, tx + 3, ty + 3);

        g.setColor(new Color(245, 248, 255));
        g.drawString(text, tx, ty);

        g.dispose();
        return uploadTexture(img);
    }

    private static int generatePillTexture(String text) {
        BufferedImage img = new BufferedImage(420, 52, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setQuality(g);

        g.setColor(new Color(15, 20, 30, 210));
        g.fill(new RoundRectangle2D.Float(10, 4, 400, 44, 22, 22));

        g.setColor(new Color(40, 50, 75, 220));
        g.setStroke(new BasicStroke(1.5f));
        g.draw(new RoundRectangle2D.Float(10, 4, 400, 44, 22, 22));

        g.setFont(new Font("Dialog", Font.BOLD, 18));
        FontMetrics fm = g.getFontMetrics();
        int tx = (420 - fm.stringWidth(text)) / 2;
        int ty = (52 + fm.getAscent() - fm.getDescent()) / 2;

        g.setColor(new Color(148, 163, 184));
        g.drawString(text, tx, ty);

        g.dispose();
        return uploadTexture(img);
    }

    private static int generateTopBarTexture() {
        BufferedImage img = new BufferedImage(1920, 100, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setQuality(g);

        int bx = 40, by = 20, bw = 220, bh = 46;
        g.setColor(new Color(15, 17, 24, 210));
        g.fill(new RoundRectangle2D.Float(bx, by, bw, bh, 20, 20));
        g.setColor(new Color(36, 41, 56, 240));
        g.draw(new RoundRectangle2D.Float(bx, by, bw, bh, 20, 20));

        g.setColor(new Color(52, 211, 153));
        g.fillOval(bx + 18, by + 17, 12, 12);

        g.setFont(new Font("Dialog", Font.BOLD, 16));
        g.setColor(new Color(203, 213, 225));
        g.drawString("ELAUNCHER CORE", bx + 42, by + 29);

        int rx = 1920 - 40 - 240, rw = 240;
        g.setColor(new Color(15, 17, 24, 210));
        g.fill(new RoundRectangle2D.Float(rx, by, rw, bh, 20, 20));
        g.setColor(new Color(36, 41, 56, 240));
        g.draw(new RoundRectangle2D.Float(rx, by, rw, bh, 20, 20));

        g.setColor(new Color(226, 232, 240));
        g.drawString("ENGLISH (US)", rx + 30, by + 29);

        g.setColor(new Color(36, 42, 56));
        g.fillRoundRect(rx + rw - 54, by + 12, 38, 22, 8, 8);
        g.setFont(new Font("Monospaced", Font.BOLD, 13));
        g.setColor(new Color(148, 163, 184));
        g.drawString("EN", rx + rw - 44, by + 28);

        g.dispose();
        return uploadTexture(img);
    }

    private static int generateFooterTexture() {
        BufferedImage img = new BufferedImage(1920, 60, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setQuality(g);

        g.setFont(new Font("Dialog", Font.BOLD, 13));
        g.setColor(new Color(100, 116, 139, 200));

        g.drawString("ELAUNCHER UNIVERSAL WEB GUI  •  ZERO MOD DEPENDENCY", 40, 36);

        String right = "CRAFTED WITH APPLE POLISH & FRAMER EASE";
        FontMetrics fm = g.getFontMetrics();
        g.drawString(right, 1920 - 40 - fm.stringWidth(right), 36);

        g.dispose();
        return uploadTexture(img);
    }

    private static int generateCardTexture(String title, String subtitle, boolean hover) {
        int W = 960, H = 124;
        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        setQuality(g);

        if (hover) {
            g.setColor(new Color(22, 28, 43, 248));
            g.fill(new RoundRectangle2D.Float(4, 4, W - 8, H - 8, 24, 24));
            g.setColor(new Color(56, 189, 248, 240));
            g.setStroke(new BasicStroke(2.8f));
            g.draw(new RoundRectangle2D.Float(4, 4, W - 8, H - 8, 24, 24));
        } else {
            g.setColor(new Color(13, 17, 26, 220));
            g.fill(new RoundRectangle2D.Float(4, 4, W - 8, H - 8, 24, 24));
            g.setColor(new Color(36, 43, 62, 200));
            g.setStroke(new BasicStroke(1.5f));
            g.draw(new RoundRectangle2D.Float(4, 4, W - 8, H - 8, 24, 24));
        }

        int ix = 24, iy = 18, is = 88;
        g.setColor(hover ? new Color(30, 41, 62, 245) : new Color(20, 25, 38, 205));
        g.fill(new RoundRectangle2D.Float(ix, iy, is, is, 20, 20));
        g.setColor(hover ? new Color(56, 189, 248, 160) : new Color(40, 48, 70, 140));
        g.draw(new RoundRectangle2D.Float(ix, iy, is, is, 20, 20));

        g.setColor(hover ? new Color(240, 248, 255) : new Color(148, 163, 184));
        g.setStroke(new BasicStroke(3.0f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        int cx = ix + is / 2;
        int cy = iy + is / 2;

        if (title.contains("SINGLE")) {
            g.drawOval(cx - 10, cy - 16, 20, 20);
            g.drawArc(cx - 18, cy + 4, 36, 26, 0, 180);
        } else if (title.contains("MULTI")) {
            g.drawOval(cx - 16, cy - 16, 32, 32);
            g.drawLine(cx - 16, cy, cx + 16, cy);
            g.drawOval(cx - 8, cy - 16, 16, 32);
        } else if (title.contains("SETTING")) {
            g.drawOval(cx - 8, cy - 8, 16, 16);
            for (int a = 0; a < 8; a++) {
                double rad = a * Math.PI / 4.0;
                int x1 = cx + (int)(10 * Math.cos(rad));
                int y1 = cy + (int)(10 * Math.sin(rad));
                int x2 = cx + (int)(16 * Math.cos(rad));
                int y2 = cy + (int)(16 * Math.sin(rad));
                g.drawLine(x1, y1, x2, y2);
            }
        } else {
            g.drawRoundRect(cx - 15, cy - 16, 20, 32, 4, 4);
            g.drawLine(cx - 4, cy, cx + 16, cy);
            g.drawLine(cx + 10, cy - 6, cx + 16, cy);
            g.drawLine(cx + 10, cy + 6, cx + 16, cy);
        }

        g.setFont(new Font("Dialog", Font.BOLD, 32));
        g.setColor(hover ? new Color(255, 255, 255) : new Color(230, 238, 248));
        g.drawString(title, ix + is + 28, 54);

        g.setFont(new Font("Dialog", Font.PLAIN, 22));
        g.setColor(hover ? new Color(186, 215, 250) : new Color(115, 130, 155));
        g.drawString(subtitle, ix + is + 28, 90);

        g.setFont(new Font("Dialog", Font.BOLD, 36));
        g.setColor(hover ? new Color(56, 189, 248) : new Color(75, 88, 115));
        int arrowX = hover ? (W - 60) : (W - 66);
        g.drawString("→", arrowX, 72);

        g.dispose();
        return uploadTexture(img);
    }

    private static void setQuality(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
    }

    private static int uploadTexture(BufferedImage img) {
        int w = img.getWidth(), h = img.getHeight();
        int[] pixels = img.getRGB(0, 0, w, h, null, 0, w);
        ByteBuffer bb = ByteBuffer.allocateDirect(w * h * 4).order(ByteOrder.nativeOrder());
        for (int p : pixels) {
            bb.put((byte) ((p >> 16) & 0xFF)); // R
            bb.put((byte) ((p >>  8) & 0xFF)); // G
            bb.put((byte) ((p      ) & 0xFF)); // B
            bb.put((byte) ((p >> 24) & 0xFF)); // A
        }
        bb.flip();

        int id = GL11.glGenTextures();
        GL11.glBindTexture(GL11.GL_TEXTURE_2D, id);
        GL11.glTexParameteri(GL11.GL_TEXTURE_2D, GL11.GL_TEXTURE_MIN_FILTER, GL11.GL_LINEAR);
        GL11.glTexParameteri(GL11.GL_TEXTURE_2D, GL11.GL_TEXTURE_MAG_FILTER, GL11.GL_LINEAR);
        GL11.glTexParameteri(GL11.GL_TEXTURE_2D, GL11.GL_TEXTURE_WRAP_S, GL12.GL_CLAMP_TO_EDGE);
        GL11.glTexParameteri(GL11.GL_TEXTURE_2D, GL11.GL_TEXTURE_WRAP_T, GL12.GL_CLAMP_TO_EDGE);
        GL11.glTexImage2D(GL11.GL_TEXTURE_2D, 0, GL11.GL_RGBA, w, h, 0, GL11.GL_RGBA, GL11.GL_UNSIGNED_BYTE, bb);
        GL11.glBindTexture(GL11.GL_TEXTURE_2D, 0);
        return id;
    }
}
