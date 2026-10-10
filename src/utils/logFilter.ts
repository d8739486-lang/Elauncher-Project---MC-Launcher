import type { LogEntry } from '../components/ConsoleView';

/**
 * Parses and formats raw Minecraft / Java / Launcher logs for the Console tab.
 * Preserves the full, real log message without suppressing or substituting text,
 * so the user can inspect errors, mod loading, and full diagnostic information.
 */
export function filterMinecraftLog(rawLine: string): { cleanMessage: string; level: LogEntry['level']; shouldShow: boolean } {
  const trimmed = rawLine.trim();
  if (!trimmed) {
    return { cleanMessage: '', level: 'info', shouldShow: false };
  }

  // Filter out normal pirated/offline client warnings & realms errors that clutter the console
  if (
    /could not authorize you against Realms/i.test(trimmed) ||
    /Couldn't connect to realms/i.test(trimmed) ||
    /Failed to fetch Realms feature flags/i.test(trimmed) ||
    /Realms authentication error/i.test(trimmed) ||
    /Realms (?:Client|Notification|Availability)/i.test(trimmed) ||
    /com\.mojang\.realmsclient/i.test(trimmed)
  ) {
    return { cleanMessage: '', level: 'info', shouldShow: false };
  }

  // Determine severity level based on log content
  let level: LogEntry['level'] = 'info';
  if (/(?:^|[\s\[\/])INFO(?:[\s\]:]|$)/i.test(trimmed)) {
    level = 'info';
  } else if (/WARN|Warning/i.test(trimmed)) {
    level = 'warn';
  } else if (/ERROR|FATAL|\bException\b|\bCrash\b|Caused by:/i.test(trimmed)) {
    level = 'error';
  } else if (/\b(Done|Ready|Successfully)\b/i.test(trimmed)) {
    level = 'success';
  }

  // Strip leading [HH:MM:SS] if present from Minecraft's log4j file format,
  // since ConsoleView already renders its own localized timestamp column.
  const cleanMessage = trimmed.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '');

  return {
    cleanMessage,
    level,
    shouldShow: true,
  };
}

/**
 * Helper to produce timestamp string HH:MM:SS
 */
export function getCurrentTimeFormatted(): string {
  const now = new Date();
  return [
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0'),
    now.getSeconds().toString().padStart(2, '0'),
  ].join(':');
}
