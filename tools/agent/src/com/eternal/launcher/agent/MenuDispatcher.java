package com.eternal.launcher.agent;

import org.lwjgl.glfw.GLFW;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.List;

/**
 * MenuDispatcher — Version-agnostic Minecraft Screen Navigation.
 *
 * Uses deep reflection to read Component texts, translation keys,
 * and button onPress callbacks across all Minecraft versions.
 */
public final class MenuDispatcher {

    private MenuDispatcher() {}

    public static void openSingleplayer(Object titleScreen) {
        System.out.println("[ELauncher Agent] Opening Singleplayer...");
        if (triggerButtonByKeyword(titleScreen, "singleplayer", "menu.singleplayer", "одиночн")) {
            MenuState.onActionCompleted();
            return;
        }
        invokeMethodFallback(titleScreen, new String[]{"b", "method_19857"});
        MenuState.onActionCompleted();
    }

    public static void openMultiplayer(Object titleScreen) {
        System.out.println("[ELauncher Agent] Opening Multiplayer...");
        if (triggerButtonByKeyword(titleScreen, "multiplayer", "menu.multiplayer", "сетев")) {
            MenuState.onActionCompleted();
            return;
        }
        invokeMethodFallback(titleScreen, new String[]{"d", "method_19859"});
        MenuState.onActionCompleted();
    }

    public static void openSettings(Object titleScreen) {
        System.out.println("[ELauncher Agent] Opening Settings...");
        if (triggerButtonByKeyword(titleScreen, "options", "menu.options", "настройк")) {
            MenuState.onActionCompleted();
            return;
        }
        invokeMethodFallback(titleScreen, new String[]{"g", "method_19860"});
        MenuState.onActionCompleted();
    }

    public static void openLanguage(Object titleScreen) {
        System.out.println("[ELauncher Agent] Opening Language...");
        if (triggerButtonByKeyword(titleScreen, "language", "narrator.button.language", "язык")) {
            MenuState.onActionCompleted();
            return;
        }
        invokeMethodFallback(titleScreen, new String[]{"i", "method_19861"});
        MenuState.onActionCompleted();
    }

    public static void quitGame(Object titleScreen) {
        System.out.println("[ELauncher Agent] Quitting Game...");
        try {
            long win = GLFW.glfwGetCurrentContext();
            if (win != 0) {
                GLFW.glfwSetWindowShouldClose(win, true);
            }
        } catch (Throwable ignored) {}

        if (triggerButtonByKeyword(titleScreen, "quit", "menu.quit", "выйти")) {
            MenuState.onActionCompleted();
            return;
        }
        invokeMethodFallback(titleScreen, new String[]{"h", "method_19862"});
        MenuState.onActionCompleted();
    }

    /**
     * Scans titleScreen's widget lists and triggers the button matching keywords.
     */
    private static boolean triggerButtonByKeyword(Object titleScreen, String... keywords) {
        if (titleScreen == null) return false;

        Class<?> clazz = titleScreen.getClass();
        while (clazz != null && clazz != Object.class) {
            for (Field f : clazz.getDeclaredFields()) {
                if (List.class.isAssignableFrom(f.getType())) {
                    try {
                        f.setAccessible(true);
                        List<?> list = (List<?>) f.get(titleScreen);
                        if (list == null) continue;

                        for (Object item : list) {
                            if (item == null) continue;
                            String text = extractWidgetText(item);

                            boolean matches = false;
                            for (String kw : keywords) {
                                if (text.contains(kw.toLowerCase())) {
                                    matches = true;
                                    break;
                                }
                            }

                            if (matches) {
                                if (pressWidget(item)) {
                                    System.out.println("[ELauncher Agent] Successfully triggered button: "
                                            + item.getClass().getSimpleName() + " (text: " + text.trim() + ")");
                                    return true;
                                }
                            }
                        }
                    } catch (Throwable ignored) {}
                }
            }
            clazz = clazz.getSuperclass();
        }
        return false;
    }

