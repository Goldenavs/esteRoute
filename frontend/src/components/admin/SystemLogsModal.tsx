import { useState, useEffect, useRef } from 'react';
import { Terminal, X, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemLogsModal({ isOpen, onClose }: Props) {
  const [logs, setLogs] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-app-bg w-full max-w-4xl h-[70vh] flex flex-col border border-border-strong rounded-sm shadow-2xl overflow-hidden -skew-x-[2deg]">
        
        {/* Header */}
        <div className="bg-surface border-b border-border-subtle p-4 flex justify-between items-center skew-x-[2deg]">
          <div className="flex items-center gap-2 text-brand-primary">
            <Terminal className="w-5 h-5" />
            <h2 className="font-bold tracking-widest uppercase text-sm">Live Agent Logs</h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchLogs} className={`text-text-muted hover:text-brand-primary transition-colors ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-text-muted hover:text-semantic-urgent transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 bg-[#0a0a0a] p-4 overflow-y-auto font-mono text-xs md:text-sm text-green-400 skew-x-[2deg]">
          {logs ? (
            <pre className="whitespace-pre-wrap leading-relaxed">{logs}</pre>
          ) : (
            <div className="text-text-muted italic">Waiting for agent transactions...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
