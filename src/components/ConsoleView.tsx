import { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Download,
  Trash2,
  Copy,
  Check,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { playPalateClick } from '../utils/sound';
import type { Instance } from '../types/instance';
import type { Language } from '../utils/i18n';
import { translations } from '../utils/i18n';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  raw: string;
}

interface ConsoleViewProps {
  selectedInstance: Instance | null;
  isRunning: boolean;
  language?: Language;
  onLaunch: () => void;
  onStop?: () => void;
  logs: LogEntry[];
  rawFullLog: string;
  onClearLogs: () => void;
}

export function ConsoleView({
  selectedInstance,
  isRunning,
  language = 'en',
  onLaunch,
  onStop,
  logs,
  rawFullLog,
  onClearLogs,
}: ConsoleViewProps) {
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Automatically detect if user manually scrolled up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user is more than 60px from the bottom, pause autoScroll
    if (distanceToBottom > 60) {
      if (autoScroll) {
        setAutoScroll(false);
      }
      isUserScrolledUp.current = true;
    } else {
      isUserScrolledUp.current = false;
    }
  };

  useEffect(() => {
    if (autoScroll && !isUserScrolledUp.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleDownloadLog = () => {
    playPalateClick(0.24);
    const textToSave = rawFullLog || logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.raw}`).join('\n');
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `minecraft-log-${selectedInstance?.name || 'client'}-${dateStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLogs = () => {
    playPalateClick(0.2);
    const textToCopy = rawFullLog || logs.map((l) => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col p-6 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-5 border-b border-[#1c1f2b] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-white" />
            <h1 className="text-xl font-black uppercase tracking-wider text-white font-['Barlow_Condensed',sans-serif]">
              {t.consoleHeader}
            </h1>
          </div>
          {selectedInstance && (
            <div className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-lg bg-[#141620] border border-[#232736]">
              <span className="text-white font-bold">{selectedInstance.name}</span>
              <span className="text-[#4e556b]">•</span>
              <span className="text-[#8e96ac]">{selectedInstance.version}</span>
              <span className="text-[#4e556b]">•</span>
              <span className="text-[#a6b0c7]">{selectedInstance.loader}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="flex items-center px-3 h-9 rounded-xl bg-[#12141c] border border-[#222534] text-xs font-mono">
            <span className={isRunning ? 'text-white font-bold' : 'text-[#8b92a5]'}>
              {isRunning ? t.consoleStatusActive : t.consoleStatusIdle}
            </span>
          </div>

          <button
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            title={t.consoleCopy}
            className="h-9 px-3 rounded-xl border border-[#232736] bg-[#141620] hover:bg-[#1c1f2b] disabled:opacity-40 text-[#c0c6d6] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? t.consoleCopied : t.consoleCopy}</span>
          </button>

          <button
            onClick={handleDownloadLog}
            disabled={logs.length === 0}
            title={t.consoleDownload}
            className="h-9 px-3 rounded-xl border border-[#232736] bg-[#141620] hover:bg-[#1c1f2b] disabled:opacity-40 text-[#c0c6d6] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.consoleDownload}</span>
          </button>

          <button
            onClick={() => {
              playPalateClick(0.18);
              onClearLogs();
            }}
            disabled={logs.length === 0}
            title={t.consoleClear}
            className="w-9 h-9 rounded-xl border border-[#232736] bg-[#141620] hover:bg-[#1c1f2b] disabled:opacity-40 text-[#8b92a5] hover:text-white transition-all flex items-center justify-center cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Display Container */}
      <div className="flex-1 my-5 rounded-2xl bg-[#090b10] border border-[#1e2230] flex flex-col overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="h-9 px-4 border-b border-[#181b24] bg-[#0c0e14] flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-[#f87171]/40 shadow-[0_0_8px_rgba(239,68,68,0.35)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] border border-[#fbbf24]/40 shadow-[0_0_8px_rgba(245,158,11,0.35)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-[#34d399]/40 shadow-[0_0_8px_rgba(16,185,129,0.35)]" />
          </div>

          <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#6a7288]">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                autoScroll
                  ? 'bg-[#181b24] border-[#32384a] text-white'
                  : 'bg-[#101218] border-[#1b1f2b] text-[#636c84] hover:text-white'
              }`}
            >
              <span>{t.consoleAutoScroll}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${autoScroll ? 'text-white' : 'text-[#555d73]'}`}>
                {autoScroll ? t.consoleOn : t.consoleOff}
              </span>
            </button>
            <span className="px-2 py-0.5 rounded-md bg-[#11131a] border border-[#1b1e2a] text-[10px]">
              {logs.length}
            </span>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 select-text scroll-smooth"
        >
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#555d73] gap-2 select-none">
              <Terminal className="w-8 h-8 opacity-40" />
              <span className="text-xs">{t.consoleEmpty}</span>
            </div>
          ) : (
            logs.map((log) => {
              let levelBadgeColor = 'text-[#7e879f] bg-[#141722] border-[#222738]';
              let textColor = 'text-[#c8d0e0]';

              if (log.level === 'error') {
                levelBadgeColor = 'text-[#ff6b6b] bg-[#221417] border-[#3d1e24]';
                textColor = 'text-[#ff9494]';
              } else if (log.level === 'warn') {
                levelBadgeColor = 'text-[#c8ccd8] bg-[#1a1c26] border-[#292e3d]';
                textColor = 'text-[#d6dbe8]';
              } else if (log.level === 'success') {
                levelBadgeColor = 'text-[#ffffff] bg-[#1b222a] border-[#2c3645]';
                textColor = 'text-[#ffffff] font-medium';
              }

              return (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed group hover:bg-[#121520]/60 px-2 py-0.5 rounded transition-colors">
                  <span className="text-[#555d73] text-[11px] select-none shrink-0 font-light">
                    {log.timestamp}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border shrink-0 select-none ${levelBadgeColor}`}>
                    {log.level}
                  </span>
                  <span className={`break-all whitespace-pre-wrap ${textColor}`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Bar: Quick Launch Action & Info */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1c1f2b] shrink-0 text-xs text-[#6e758a] font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#8b9bb4]" />
          <span>{t.consoleNotice}</span>
        </div>

        {!isRunning ? (
          <button
            type="button"
            onClick={() => {
              playPalateClick(0.35);
              onLaunch();
            }}
            className="h-10 px-6 rounded-xl bg-white hover:bg-[#e4e7ee] active:scale-95 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-['Barlow_Condensed',sans-serif] shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
          >
            <Play className="w-3.5 h-3.5 fill-black stroke-black" />
            <span>{t.consoleLaunchBtn}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playPalateClick(0.24);
                onStop?.();
                setTimeout(() => onLaunch(), 800);
              }}
              title={t.consoleRestartBtn}
              className="h-10 px-4 rounded-xl bg-[#151824] hover:bg-[#1f2436] border border-[#2b334a] text-[#d0d6e8] hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.consoleRestartBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playPalateClick(0.2);
                onStop?.();
              }}
              className="h-10 px-5 rounded-xl bg-[#2a1317] hover:bg-[#3d1921] border border-[#521c25] text-[#ff5555] hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer font-mono"
            >
              <span>{t.consoleStopBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
