import { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
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

type FilterType = 'all' | 'resolved' | 'active' | 'review';
type SortOrderType = 'newest' | 'oldest';

export default function HistoricalArchiveView() {
  const [reports, setReports] = useState<ArchiveReportRow[]>([]);
  const [agentResults, setAgentResults] = useState<AgentResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('newest');
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

  // Stylistic KPI Strip Filter metrics (matches Citizen My Reports page)
  const kpiMetrics = useMemo(() => {
    const total = summaryMetrics.total;
    return [
      {
        filter: 'all' as FilterType,
        label: 'All Archives',
        shortLabel: 'All',
        subtext: 'Master Records',
        value: total,
        pct: 100,
        tone: 'text-text-primary',
        barBg: 'bg-brand-primary',
        border: 'border-border-subtle hover:border-brand-primary'
      },
      {
        filter: 'resolved' as FilterType,
        label: 'Resolved',
        shortLabel: 'Resolved',
        subtext: 'Cleared Esteros',
        value: summaryMetrics.resolved,
        pct: total > 0 ? Math.round((summaryMetrics.resolved / total) * 100) : 0,
        tone: 'text-emerald-400',
        barBg: 'bg-emerald-500',
        border: 'border-emerald-500/30 hover:border-emerald-500'
      },
      {
        filter: 'active' as FilterType,
        label: 'Pipeline',
        shortLabel: 'Pipeline',
        subtext: 'Dispatched & Triaged',
        value: summaryMetrics.active,
        pct: total > 0 ? Math.round((summaryMetrics.active / total) * 100) : 0,
        tone: 'text-cyan-400',
        barBg: 'bg-cyan-500',
        border: 'border-cyan-500/30 hover:border-cyan-500'
      },
      {
        filter: 'review' as FilterType,
        label: 'Needs Audit',
        shortLabel: 'Audit',
        subtext: 'Review & Anomalies',
        value: summaryMetrics.reviewNeeded,
        pct: total > 0 ? Math.round((summaryMetrics.reviewNeeded / total) * 100) : 0,
        tone: 'text-amber-400',
        pulse: summaryMetrics.reviewNeeded > 0,
        barBg: 'bg-amber-500',
        border: 'border-amber-500/30 hover:border-amber-500'
      }
    ];
  }, [summaryMetrics]);

  // Enriched and sorted archive table rows
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
    })
    .filter(item => {
      // 1. KPI Filter (All / Resolved / Active / Review)
      if (statusFilter === 'resolved' && item.status !== 'resolved') return false;
      if (statusFilter === 'active' && item.status !== 'in_progress' && item.status !== 'dispatched' && item.status !== 'triaged') return false;
      if (statusFilter === 'review' && item.status !== 'failed_analysis' && !item.needs_human_review) return false;

      // 2. Category Filter
      if (categoryFilter !== 'ALL' && !item.categories.some(c => c.toLowerCase().includes(categoryFilter.toLowerCase()))) return false;

      // 3. Search Term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.tracking_reference.toLowerCase().includes(term) || 
             item.location.toLowerCase().includes(term) || 
             item.primaryCategory.toLowerCase().includes(term) ||
             (item.citizen_notes && item.citizen_notes.toLowerCase().includes(term));
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [reports, agentResults, searchTerm, categoryFilter, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(archiveData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = archiveData.slice(startIndex, startIndex + itemsPerPage);

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
        className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4"
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
            Master records of canal blockage reports, field resolutions, and triage intelligence logs.
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

      {/* 2. Stylistic KPI Strip Filter (Matches My Reports page style & acts as primary filter) */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6 shrink-0"
      >
        {kpiMetrics.map((metric) => {
          const isSelected = statusFilter === metric.filter;
          return (
            <button
              key={metric.label}
              type="button"
              onClick={() => {
                setStatusFilter(metric.filter);
                setCurrentPage(1);
              }}
              className={twMerge(
                "group relative overflow-hidden flex h-14 sm:h-16 items-center border bg-surface/75 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-brand-primary cursor-pointer text-left rounded-sm active:opacity-90",
                metric.border,
                isSelected 
                  ? "ring-2 ring-brand-primary opacity-100 z-10 bg-surface/95 shadow-md shadow-brand-primary/20" 
                  : "opacity-85 hover:opacity-100"
              )}
            >
              {/* Proportional Occupancy Fill Bar */}
              <div 
                className={twMerge(
                  "absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-500",
                  metric.barBg
                )}
                style={{ width: `${metric.pct}%` }}
              />

              {/* Bottom Accent Meter Bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-border-subtle/50 w-full overflow-hidden">
                <div 
                  className={twMerge("h-full transition-all duration-500", metric.barBg)}
                  style={{ width: `${metric.pct}%` }}
                />
              </div>

              {/* Card Content */}
              <div className="relative z-10 flex w-full items-center justify-between gap-1.5 px-3 sm:px-4 py-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-text-secondary group-hover:text-brand-primary transition-colors truncate">
                    <span className="sm:hidden">{metric.shortLabel}</span>
                    <span className="hidden sm:inline">{metric.label}</span>
                  </span>
                  <span className="text-[9px] font-mono text-text-muted tracking-tight truncate hidden sm:inline">
                    {metric.subtext}
                  </span>
                </div>
                <span className={twMerge(
                  "text-lg sm:text-2xl font-mono font-bold shrink-0 leading-none",
                  metric.tone,
                  metric.pulse && "animate-pulse"
                )}>
                  {metric.value}
                </span>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* 3. Search, Category Filter, and Sorting Bar (Matches My Reports style) */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        {/* Left Side: Search + Category Selector */}
        <div className="flex flex-1 items-center gap-2">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by Tracking Reference, notes, or coordinates..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface/85 backdrop-blur-md border border-border-strong rounded-sm py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:border-brand-primary text-text-primary placeholder:text-text-muted transition-colors shadow-xs"
            />
          </div>

          {/* Waste Category Filter */}
          <div className="relative bg-surface/85 backdrop-blur-md border border-border-strong flex items-center gap-1.5 rounded-sm hover:border-brand-primary transition-colors px-2.5 shadow-xs shrink-0">
            <Trash2 className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent py-2 pr-2 outline-none appearance-none cursor-pointer uppercase tracking-wider text-[10px] font-mono font-bold text-text-secondary"
            >
              <option value="ALL" className="bg-surface text-text-primary">All Waste Types</option>
              <option value="plastic" className="bg-surface text-text-primary">Plastic Debris</option>
              <option value="organic" className="bg-surface text-text-primary">Organic Matter</option>
              <option value="styrofoam" className="bg-surface text-text-primary">Styrofoam</option>
              <option value="silt" className="bg-surface text-text-primary">Silt / Sediment</option>
            </select>
          </div>
        </div>

        {/* Right Side: Sort Control (Newest / Oldest) - Matches Citizen Dashboard Style */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <span className="text-xs font-mono text-text-muted">
            ({archiveData.length} matching {archiveData.length === 1 ? 'record' : 'records'})
          </span>

          <div className="flex items-center gap-1 bg-surface/85 border border-border-strong p-1 rounded-sm shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted px-1.5 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3 h-3 text-brand-primary" />
              <span className="hidden sm:inline">Sort:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSortOrder('newest');
                setCurrentPage(1);
              }}
              className={twMerge(
                "px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer",
                sortOrder === 'newest'
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              )}
              title="Sort by Newest First"
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => {
                setSortOrder('oldest');
                setCurrentPage(1);
              }}
              className={twMerge(
                "px-2.5 py-1 rounded-xs text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer",
                sortOrder === 'oldest'
                  ? "bg-brand-primary text-white shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              )}
              title="Sort by Oldest First"
            >
              Oldest
            </button>
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

      {/* 5. Pagination Bar (Exact Style & Structure from Citizen My Reports Page) */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle shrink-0">
        <div className="text-xs font-mono text-text-muted">
          Showing <span className="text-text-primary font-bold">{archiveData.length === 0 ? 0 : startIndex + 1}</span> to{" "}
          <span className="text-text-primary font-bold">
            {Math.min(startIndex + itemsPerPage, archiveData.length)}
          </span>{" "}
          of <span className="text-text-primary font-bold">{archiveData.length}</span> records
        </div>

        <div className="flex items-center gap-1.5">
          {/* First Page (<<) */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className={twMerge(
              "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all flex items-center justify-center border",
              currentPage === 1
                ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
            )}
            title="First Page (<<)"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page (<) */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className={twMerge(
              "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all flex items-center justify-center border",
              currentPage === 1
                ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
            )}
            title="Previous Page (<)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Numbered Page Buttons */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={twMerge(
                "w-7 h-7 rounded-sm text-xs font-mono font-bold transition-all flex items-center justify-center border cursor-pointer active:scale-95",
                currentPage === pageNum
                  ? "bg-brand-primary text-white border-brand-primary shadow-xs shadow-brand-primary/30"
                  : "bg-surface/60 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface"
              )}
            >
              <span>{pageNum}</span>
            </button>
          ))}

          {/* Next Page (>) */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className={twMerge(
              "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all flex items-center justify-center border",
              currentPage === totalPages
                ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
            )}
            title="Next Page (>)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page (>>) */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className={twMerge(
              "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all flex items-center justify-center border",
              currentPage === totalPages
                ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
            )}
            title="Last Page (>>)"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
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
