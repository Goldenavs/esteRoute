import { useEffect, useState, useMemo } from 'react';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  X, 
  MapPin, 
  Trash2, 
  ShieldAlert, 
  FileText, 
  CheckCircle, 
  Layers, 
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../../lib/supabase';

interface ArchiveReportRow {
  report_id: string;
  tracking_reference: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  priority_score: number | null;
  needs_human_review?: boolean;
  citizen_notes?: string;
  image_url?: string;
  created_at: string;
}

interface AgentResultRow {
  report_id: string;
  agent_type: string;
  result_json: {
    rationale?: string;
    confidence?: string;
    waste_categories?: string[];
    blockage_severity_score?: number;
    rain_probability_index?: number;
    expected_total_precipitation_mm?: number;
  };
}

export interface EnrichedArchiveReport extends ArchiveReportRow {
  formattedDate: string;
  formattedTime: string;
  location: string;
  categories: string[];
  primaryCategory: string;
  agentDetails?: AgentResultRow['result_json'];
}

export default function HistoricalArchiveView() {
  const [reports, setReports] = useState<ArchiveReportRow[]>([]);
  const [agentResults, setAgentResults] = useState<AgentResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<EnrichedArchiveReport | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const itemsPerPage = 8;

  const fetchArchiveData = async () => {
    setIsLoading(true);
    try {
      const [repRes, agentRes] = await Promise.all([
        supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('agent_results')
          .select('*')
          .eq('agent_type', 'vision_triage')
      ]);

      if (repRes.data) setReports(repRes.data);
      if (agentRes.data) setAgentResults(agentRes.data);
    } catch (err) {
      console.error('Failed to load archive records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initialLoad = async () => {
      try {
        const [repRes, agentRes] = await Promise.all([
          supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('agent_results')
            .select('*')
            .eq('agent_type', 'vision_triage')
        ]);
        if (!isMounted) return;
        if (repRes.data) setReports(repRes.data);
        if (agentRes.data) setAgentResults(agentRes.data);
      } catch (err) {
        console.error('Initial archive load error:', err);
      }
    };
    initialLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const active = reports.filter(r => r.status === 'in_progress' || r.status === 'dispatched' || r.status === 'triaged').length;
    const reviewNeeded = reports.filter(r => r.status === 'failed_analysis' || r.needs_human_review).length;

    return { total, resolved, active, reviewNeeded };
  }, [reports]);

  // Enriched archive table rows
  const archiveData = useMemo(() => {
    return reports.map(r => {
      const agentRes = agentResults.find(ar => ar.report_id === r.report_id);
      const categories = agentRes?.result_json?.waste_categories || [];
      const primaryCategory = categories[0] || 'Unclassified';
      const date = r.created_at ? new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      const time = r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const location = (r.latitude != null && r.longitude != null)
        ? `${Number(r.latitude).toFixed(4)}°N, ${Number(r.longitude).toFixed(4)}°E`
        : 'Coordinates Pending';

      return {
        ...r,
        formattedDate: date,
        formattedTime: time,
        location,
        categories,
        primaryCategory,
        agentDetails: agentRes?.result_json
      };
    }).filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && !item.categories.some(c => c.toLowerCase().includes(categoryFilter.toLowerCase()))) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.tracking_reference.toLowerCase().includes(term) || 
             item.location.toLowerCase().includes(term) || 
             item.primaryCategory.toLowerCase().includes(term) ||
             (item.citizen_notes && item.citizen_notes.toLowerCase().includes(term));
    });
  }, [reports, agentResults, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(archiveData.length / itemsPerPage) || 1;
  const currentData = archiveData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (archiveData.length === 0) return;

    const headers = ['Tracking Reference', 'Date Logged', 'Time Logged', 'Latitude', 'Longitude', 'Status', 'Priority Score', 'Waste Categories', 'Citizen Notes'];
    
    const csvRows = archiveData.map(row => {
      return [
        `"${row.tracking_reference}"`,
        `"${row.formattedDate}"`,
        `"${row.formattedTime}"`,
        `"${row.latitude ?? ''}"`,
        `"${row.longitude ?? ''}"`,
        `"${row.status.toUpperCase()}"`,
        `"${row.priority_score ?? 'N/A'}"`,
        `"${row.categories.join('; ')}"`,
        `"${(row.citizen_notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.setAttribute('download', `esteroute_archive_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      case 'in_progress':
      case 'dispatched':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/30">
            <Activity className="w-3 h-3 text-brand-primary" />
            {status.replace('_', ' ')}
          </span>
        );
      case 'triaged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-3 h-3 text-cyan-400" />
            Triaged
          </span>
        );
      case 'failed_analysis':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Needs Review
          </span>
        );
      case 'pending_analysis':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3 text-slate-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="w-full flex flex-col pb-12 overflow-x-hidden">
      
      {/* 1. Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-brand-primary/20 text-brand-primary border border-brand-primary/40 rounded-sm">
              LGU Central Repository
            </span>
            <span className="flex items-center gap-1 text-[10px] text-text-muted font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Verified Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary border-l-4 border-brand-primary pl-3 md:pl-4">
            Historical Archive
          </h1>
          <p className="text-text-muted text-xs md:text-sm pl-4 md:pl-5 mt-1">
            Master records of canal reports, field resolutions, and triage intelligence logs.
          </p>
        </div>
        
        {/* Actions Bar */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button 
            type="button"
            onClick={handleExportCSV}
            disabled={archiveData.length === 0}
            className="px-4 py-2 bg-surface/85 hover:bg-brand-primary hover:text-white border border-border-strong rounded-sm text-text-primary text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2 shrink-0 disabled:opacity-50"
            title="Export CSV Dataset"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchArchiveData}
            disabled={isLoading}
            className="p-2 bg-surface/85 hover:bg-surface border border-border-strong rounded-sm text-text-muted hover:text-brand-primary transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="Refresh Archive"
          >
            <RefreshCw className={twMerge("w-4 h-4", isLoading && "animate-spin text-brand-primary")} />
          </button>
        </div>
      </motion.div>

      {/* 2. Top Metric Cards (Archive Summary) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        
        {/* Card 1: Total Records */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="relative bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-border-subtle hover:border-brand-primary/60 transition-all duration-300 rounded-sm p-4 sm:p-5 shadow-xs hover:shadow-md overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all pointer-events-none" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-text-muted">
                Total Master Records
              </span>
              <Archive className="w-4 h-4 text-brand-primary" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-4xl font-mono font-black text-text-primary">
                {summaryMetrics.total}
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted">
                All-time DB
              </span>
            </div>

            <div className="w-full bg-border-subtle/40 h-1 rounded-full overflow-hidden">
              <div className="bg-brand-primary h-full w-full" />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Field Resolutions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="relative bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-border-subtle hover:border-emerald-500/60 transition-all duration-300 rounded-sm p-4 sm:p-5 shadow-xs hover:shadow-md overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-text-muted">
                Cleared & Resolved
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-4xl font-mono font-black text-emerald-400">
                {summaryMetrics.resolved}
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted">
                {summaryMetrics.total > 0 ? Math.round((summaryMetrics.resolved / summaryMetrics.total) * 100) : 0}% Cleared
              </span>
            </div>

            <div className="w-full bg-border-subtle/40 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${summaryMetrics.total > 0 ? (summaryMetrics.resolved / summaryMetrics.total) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Active Operations */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="relative bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-border-subtle hover:border-cyan-500/60 transition-all duration-300 rounded-sm p-4 sm:p-5 shadow-xs hover:shadow-md overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-text-muted">
                Pipeline / Dispatched
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-4xl font-mono font-black text-cyan-400">
                {summaryMetrics.active}
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted">
                In Progress / Triage
              </span>
            </div>

            <div className="w-full bg-border-subtle/40 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-cyan-500 h-full transition-all duration-500" 
                style={{ width: `${summaryMetrics.total > 0 ? (summaryMetrics.active / summaryMetrics.total) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Flagged for Review */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="relative bg-surface/40 hover:bg-surface/80 backdrop-blur-xl border border-border-subtle hover:border-amber-500/60 transition-all duration-300 rounded-sm p-4 sm:p-5 shadow-xs hover:shadow-md overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-text-muted">
                Review & Anomalies
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl sm:text-4xl font-mono font-black text-amber-400">
                {summaryMetrics.reviewNeeded}
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted">
                Audit Required
              </span>
            </div>

            <div className="w-full bg-border-subtle/40 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-500" 
                style={{ width: `${summaryMetrics.total > 0 ? (summaryMetrics.reviewNeeded / summaryMetrics.total) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </motion.div>

      </div>

      {/* 3. Search and Filter Bar */}
      <div className="w-full bg-surface/85 backdrop-blur-md border border-border-strong p-3.5 sm:p-4 rounded-sm shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-center">
        {/* Search */}
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by Tracking Reference, notes, or coordinates..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-app-bg/80 border border-border-subtle rounded-sm py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:border-brand-primary text-text-primary placeholder:text-text-muted transition-colors"
          />
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          {/* Status Filter */}
          <div className="flex-1 md:flex-none relative bg-app-bg/80 border border-border-subtle flex items-center gap-1.5 rounded-sm hover:border-brand-primary transition-colors px-2.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent py-2 pr-2 outline-none appearance-none cursor-pointer w-full uppercase tracking-wider text-[10px] font-mono font-bold text-text-secondary"
            >
              <option value="ALL" className="bg-surface text-text-primary">All Statuses</option>
              <option value="resolved" className="bg-surface text-text-primary">Resolved</option>
              <option value="in_progress" className="bg-surface text-text-primary">In Progress</option>
              <option value="triaged" className="bg-surface text-text-primary">Triaged</option>
              <option value="failed_analysis" className="bg-surface text-text-primary">Needs Review</option>
              <option value="pending_analysis" className="bg-surface text-text-primary">Pending</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1 md:flex-none relative bg-app-bg/80 border border-border-subtle flex items-center gap-1.5 rounded-sm hover:border-brand-primary transition-colors px-2.5">
            <Trash2 className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent py-2 pr-2 outline-none appearance-none cursor-pointer w-full uppercase tracking-wider text-[10px] font-mono font-bold text-text-secondary"
            >
              <option value="ALL" className="bg-surface text-text-primary">All Waste Types</option>
              <option value="plastic" className="bg-surface text-text-primary">Plastic Debris</option>
              <option value="organic" className="bg-surface text-text-primary">Organic Matter</option>
              <option value="styrofoam" className="bg-surface text-text-primary">Styrofoam</option>
              <option value="silt" className="bg-surface text-text-primary">Silt / Sediment</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Historical Data Table */}
      <div className="w-full bg-surface/40 hover:bg-surface/65 backdrop-blur-xl border border-border-strong rounded-sm shadow-md flex flex-col flex-1 overflow-hidden transition-all duration-300">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-surface-subtle/80 border-b border-border-strong text-[10px] uppercase font-mono font-bold tracking-widest text-text-muted">
                <th className="p-3.5 pl-5">Tracking Reference</th>
                <th className="p-3.5">Date & Time Logged</th>
                <th className="p-3.5">Waterway Coordinates</th>
                <th className="p-3.5">Detected Debris</th>
                <th className="p-3.5">Priority Index</th>
                <th className="p-3.5 text-center">Operational Status</th>
                <th className="p-3.5 pr-5 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40 text-xs">
              {currentData.map((row) => (
                <tr key={row.report_id} className="hover:bg-brand-primary/5 transition-colors group">
                  {/* Reference with copy */}
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-text-primary">
                        {row.tracking_reference}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(row.tracking_reference)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface rounded text-text-muted hover:text-brand-primary transition-all cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedId === row.tracking_reference ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="p-3.5 font-mono text-[11px] text-text-secondary">
                    <div>{row.formattedDate}</div>
                    <div className="text-[10px] text-text-muted">{row.formattedTime}</div>
                  </td>

                  {/* Coordinates */}
                  <td className="p-3.5 font-mono text-[11px] text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-brand-secondary shrink-0" />
                      <span>{row.location}</span>
                    </div>
                  </td>

                  {/* Categories */}
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {row.categories.length > 0 ? (
                        row.categories.map((cat, idx) => (
                          <span 
                            key={idx}
                            className="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider bg-surface-subtle border border-border-subtle text-text-secondary"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] font-mono text-text-muted italic">Unclassified</span>
                      )}
                    </div>
                  </td>

                  {/* Priority Score */}
                  <td className="p-3.5 font-mono font-bold text-xs">
                    {row.priority_score != null ? (
                      <span className={twMerge(
                        row.priority_score >= 70 ? "text-semantic-urgent" : row.priority_score >= 40 ? "text-semantic-warning" : "text-emerald-400"
                      )}>
                        {row.priority_score}/100
                      </span>
                    ) : (
                      <span className="text-text-muted text-[10px] font-normal font-sans italic">Not scored</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="p-3.5 text-center">
                    {getStatusBadge(row.status)}
                  </td>

                  {/* View Action */}
                  <td className="p-3.5 pr-5 text-right">
                    <button 
                      type="button"
                      onClick={() => setSelectedReport(row)}
                      className="p-1.5 bg-surface/80 hover:bg-brand-primary hover:text-white border border-border-subtle rounded-sm text-text-muted transition-all shadow-xs active:scale-95 cursor-pointer"
                      title="Inspect Report Dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-muted font-mono text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>No matching historical records found for this query.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination Controls */}
      <div className="w-full mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-muted">
          Showing {archiveData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, archiveData.length)} of {archiveData.length} records
        </span>
        
        <div className="flex items-center gap-1.5">
          <button 
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 bg-surface/85 border border-border-strong rounded-sm hover:border-brand-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <div className="px-3 py-1 bg-surface border border-border-strong rounded-sm text-xs font-mono font-bold text-text-primary">
            <span>{currentPage}</span>
            <span className="text-text-muted mx-1">/</span>
            <span className="text-text-muted">{totalPages}</span>
          </div>

          <button 
            type="button"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 bg-surface/85 border border-border-strong rounded-sm hover:border-brand-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-text-secondary cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6. Case Dossier Modal (Detailed Inspection) */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border-strong rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border-subtle bg-surface-subtle/50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-brand-primary/20 text-brand-primary border border-brand-primary/40 rounded-sm">
                    Report Dossier
                  </span>
                  <h2 className="text-base sm:text-lg font-heading font-black tracking-wide text-text-primary">
                    {selectedReport.tracking_reference}
                  </h2>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-xs">
                
                {/* Photo Preview & Key Indicators */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo */}
                  <div className="w-full sm:w-48 h-40 bg-black/40 border border-border-subtle rounded-sm overflow-hidden shrink-0 relative flex items-center justify-center">
                    {selectedReport.image_url ? (
                      <img 
                        src={selectedReport.image_url} 
                        alt="Blockage Evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-text-muted p-4">
                        <FileText className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span className="text-[10px] font-mono">No imagery attached</span>
                      </div>
                    )}
                  </div>

                  {/* Summary Metrics */}
                  <div className="flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase text-text-muted font-bold">Status</span>
                        {getStatusBadge(selectedReport.status)}
                      </div>
                      <div className="flex items-center justify-between mb-1 py-1 border-y border-border-subtle/50">
                        <span className="text-[10px] font-mono uppercase text-text-muted font-bold">Logged At</span>
                        <span className="font-mono text-text-primary">
                          {new Date(selectedReport.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[10px] font-mono uppercase text-text-muted font-bold">Severity Score</span>
                        <span className="font-mono font-bold text-text-primary">
                          {selectedReport.priority_score != null ? `${selectedReport.priority_score} / 100` : 'Pending Score'}
                        </span>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="p-2.5 bg-app-bg/80 border border-border-subtle rounded-sm flex items-center justify-between font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-text-muted">
                        <MapPin className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
                        <span>
                          {selectedReport.latitude != null && selectedReport.longitude != null 
                            ? `${Number(selectedReport.latitude).toFixed(5)}°N, ${Number(selectedReport.longitude).toFixed(5)}°E`
                            : 'Coordinates Unspecified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Vision Rationale */}
                {selectedReport.agentDetails?.rationale && (
                  <div className="p-3.5 bg-brand-primary/5 border border-brand-primary/20 rounded-sm">
                    <div className="flex items-center gap-2 mb-1.5 text-brand-primary font-mono font-bold uppercase tracking-wider text-[10px]">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Vision Agent Triage Rationale</span>
                    </div>
                    <p className="text-text-secondary leading-relaxed text-[11px]">
                      {selectedReport.agentDetails.rationale}
                    </p>
                  </div>
                )}

                {/* Waste Categories Detected */}
                {selectedReport.agentDetails?.waste_categories && selectedReport.agentDetails.waste_categories.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted block mb-2">
                      Debris Classification Breakdown
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedReport.agentDetails.waste_categories.map((cat, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider bg-surface-subtle border border-border-strong text-text-primary"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Citizen Notes */}
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Citizen Submission Field Notes
                  </span>
                  <div className="p-3 bg-app-bg/60 border border-border-subtle rounded-sm text-text-secondary italic text-[11px]">
                    "{selectedReport.citizen_notes || 'No citizen commentary supplied.'}"
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t border-border-subtle bg-surface-subtle/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-surface hover:bg-surface-subtle border border-border-strong rounded-sm text-xs font-mono font-bold uppercase tracking-wider text-text-primary transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
