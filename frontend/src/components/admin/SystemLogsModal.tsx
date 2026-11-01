import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  X, 
  RefreshCw, 
  Search, 
  Copy, 
  Check, 
  ArrowDown, 
  Code, 
  ListFilter,
  ShieldAlert, 
  CloudRain, 
  Bot, 
  UserCheck, 
  CheckCircle2,
  Terminal,
  Clock
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';
import BorderBeam from '../common/BorderBeam';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export interface ParsedLog {
  id: string;
  raw: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  tag: string | null;
  message: string;
  category: 'triage' | 'weather' | 'alert' | 'user' | 'system';
}

function parseLogLine(line: string, index: number): ParsedLog {
  // Matches: "YYYY-MM-DD HH:MM:SS - [LEVEL] - [TAG] MESSAGE" or "YYYY-MM-DD HH:MM:SS - [LEVEL] - MESSAGE"
  const match = line.match(/^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+-\s+\[(.*?)\]\s+-\s+(?:\[(.*?)\]\s+)?(.*)$/);

  if (match) {
    const [, timestamp, level, tag, message] = match;
    const msg = message || tag || '';
    const cleanTag = message ? tag : null;

    let category: ParsedLog['category'] = 'system';
    const lower = line.toLowerCase();
    if (lower.includes('spoof') || lower.includes('fail') || lower.includes('error') || lower.includes('manual review')) {
      category = 'alert';
    } else if (lower.includes('meteorological') || lower.includes('weather') || lower.includes('rain') || lower.includes('rpi')) {
      category = 'weather';
    } else if (lower.includes('triage') || lower.includes('vision') || lower.includes('pipeline') || lower.includes('priority')) {
      category = 'triage';
    } else if (lower.includes('submitted') || lower.includes('re-assessment') || lower.includes('dispatch')) {
      category = 'user';
    }

    return {
      id: `${index}-${timestamp}`,
      raw: line,
      timestamp,
      level: (level?.toUpperCase() === 'ERROR' ? 'ERROR' : level?.toUpperCase() === 'WARN' ? 'WARN' : 'INFO'),
      tag: cleanTag,
      message: msg,
      category,
    };
  }

  // Fallback for custom or multi-line entries
  return {
    id: `raw-${index}`,
    raw: line,
    timestamp: '',
    level: 'INFO',
    tag: null,
    message: line,
    category: 'system',
  };
}

