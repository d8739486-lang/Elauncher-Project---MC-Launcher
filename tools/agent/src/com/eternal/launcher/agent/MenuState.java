package com.eternal.launcher.agent;

import org.lwjgl.glfw.GLFW;
import org.lwjgl.glfw.GLFWNativeWin32;
import org.lwjgl.system.windows.POINT;
import org.lwjgl.system.windows.User32;
import org.lwjgl.system.windows.WINDOWPLACEMENT;

/**
 * Shared volatile state bridge between Minecraft hooks, AgentServer, and GLFW.
 * Tracks precise client-area screen coordinates and window visibility states.
 */
public final class MenuState {

    private MenuState() {
    }

    public static volatile Object activeTitleScreen = null;
    public static volatile long lastTitleScreenTick = 0;
    public static volatile int framesSinceTitleScreen = 0;
    public static volatile String pendingAction = null;

    // Window metrics updated on Minecraft's render thread
    public static volatile long minecraftHwnd = 0;
    public static volatile int winX = 0;
    public static volatile int winY = 0;
    public static volatile int winWidth = 854;
    public static volatile int winHeight = 480;
    public static volatile boolean winFocused = true;
    public static volatile boolean winIconified = false;
    public static volatile boolean winVisible = true;

    private static long lastMetricsPoll = 0;

    public static void onTitleScreenTick(Object titleScreen) {
        activeTitleScreen = titleScreen;
        lastTitleScreenTick = System.currentTimeMillis();

        String action = pendingAction;
        if (action != null) {
            pendingAction = null;
            dispatchAction(titleScreen, action);
        }
    }

    public static boolean isInTitleScreen() {
        return (System.currentTimeMillis() - lastTitleScreenTick) < 300;
    }

    public static void onActionCompleted() {
        pendingAction = null;
    }

    public static void updateWindowMetrics(int x, int y, int w, int h, boolean focused, boolean iconified,
            boolean visible) {
        winX = x;
        winY = y;
        winWidth = Math.max(100, w);
        winHeight = Math.max(100, h);
        winFocused = focused;
        winIconified = iconified;
        winVisible = visible;
    }

    public static void onRenderFrame() {
        long now = System.currentTimeMillis();
        // Poll window metrics at ~60Hz
        if (now - lastMetricsPoll < 16)
            return;
        lastMetricsPoll = now;

        try {
            long win = GLFW.glfwGetCurrentContext();
            if (win == 0)
                return;

            // 1. Client area size from GLFW
            int[] pw = new int[1];
            int[] ph = new int[1];
            GLFW.glfwGetWindowSize(win, pw, ph);

            // 2. Base GLFW window position
            int[] px = new int[1];
            int[] py = new int[1];
            GLFW.glfwGetWindowPos(win, px, py);

            boolean focused = GLFW.glfwGetWindowAttrib(win, GLFW.GLFW_FOCUSED) == GLFW.GLFW_TRUE;
            boolean iconified = GLFW.glfwGetWindowAttrib(win, GLFW.GLFW_ICONIFIED) == GLFW.GLFW_TRUE;
            boolean visible = GLFW.glfwGetWindowAttrib(win, GLFW.GLFW_VISIBLE) == GLFW.GLFW_TRUE;

            // 3. Exact Win32 client area coordinates & minimized check
            int clientX = px[0];
            int clientY = py[0];
            int clientW = pw[0];
            int clientH = ph[0];

            try {
                long hwnd = GLFWNativeWin32.glfwGetWin32Window(win);
                if (hwnd != 0) {
                    minecraftHwnd = hwnd;
                    // Check if window is minimized (iconic) via Win32 placement
                    WINDOWPLACEMENT wp = WINDOWPLACEMENT.calloc();
                    wp.length(WINDOWPLACEMENT.SIZEOF);
                    if (User32.GetWindowPlacement(hwnd, wp)) {
                        int showCmd = wp.showCmd();
                        // SW_SHOWMINIMIZED = 2, SW_MINIMIZE = 6, SW_SHOWMINNOACTIVE = 7
                        if (showCmd == 2 || showCmd == 6 || showCmd == 7) {
                            iconified = true;
                        }
                    }
                    wp.free();

                    if (!User32.IsWindowVisible(hwnd)) {
                        visible = false;
                    }

                    // Convert client (0, 0) to exact screen coordinates
                    POINT pt = POINT.calloc();
                    pt.x(0);
                    pt.y(0);
                    if (User32.ClientToScreen(hwnd, pt)) {
                        clientX = pt.x();
                        clientY = pt.y();
                    }
                    pt.free();
                }
            } catch (Throwable ignored) {
            }

            updateWindowMetrics(clientX, clientY, clientW, clientH, focused, iconified, visible);
        } catch (Throwable ignored) {
        }
    }

    private static void dispatchAction(Object titleScreen, String action) {
        System.out.println("[ELauncher Agent] Executing action on TitleScreen: " + action);
        try {
            if ("singleplayer".equalsIgnoreCase(action)) {
                MenuDispatcher.openSingleplayer(titleScreen);
            } else if ("multiplayer".equalsIgnoreCase(action)) {
                MenuDispatcher.openMultiplayer(titleScreen);
            } else if ("settings".equalsIgnoreCase(action)) {
                MenuDispatcher.openSettings(titleScreen);
            } else if ("language".equalsIgnoreCase(action)) {
                MenuDispatcher.openLanguage(titleScreen);
            } else if ("quit".equalsIgnoreCase(action)) {
                MenuDispatcher.quitGame(titleScreen);
            }
        } catch (Throwable t) {
            System.err.println("[ELauncher Agent] Error executing action " + action + ": " + t);
        }
    }
}
