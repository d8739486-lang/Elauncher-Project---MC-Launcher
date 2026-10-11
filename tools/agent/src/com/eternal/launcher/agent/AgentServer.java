package com.eternal.launcher.agent;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.lwjgl.system.windows.User32;
import org.lwjgl.system.windows.WINDOWPLACEMENT;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;

/**
 * AgentServer — Lightweight zero-dependency embedded HTTP server.
 * Bridges Minecraft runtime state (window bounds, title screen status)
 * with the ELauncher Electron overlay.
 */
public final class AgentServer {

    private static HttpServer server = null;
    private static int port = 0;

    public static synchronized void start() {
        if (server != null) return;

        int[] tryPorts = new int[]{28751, 28752, 28753, 0};
        for (int p : tryPorts) {
            try {
                server = HttpServer.create(new InetSocketAddress("127.0.0.1", p), 0);
                port = server.getAddress().getPort();
                break;
            } catch (Throwable ignored) {}
        }

        if (server == null) {
            System.err.println("[ELauncher Agent] Failed to bind local HTTP server.");
            return;
        }

        server.setExecutor(Executors.newCachedThreadPool(r -> {
            Thread t = new Thread(r, "ELauncher-AgentBridge-Worker");
            t.setDaemon(true);
            return t;
        }));

        server.createContext("/status", new StatusHandler());
        server.createContext("/action", new ActionHandler());
        server.createContext("/attach", new AttachHandler());
        server.start();

        System.out.println("[ELauncher Agent] IPC bridge listening on http://127.0.0.1:" + port);
        recordBridgeInfo(port);
    }

    public static int getPort() {
        return port;
    }

    private static void recordBridgeInfo(int p) {
        try {
            String appData = System.getenv("APPDATA");
            File baseDir;
            if (appData != null && !appData.isEmpty()) {
                baseDir = new File(appData, "ELauncher");
            } else {
                baseDir = new File(System.getProperty("user.home"), ".elauncher");
            }
            if (!baseDir.exists()) {
                baseDir.mkdirs();
            }
            File bridgeFile = new File(baseDir, "agent-bridge.json");
            long pid = 0;
            try {
                pid = ProcessHandle.current().pid();
            } catch (Throwable ignored) {}

            String json = String.format("{\"port\":%d,\"pid\":%d,\"time\":%d}", p, pid, System.currentTimeMillis());
            try (FileWriter fw = new FileWriter(bridgeFile)) {
                fw.write(json);
            }
        } catch (Throwable t) {
            System.err.println("[ELauncher Agent] Warning: could not write agent-bridge.json: " + t.getMessage());
        }
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            boolean inMenu = MenuState.isInTitleScreen();
            int x = MenuState.winX;
            int y = MenuState.winY;
            int w = MenuState.winWidth;
            int h = MenuState.winHeight;
            boolean focused = MenuState.winFocused;
            boolean iconified = MenuState.winIconified;
            boolean visible = MenuState.winVisible;

            // Query live Win32 window state directly on HTTP thread
            long hwnd = MenuState.minecraftHwnd;
            if (hwnd != 0) {
                try {
                    if (User32.IsIconic(hwnd) || !User32.IsWindowVisible(hwnd)) {
                        iconified = true;
                        visible = false;
                    }

                    WINDOWPLACEMENT wp = WINDOWPLACEMENT.calloc();
                    wp.length(WINDOWPLACEMENT.SIZEOF);
                    if (User32.GetWindowPlacement(hwnd, wp)) {
                        int showCmd = wp.showCmd();
                        if (showCmd == 2 || showCmd == 6 || showCmd == 7) {
                            iconified = true;
                        }
                    }
                    wp.free();
                } catch (Throwable ignored) {}
            }

            String response = String.format(
                "{\"inMenu\":%b,\"x\":%d,\"y\":%d,\"w\":%d,\"h\":%d,\"focused\":%b,\"minimized\":%b,\"visible\":%b,\"mcHwnd\":\"%d\"}",
                inMenu, x, y, w, h, focused, iconified, visible, hwnd
            );

            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    private static class AttachHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String body = "";
            try (InputStream is = exchange.getRequestBody()) {
                body = new String(is.readAllBytes(), StandardCharsets.UTF_8).trim();
            }

            long overlayHwnd = 0;
            try {
                if (body.contains("\"overlayHwnd\"")) {
                    int idx = body.indexOf("\"overlayHwnd\"");
                    int colon = body.indexOf(':', idx);
                    int start = colon + 1;
                    while (start < body.length() && (body.charAt(start) == ' ' || body.charAt(start) == '"')) start++;
                    int end = start;
                    while (end < body.length() && Character.isDigit(body.charAt(end))) end++;
                    overlayHwnd = Long.parseLong(body.substring(start, end));
                }
            } catch (Throwable ignored) {}

            boolean attached = false;
            long mcHwnd = MenuState.minecraftHwnd;
            if (mcHwnd != 0 && overlayHwnd != 0) {
                try {
                    // Set overlay window's owner to Minecraft's HWND (GWLP_HWNDPARENT = -8)
                    User32.SetWindowLongPtr(overlayHwnd, -8, mcHwnd);
                    attached = true;
                    System.out.println("[ELauncher Agent] Native attachment: overlay " + overlayHwnd + " is now owned by Minecraft " + mcHwnd);
                } catch (Throwable t) {
                    System.err.println("[ELauncher Agent] Failed to attach overlay window: " + t);
                }
            }

            String response = String.format("{\"success\":%b,\"mcHwnd\":\"%d\"}", attached, mcHwnd);
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    private static class ActionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }

            String body = "";
            try (InputStream is = exchange.getRequestBody()) {
                body = new String(is.readAllBytes(), StandardCharsets.UTF_8).trim();
            }

            String action = "";
            if (body.contains("\"action\"")) {
                int idx = body.indexOf("\"action\"");
                int colon = body.indexOf(':', idx);
                if (colon != -1) {
                    int quote1 = body.indexOf('"', colon);
                    int quote2 = body.indexOf('"', quote1 + 1);
                    if (quote1 != -1 && quote2 != -1) {
                        action = body.substring(quote1 + 1, quote2);
                    }
                }
            } else {
                action = body;
            }

            if (!action.isEmpty()) {
                System.out.println("[ELauncher Agent] Queued action from IPC: " + action);
                if ("custom".equalsIgnoreCase(action) || "restore_custom".equalsIgnoreCase(action)) {
                    System.setProperty("elauncher.active", "true");
                    MenuState.inGameSession = false;
                    MenuState.hideMinecraftWindow();
                } else {
                    MenuState.pendingAction = action;
                }
            }

            byte[] bytes = "{\"success\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }
}