export default function SystemLogsModal({ isOpen, onClose }: Props) {
  const [logs, setLogs] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'triage' | 'alert' | 'user' | 'weather'>('all');
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
  const [isCopied, setIsCopied] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${API_URL}/api/logs`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || '');
      }
    } catch (e) {
      console.error('Failed to fetch system logs:', e);
    } finally {
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchLogs();
      const interval = setInterval(() => {
        void fetchLogs();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchLogs]);

  // Parse lines into structured log records
  const parsedLogs = useMemo(() => {
    if (!logs) return [];
    return logs
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((line, idx) => parseLogLine(line, idx));
  }, [logs]);

  // Filter logs by active category and search keyword
  const filteredLogs = useMemo(() => {
    let result = parsedLogs;

    if (activeCategory !== 'all') {
      result = result.filter(log => log.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(log => 
        log.raw.toLowerCase().includes(q) ||
        (log.tag && log.tag.toLowerCase().includes(q)) ||
        log.message.toLowerCase().includes(q)
      );
    }

    return result;
  }, [parsedLogs, activeCategory, searchQuery]);

  // Handle auto-scroll to bottom on new logs if enabled
  useEffect(() => {
    if (isOpen && isAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isOpen, isAutoScroll, viewMode]);

  const handleCopyLogs = async () => {
    if (!logs) return;
    try {
      await navigator.clipboard.writeText(logs);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 font-sans">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 320 }}
            className="relative z-10 w-full max-w-5xl h-[86dvh] flex flex-col bg-surface/95 border-2 border-brand-primary/50 backdrop-blur-2xl rounded-lg shadow-2xl overflow-hidden -skew-x-1 sm:-skew-x-2"
          >
            <BorderBeam delay={0} color="#38BDF8" />
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-border-subtle bg-surface-subtle/90 flex flex-wrap items-center justify-between gap-3 skew-x-1 sm:skew-x-2 relative z-20">
              
              {/* Left Brand & Title */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-sm bg-brand-primary/10 border border-brand-primary/25 text-brand-primary shadow-xs">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-black text-sm sm:text-base tracking-wider uppercase text-text-primary">
                      Agent Activity & Audit Logs
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      Live Stream
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted font-sans">
                    Autonomous Vision, Meteorological & Dispatch Pipeline Telemetry
                  </p>
                </div>
              </div>

              {/* Right Modal Actions */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-app-bg/80 border border-border-subtle rounded-sm p-0.5 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setViewMode('structured')}
                    className={twMerge(
                      "px-2.5 py-1 rounded-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px]",
                      viewMode === 'structured'
                        ? "bg-brand-primary text-white shadow-xs"
                        : "text-text-muted hover:text-text-primary"
                    )}
                    title="Structured Event Timeline View"
                  >
                    <ListFilter className="w-3 h-3" />
                    <span className="hidden sm:inline">Timeline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('raw')}
                    className={twMerge(
                      "px-2.5 py-1 rounded-xs flex items-center gap-1.5 transition-all cursor-pointer font-bold uppercase tracking-wider text-[10px]",
                      viewMode === 'raw'
                        ? "bg-brand-primary text-white shadow-xs"
                        : "text-text-muted hover:text-text-primary"
                    )}
                    title="Raw Monospace Console View"
                  >
                    <Code className="w-3 h-3" />
                    <span className="hidden sm:inline">Raw</span>
                  </button>
                </div>

                {/* Copy All Logs */}
                <button
                  type="button"
                  onClick={handleCopyLogs}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-sm bg-surface hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Copy complete log buffer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline text-emerald-400 text-[10px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Copy</span>
                    </>
                  )}
                </button>

                {/* Manual Refresh */}
                <button
                  type="button"
                  onClick={() => void fetchLogs(true)}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-sm bg-surface hover:bg-surface-subtle border border-border-subtle text-text-muted hover:text-brand-primary transition-all cursor-pointer shadow-2xs"
                  title="Refresh logs from server"
                >
                  <RefreshCw className={twMerge("w-3.5 h-3.5", isRefreshing && "animate-spin text-brand-primary")} />
                </button>

                {/* Close Dialog */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-sm bg-surface hover:bg-semantic-urgent/20 border border-border-subtle hover:border-semantic-urgent/40 text-text-muted hover:text-semantic-urgent transition-colors cursor-pointer shadow-2xs"
                  aria-label="Close logs dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Filter & Search Toolbar */}
            <div className="px-4 sm:px-6 py-2.5 bg-surface/70 border-b border-border-subtle/80 flex flex-wrap items-center justify-between gap-2.5 skew-x-1 sm:skew-x-2 relative z-10">
              
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                {[
                  { id: 'all', label: 'All Events', count: parsedLogs.length },
                  { id: 'triage', label: 'AI Triage', count: parsedLogs.filter(l => l.category === 'triage').length },
                  { id: 'alert', label: 'Quarantines & Alerts', count: parsedLogs.filter(l => l.category === 'alert').length },
                  { id: 'user', label: 'Dispatches & Admin', count: parsedLogs.filter(l => l.category === 'user').length },
                  { id: 'weather', label: 'Meteorology', count: parsedLogs.filter(l => l.category === 'weather').length },
                ].map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
                      className={twMerge(
                        "px-2 sm:px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 border",
                        isSelected
                          ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-xs ring-1 ring-brand-primary/30"
                          : "bg-surface/60 border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong"
                      )}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center min-w-[200px] sm:min-w-[260px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by ref#, ID, or text..."
                  className="w-full bg-app-bg/80 border border-border-subtle focus:border-brand-primary text-text-primary text-xs pl-8 pr-7 py-1 rounded-sm outline-none transition-colors font-mono placeholder:text-text-muted/60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-text-muted hover:text-text-primary cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

            </div>

            {/* Modal Body: Structured Timeline or Raw View */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 skew-x-1 sm:skew-x-2 bg-app-bg/60"
            >
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-border-subtle rounded-sm bg-surface/30">
                  <Terminal className="w-10 h-10 text-text-muted opacity-40 mb-3" />
                  <p className="font-heading font-bold uppercase text-xs tracking-wider text-text-secondary">
                    {searchQuery || activeCategory !== 'all' ? 'No Matching Log Transactions' : 'No Transactions Recorded'}
                  </p>
                  <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">
                    {searchQuery 
                      ? `No telemetry logs match "${searchQuery}". Clear your search or change the category filter.`
                      : 'The multi-agent pipeline is idle. Submitted reports or manual re-assessments will stream here in real time.'}
                  </p>
                  {(searchQuery || activeCategory !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                      className="mt-3 text-xs font-mono font-bold text-brand-primary hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : viewMode === 'structured' ? (
                /* Structured Timeline View */
                <div className="space-y-2">
                  {filteredLogs.map((log) => {
                    const isAlert = log.category === 'alert';
                    const isWeather = log.category === 'weather';
                    const isUser = log.category === 'user';
                    const isTriage = log.category === 'triage';

                    // Pick visual badge
                    let badgeBg = "bg-surface-subtle text-text-secondary border-border-subtle";
                    let badgeLabel = "INFO";
                    let IconComponent = Bot;

                    if (isAlert) {
                      badgeBg = "bg-amber-500/15 border-amber-500/40 text-amber-400";
                      badgeLabel = log.message.includes('SPOOF') ? "SPOOF DETECTED" : "MANUAL REVIEW";
                      IconComponent = ShieldAlert;
                    } else if (isWeather) {
                      badgeBg = "bg-sky-500/15 border-sky-500/40 text-sky-400";
                      badgeLabel = "WEATHER";
                      IconComponent = CloudRain;
                    } else if (isUser) {
                      badgeBg = "bg-purple-500/15 border-purple-500/40 text-purple-400";
                      badgeLabel = log.message.includes('Re-assessment') ? "RE-ASSESS" : "SUBMISSION";
                      IconComponent = UserCheck;
                    } else if (isTriage) {
                      if (log.message.includes('Pipeline Complete')) {
                        badgeBg = "bg-emerald-500/15 border-emerald-500/40 text-emerald-400";
                        badgeLabel = "COMPLETE";
                        IconComponent = CheckCircle2;
                      } else {
                        badgeBg = "bg-brand-primary/15 border-brand-primary/40 text-brand-primary";
                        badgeLabel = "PIPELINE";
                        IconComponent = Bot;
                      }
                    }

                    return (
                      <div
                        key={log.id}
                        className={twMerge(
                          "p-3 rounded-sm border transition-all duration-150 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5",
                          isAlert 
                            ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60" 
                            : "bg-surface/85 border-border-subtle hover:border-brand-primary/40 hover:bg-surface"
                        )}
                      >
                        {/* Event Left / Content */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className={twMerge("p-1.5 rounded-sm border shrink-0 mt-0.5", badgeBg)}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex flex-col min-w-0 flex-1">
                            {/* Meta Bar */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={twMerge("px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider border", badgeBg)}>
                                {badgeLabel}
                              </span>

                              {log.tag && (
                                <span className="font-mono text-[10px] text-brand-primary bg-brand-primary/10 border border-brand-primary/25 px-1.5 py-0.5 rounded-xs truncate max-w-[220px]">
                                  {log.tag}
                                </span>
                              )}

                              {log.timestamp && (
                                <span className="text-[10px] font-mono text-text-muted flex items-center gap-1 ml-auto">
                                  <Clock className="w-3 h-3 text-text-muted/60" />
                                  <span>{log.timestamp}</span>
                                </span>
                              )}
                            </div>

                            {/* Message */}
                            <p className="text-xs text-text-primary leading-relaxed font-sans select-text">
                              {log.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              ) : (
                /* Raw Monospace Console View (Formatted with dark surface theme matching esteRoute) */
                <div className="bg-[#0b1322] border border-border-strong/60 p-4 rounded-sm font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
                  <pre className="whitespace-pre-wrap select-text">{logs}</pre>
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-2.5 bg-surface-subtle border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted skew-x-1 sm:skew-x-2 relative z-20">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-text-primary">{filteredLogs.length}</strong> of {parsedLogs.length} events
                </span>
                <span className="hidden sm:inline text-border-subtle">|</span>
                <span className="hidden sm:inline">
                  Polling backend <code className="text-brand-primary">/api/logs</code>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoScroll(prev => !prev)}
                  className={twMerge(
                    "px-2 py-0.5 rounded-xs border text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer",
                    isAutoScroll 
                      ? "bg-brand-primary/15 border-brand-primary/40 text-brand-primary" 
                      : "bg-surface border-border-subtle text-text-muted hover:text-text-primary"
                  )}
                  title={isAutoScroll ? "Disable automatic scroll to latest events" : "Enable automatic scroll to latest events"}
                >
                  Auto-Scroll: {isAutoScroll ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="flex items-center gap-1 px-2 py-0.5 bg-surface hover:bg-surface-subtle border border-border-subtle text-text-secondary hover:text-text-primary rounded-xs text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                  title="Scroll to latest entry"
                >
                  <ArrowDown className="w-3 h-3 text-brand-primary" />
                  <span>Bottom</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