    /**
     * Extracts all text representations from a widget (Component, string, toString, translatable keys).
     */
    private static String extractWidgetText(Object item) {
        if (item == null) return "";
        StringBuilder sb = new StringBuilder();
        sb.append(item.toString()).append(" ");

        Class<?> c = item.getClass();
        while (c != null && c != Object.class) {
            // Check methods like getMessage(), B(), getText()
            for (Method m : c.getDeclaredMethods()) {
                if (m.getParameterCount() == 0) {
                    String mName = m.getName();
                    if (mName.equals("getMessage") || mName.equals("B") || mName.equals("getText") || mName.equals("q")) {
                        try {
                            m.setAccessible(true);
                            Object res = m.invoke(item);
                            if (res != null) {
                                appendComponentText(res, sb);
                            }
                        } catch (Throwable ignored) {}
                    }
                }
            }

            // Check declared fields for Component or String
            for (Field f : c.getDeclaredFields()) {
                try {
                    f.setAccessible(true);
                    Object val = f.get(item);
                    if (val != null) {
                        appendComponentText(val, sb);
                    }
                } catch (Throwable ignored) {}
            }
            c = c.getSuperclass();
        }

        return sb.toString().toLowerCase();
    }

    private static void appendComponentText(Object comp, StringBuilder sb) {
        if (comp == null) return;
        if (comp instanceof String) {
            sb.append((String) comp).append(" ");
            return;
        }

        // Try getString() on Minecraft Component
        try {
            Method mStr = comp.getClass().getMethod("getString");
            mStr.setAccessible(true);
            Object s = mStr.invoke(comp);
            if (s != null) sb.append(s.toString()).append(" ");
        } catch (Throwable ignored) {}

        // Inspect Component contents for translation keys (e.g. menu.singleplayer)
        Class<?> cc = comp.getClass();
        while (cc != null && cc != Object.class) {
            for (Field f : cc.getDeclaredFields()) {
                try {
                    f.setAccessible(true);
                    Object v = f.get(comp);
                    if (v instanceof String) {
                        sb.append((String) v).append(" ");
                    } else if (v != null && v != comp) {
                        String ts = v.toString();
                        if (ts.contains("menu.") || ts.contains("options") || ts.contains("quit")) {
                            sb.append(ts).append(" ");
                        }
                    }
                } catch (Throwable ignored) {}
            }
            cc = cc.getSuperclass();
        }
    }

    /**
     * Invokes onPress, onClick or callback on a widget, traversing class hierarchy.
     */
    private static boolean pressWidget(Object widget) {
        Class<?> curr = widget.getClass();
        while (curr != null && curr != Object.class) {
            // 1. Check declared callback fields (like onPress consumer / Runnable / gje$c)
            for (Field f : curr.getDeclaredFields()) {
                try {
                    f.setAccessible(true);
                    Object callback = f.get(widget);
                    if (callback != null && callback != widget) {
                        Class<?> cbClass = callback.getClass();
                        for (Method cm : cbClass.getDeclaredMethods()) {
                            cm.setAccessible(true);
                            if (cm.getParameterCount() == 1) {
                                cm.invoke(callback, widget);
                                return true;
                            } else if (cm.getParameterCount() == 0) {
                                cm.invoke(callback);
                                return true;
                            }
                        }
                    }
                } catch (Throwable ignored) {}
            }

            // 2. Check declared methods on widget itself
            for (Method m : curr.getDeclaredMethods()) {
                String mName = m.getName();
                if (mName.equals("onPress") || mName.equals("onClick") || mName.equals("b") || mName.equals("a")) {
                    try {
                        m.setAccessible(true);
                        if (m.getParameterCount() == 0) {
                            m.invoke(widget);
                            return true;
                        } else if (m.getParameterCount() == 1) {
                            m.invoke(widget, widget);
                            return true;
                        }
                    } catch (Throwable ignored) {}
                }
            }

            curr = curr.getSuperclass();
        }

        return false;
    }

    private static void invokeMethodFallback(Object titleScreen, String[] methodNames) {
        for (String mName : methodNames) {
            Class<?> curr = titleScreen.getClass();
            while (curr != null && curr != Object.class) {
                for (Method m : curr.getDeclaredMethods()) {
                    if (m.getName().equals(mName)) {
                        try {
                            m.setAccessible(true);
                            if (m.getParameterCount() == 0) {
                                m.invoke(titleScreen);
                                return;
                            } else if (m.getParameterCount() == 1) {
                                m.invoke(titleScreen, new Object[]{null});
                                return;
                            }
                        } catch (Throwable ignored) {}
                    }
                }
                curr = curr.getSuperclass();
            }
        }
    }
}
