import { useState, useEffect, useId, useMemo } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Activity, 
  AlertTriangle, 
  Copy, 
  Check, 
  PlusCircle,
  Truck,
  Compass,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Subtle, eye-friendly traveling perimeter highlight matching Landing Page features
const BorderBeam = ({ delay = 0, color = "#60A5FA" }: { delay?: number; color?: string }) => {
  const id = useId();
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm z-10">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3F72AF" stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3F72AF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="2"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="2.5"
          strokeDasharray="140 1200"
          animate={{
            strokeDashoffset: [1340, 0],
          }}
          transition={{
            duration: 9,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>
    </div>
  );
};

export interface CitizenReportItem {
  id: string;
  trackingRef: string;
  date: string;
  rawDate: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'review';
  statusLabel: string;
  severity: string;
  priorityScore?: number;
  location: string;
  latitude?: number;
  longitude?: number;
  image: string;
  notes?: string;
}

const fallbackReports: CitizenReportItem[] = [
  {
    id: 'demo-1',
    trackingRef: 'ER-2026-000481',
    date: 'Oct 15, 2026 • 2:30 PM',
    rawDate: '2026-10-15T14:30:00Z',
    status: 'in_progress',
    statusLabel: 'In Progress',
    severity: 'High Priority (Score: 84)',
    priorityScore: 84,
    location: 'Rizal Ave & 4th St Culvert, Subangdaku',
    latitude: 10.3330,
    longitude: 123.9180,
    image: 'https://images.unsplash.com/photo-1596767746408-db2891d4e0e2?q=80&w=600',
    notes: 'Severe trash choke point at commercial culvert. Water pooling across curb.'
  },
  {
    id: 'demo-2',
    trackingRef: 'ER-2026-000329',
    date: 'Oct 02, 2026 • 9:15 AM',
    rawDate: '2026-10-02T09:15:00Z',
    status: 'resolved',
    statusLabel: 'Resolved',
    severity: 'Medium Priority (Score: 52)',
    priorityScore: 52,
    location: 'San Juan Spillway Drainage, Lahug',
    latitude: 10.3190,
    longitude: 123.9040,
    image: 'https://images.unsplash.com/photo-1584449856172-2d8544d6db53?q=80&w=600',
    notes: 'Silt and tree debris removed by city dredging crew.'
  },
  {
    id: 'demo-3',
    trackingRef: 'ER-2026-000490',
    date: 'Oct 17, 2026 • 11:05 AM',
    rawDate: '2026-10-17T11:05:00Z',
    status: 'pending',
    statusLabel: 'Under AI Triage',
    severity: 'Pending Verification',
    location: 'Luna Canal Lateral B, Guadalupe',
    latitude: 10.3150,
    longitude: 123.8860,
    image: 'https://images.unsplash.com/photo-1621360662234-5835694a50bb?q=80&w=600',
    notes: 'Plastic waste buildup after moderate localized rainfall.'
  }
];

export type CitizenFilterType = 'all' | 'pending' | 'in_progress' | 'resolved';

export default function CitizenDashboard() {
  const [reports, setReports] = useState<CitizenReportItem[]>(fallbackReports);
  const [selectedReport, setSelectedReport] = useState<CitizenReportItem | null>(null);
  const [isImageFocused, setIsImageFocused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CitizenFilterType>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Reset pagination when filter or sort order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortOrder]);

  // Load reports from Supabase & localStorage tracked references
  useEffect(() => {
    let isMounted = true;

    async function loadCitizenReports() {
      try {
        const savedRefs: string[] = JSON.parse(localStorage.getItem('esteroute_my_reports') || '[]');

        let query = supabase
          .from('reports')
          .select('report_id, tracking_reference, latitude, longitude, citizen_notes, image_url, status, priority_score, created_at')
          .order('created_at', { ascending: false });

        if (savedRefs.length > 0) {
          query = query.in('tracking_reference', savedRefs);
        } else {
          query = query.limit(20);
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          const mapped: CitizenReportItem[] = data.map((item) => {
            let statusKey: CitizenReportItem['status'] = 'pending';
            let label = 'Under Review';

            if (item.status === 'resolved') {
              statusKey = 'resolved';
              label = 'Resolved';
            } else if (item.status === 'dispatched' || item.status === 'triaged') {
              statusKey = 'in_progress';
              label = item.status === 'dispatched' ? 'Crew Dispatched' : 'In Progress';
            } else if (item.status === 'failed_analysis') {
              statusKey = 'review';
              label = 'Manual Verification';
            }

            const score = item.priority_score ?? 0;
            const sevText = score >= 70 ? `Critical (${score})` : score >= 40 ? `Moderate (${score})` : `Low (${score})`;

            return {
              id: item.report_id,
              trackingRef: item.tracking_reference || `ER-${item.report_id.slice(0, 6)}`,
              date: new Date(item.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              rawDate: item.created_at,
              status: statusKey,
              statusLabel: label,
              severity: sevText,
              priorityScore: score,
              location: `Canal Coordinates: ${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`,
              latitude: Number(item.latitude),
              longitude: Number(item.longitude),
              image: item.image_url || 'https://images.unsplash.com/photo-1596767746408-db2891d4e0e2?q=80&w=600',
              notes: item.citizen_notes || 'Citizen canal blockage observation.',
            };
          });

          if (isMounted) setReports(mapped);
        }
      } catch (err) {
        console.warn('Could not load reports from database, using cached history:', err);
      }
    }

    loadCitizenReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusColor = (status: CitizenReportItem['status']) => {
    switch(status) {
      case 'resolved': 
        return 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/95 dark:text-emerald-300 dark:border-emerald-500/60 shadow-sm';
      case 'in_progress': 
        return 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/95 dark:text-amber-300 dark:border-amber-500/60 shadow-sm';
      case 'review':
        return 'bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-950/95 dark:text-orange-300 dark:border-orange-500/60 shadow-sm';
      default: 
        return 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-950/95 dark:text-blue-300 dark:border-blue-500/60 shadow-sm';
    }
  };

  const getStatusIcon = (status: CitizenReportItem['status']) => {
    switch(status) {
      case 'resolved': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'in_progress': return <Truck className="w-3.5 h-3.5" />;
      case 'review': return <AlertTriangle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  // 100% Accurate Counts strictly computed from the reports state
  const totalCount = reports.length;
  const pendingCount = useMemo(() => reports.filter(r => r.status === 'pending' || r.status === 'review').length, [reports]);
  const inProgressCount = useMemo(() => reports.filter(r => r.status === 'in_progress').length, [reports]);
  const resolvedCount = useMemo(() => reports.filter(r => r.status === 'resolved').length, [reports]);

  // Stylistic KPI Strip Filter metrics with visual proportion bars (meters) matching PublicEsteroStatusMap
  const kpiMetrics = [
    {
      filter: 'all' as const,
      label: 'TOTAL REPORTS',
      shortLabel: 'ALL',
      value: totalCount,
      subtext: 'All Submissions',
      tone: 'text-text-primary',
      border: 'border-border-subtle',
      barBg: 'bg-brand-primary',
      pct: 100,
      pulse: false,
    },
    {
      filter: 'pending' as const,
      label: 'UNDER REVIEW',
      shortLabel: 'PENDING',
      value: pendingCount,
      subtext: `${totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}% of Total`,
      tone: 'text-brand-primary',
      border: 'border-brand-primary/40',
      barBg: 'bg-brand-primary',
      pct: totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0,
      pulse: pendingCount > 0,
    },
    {
      filter: 'in_progress' as const,
      label: 'IN PROGRESS',
      shortLabel: 'ACTIVE',
      value: inProgressCount,
      subtext: `${totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0}% in Field`,
      tone: 'text-amber-400',
      border: 'border-amber-500/40',
      barBg: 'bg-amber-500',
      pct: totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0,
      pulse: inProgressCount > 0,
    },
    {
      filter: 'resolved' as const,
      label: 'RESOLVED CASES',
      shortLabel: 'RESOLVED',
      value: resolvedCount,
      subtext: `${totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0}% Cleared`,
      tone: 'text-emerald-400',
      border: 'border-emerald-500/40',
      barBg: 'bg-emerald-500',
      pct: totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0,
      pulse: false,
    },
  ];

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [reports, sortOrder]);

  const filteredReports = useMemo(() => {
    return sortedReports.filter(r => {
      if (filter === 'pending') return r.status === 'pending' || r.status === 'review';
      if (filter === 'in_progress') return r.status === 'in_progress';
      if (filter === 'resolved') return r.status === 'resolved';
      return true;
    });
  }, [sortedReports, filter]);

  const featuredReport = useMemo(() => {
    return reports.find(r => r.status === 'in_progress' || r.status === 'pending') || reports[0];
  }, [reports]);

  // When 'all' is selected, omit featured report from the history grid to prevent duplicate display
  const historyReports = useMemo(() => {
    if (filter === 'all' && featuredReport) {
      return filteredReports.filter(r => r.id !== featuredReport.id);
    }
    return filteredReports;
  }, [filteredReports, filter, featuredReport]);

  // Pagination logic for edge-cases with many reports
  const totalPages = Math.max(1, Math.ceil(historyReports.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedReports = useMemo(() => {
    return historyReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [historyReports, startIndex, ITEMS_PER_PAGE]);

  return (
    <div className="w-full flex-1 flex flex-col pb-12">
      
      {/* 1. Header (Standardized Hero with Framer Entrance & Exact Map Alignment) */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="shrink-0 mb-2 sm:mb-4 flex items-center justify-between gap-2 sm:gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-5xl font-heading font-black tracking-tight text-text-primary border-l-4 border-brand-primary pl-3 md:pl-4 truncate">
            My Reports
          </h1>
          <p className="hidden md:block text-text-muted text-xs md:text-sm pl-5 mt-1">
            Track real-time resolution status of canal blockages you've submitted.
          </p>
        </div>

        {/* Report CTA Link matching Map Page */}
        <Link
          to="/citizen"
          className="bg-brand-primary hover:bg-brand-secondary text-white hover:text-black transition-colors px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-sm -skew-x-3 sm:-skew-x-6 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-md shrink-0 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 skew-x-3 sm:skew-x-6 shrink-0" />
          <span className="skew-x-3 sm:skew-x-6 hidden xs:inline">Report Blockage</span>
          <span className="skew-x-3 sm:skew-x-6 xs:hidden">Report</span>
        </Link>
      </motion.div>

      {/* 2. Stylistic KPI Strip Filter (with proportional indicator meters) */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-4 sm:mb-6 shrink-0"
      >
        {kpiMetrics.map((metric) => {
          const isSelected = filter === metric.filter;
          return (
            <button
              key={metric.label}
              type="button"
              onClick={() => setFilter(metric.filter)}
              className={twMerge(
                "group relative overflow-hidden flex h-10 sm:min-h-[56px] items-center border bg-surface/75 shadow-md backdrop-blur-md transition-all duration-300 hover:border-brand-primary -skew-x-2 sm:-skew-x-6 cursor-pointer text-left active:opacity-90",
                metric.border,
                isSelected 
                  ? "ring-1 sm:ring-2 ring-brand-primary opacity-100 z-10 bg-surface/95 shadow-md shadow-brand-primary/20" 
                  : "opacity-85 hover:opacity-100"
              )}
            >
              {/* Proportional Occupancy Fill Bar (Meter) */}
              <div 
                className={twMerge(
                  "absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all duration-500",
                  metric.barBg
                )}
                style={{ width: `${metric.pct}%` }}
              />

              {/* Bottom Accent Meter Bar */}
              <div className="absolute bottom-0 left-0 h-0.5 sm:h-1 bg-border-subtle/50 w-full overflow-hidden">
                <div 
                  className={twMerge("h-full transition-all duration-500", metric.barBg)}
                  style={{ width: `${metric.pct}%` }}
                />
              </div>

              {/* Content (Unskewed) */}
              <div className="relative z-10 flex w-full items-center justify-between gap-1 px-1.5 sm:px-3.5 py-1 sm:py-2 skew-x-2 sm:skew-x-6">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-text-secondary group-hover:text-brand-primary transition-colors truncate">
                    <span className="sm:hidden">{metric.shortLabel}</span>
                    <span className="hidden sm:inline">{metric.label}</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono text-text-muted tracking-tight truncate hidden sm:inline">
                    {metric.subtext}
                  </span>
                </div>
                <span className={twMerge(
                  "text-xs sm:text-2xl font-mono font-bold shrink-0 leading-none",
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

      {/* 3. Main Content Area */}
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* Featured Case Card (Frosted Glass Skewed Container with BorderBeam Highlight) */}
        {featuredReport && filter !== 'resolved' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full"
          >
            <div className="w-full bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-4 sm:p-6 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 relative overflow-hidden group -skew-x-2 sm:-skew-x-3">
              {/* Traveling Highlight Beam */}
              <BorderBeam delay={0} color="#60A5FA" />

              {/* Industrial Left Accent Pillar */}
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />

              <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-start md:items-center relative z-20 skew-x-2 sm:skew-x-3">
                
                {/* Image Preview with Skewed Badge */}
                <div className="w-full md:w-56 h-48 md:h-40 rounded-sm border-2 border-border-subtle overflow-hidden shrink-0 relative shadow-inner bg-black/40">
                  <img 
                    src={featuredReport.image} 
                    alt="Report Evidence"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5">
                    <div className="px-2.5 py-1 bg-brand-primary text-white text-[10px] font-mono font-black uppercase tracking-widest rounded-sm -skew-x-6 shadow-md inline-flex items-center">
                      <span className="skew-x-6 inline-flex items-center gap-1.5">
                        <Activity className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} /> 
                        Active Tracking
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Column */}
                <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={twMerge(
                      "px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm -skew-x-6 border shadow-sm inline-flex items-center",
                      getStatusColor(featuredReport.status)
                    )}>
                      <span className="skew-x-6 inline-flex items-center gap-1.5">
                        {getStatusIcon(featuredReport.status)}
                        {featuredReport.statusLabel}
                      </span>
                    </div>
                    <span className="text-text-muted text-xs font-mono tracking-wide">
                      {featuredReport.date}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black tracking-tight text-text-primary group-hover:text-brand-primary transition-colors truncate">
                    {featuredReport.trackingRef}
                  </h2>

                  {/* Skewed Location Box */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-app-bg/60 border border-border-subtle rounded-sm -skew-x-2 self-start mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-secondary skew-x-2 shrink-0" />
                    <span className="skew-x-2 font-mono text-xs text-text-muted">
                      GPS: {Number(featuredReport.latitude).toFixed(4)}, {Number(featuredReport.longitude).toFixed(4)}
                    </span>
                  </div>

                  {/* Skewed Description Container with overflow safety */}
                  {featuredReport.notes && (
                    <div 
                      className="mt-1.5 p-2.5 sm:p-3 bg-app-bg/60 border border-border-subtle rounded-sm -skew-x-2 sm:-skew-x-3 max-h-24 overflow-hidden"
                      title={featuredReport.notes}
                    >
                      <p className="skew-x-2 sm:skew-x-3 text-text-muted text-xs line-clamp-2 sm:line-clamp-3 leading-relaxed italic break-words break-all">
                        "{featuredReport.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-border-subtle pt-3 md:pt-0 md:pl-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedReport(featuredReport)}
                    className="w-full md:w-auto py-3 px-6 bg-surface hover:bg-brand-primary hover:text-white border border-border-strong hover:border-brand-primary transition-all rounded-sm -skew-x-3 sm:-skew-x-6 flex items-center justify-center shadow-md active:scale-95 cursor-pointer group/btn"
                  >
                    <span className="skew-x-3 sm:skew-x-6 font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-text-primary group-hover/btn:text-white transition-colors">
                      View Details <ChevronRight className="w-4 h-4 text-brand-primary group-hover/btn:text-white transition-colors" />
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* 4. History Grid Section with Pagination & Sorting */}
        <div className="mt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <h3 className="text-base sm:text-lg font-heading font-black tracking-widest uppercase text-text-secondary flex items-center gap-2 shrink-0">
                {filter === 'all' ? 'All Submissions' : filter === 'pending' ? 'Under Review' : filter === 'in_progress' ? 'Active In Field' : 'Resolved Records'}
              </h3>
              <span className="text-xs font-mono text-text-muted hidden xs:inline">
                ({historyReports.length} {filter === 'all' && featuredReport ? 'other ' : ''}records)
              </span>
            </div>

            {/* Sort Control (Newest / Oldest) */}
            <div className="flex items-center gap-1 bg-surface/75 border border-border-subtle p-1 rounded-sm -skew-x-3 shadow-xs">
              <span className="skew-x-3 text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted px-1.5 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3 h-3 text-brand-primary" />
                <span className="hidden sm:inline">Sort:</span>
              </span>
              <button
                type="button"
                onClick={() => setSortOrder('newest')}
                className={twMerge(
                  "px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer",
                  sortOrder === 'newest'
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                )}
                title="Sort by Newest First"
              >
                <span className="skew-x-3">Newest</span>
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('oldest')}
                className={twMerge(
                  "px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer",
                  sortOrder === 'oldest'
                    ? "bg-brand-primary text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface"
                )}
                title="Sort by Oldest First"
              >
                <span className="skew-x-3">Oldest</span>
              </button>
            </div>
          </div>

          {historyReports.length === 0 ? (
            <div className="w-full bg-surface/35 backdrop-blur-xl border-2 border-border-subtle rounded-sm p-8 text-center flex flex-col items-center justify-center gap-3">
              <Clock className="w-8 h-8 text-text-muted" />
              <p className="text-sm font-mono text-text-muted">No reports match the selected filter category.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {paginatedReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 + idx * 0.04 }}
                    className="w-full flex"
                  >
                    <div
                      onClick={() => setSelectedReport(report)}
                      className="w-full bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 rounded-sm p-3.5 sm:p-4 shadow-sm hover:shadow-xl hover:shadow-brand-primary/10 flex flex-col group cursor-pointer relative overflow-hidden -skew-x-2"
                    >
                      {/* Subtle Border highlight on hover */}
                      <BorderBeam delay={idx * 1.8} color="#3F72AF" />

                      <div className="skew-x-2 flex flex-col flex-1">
                        
                        {/* Upper Section: Info on Left (~3/4th) & Photo Thumbnail on Right (~1/4th) */}
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-3">
                          {/* Info Column */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            {/* Status Pill Badge */}
                            <div className="self-start">
                              <div className={twMerge(
                                "px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm -skew-x-6 border shadow-sm inline-flex items-center",
                                getStatusColor(report.status)
                              )}>
                                <span className="skew-x-6 inline-flex items-center gap-1">
                                  {getStatusIcon(report.status)}
                                  {report.statusLabel}
                                </span>
                              </div>
                            </div>

                            {/* Tracking ID Header */}
                            <h4 className="text-base sm:text-lg font-heading font-black tracking-tight text-text-primary group-hover:text-brand-primary transition-colors truncate">
                              {report.trackingRef}
                            </h4>

                            {/* Date */}
                            <span className="text-text-muted text-[10px] font-mono">
                              {report.date}
                            </span>
                          </div>

                          {/* 1/4th Photo Thumbnail on upper right */}
                          <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-sm border border-border-subtle overflow-hidden relative bg-black/40 shrink-0 shadow-sm">
                            <img 
                              src={report.image} 
                              alt="Report thumbnail" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          </div>
                        </div>

                        {/* Skewed Description Container with overflow safety */}
                        {report.notes && (
                          <div 
                            className="mb-3 p-2 bg-app-bg/50 border border-border-subtle rounded-sm -skew-x-2 max-h-16 overflow-hidden"
                            title={report.notes}
                          >
                            <p className="skew-x-2 text-text-muted text-[11px] line-clamp-2 leading-relaxed italic break-words break-all">
                              "{report.notes}"
                            </p>
                          </div>
                        )}

                        {/* Simplified Location & Action Footer */}
                        <div className="mt-auto flex items-center justify-between text-xs text-text-secondary bg-app-bg/60 p-2 rounded-sm border border-border-subtle -skew-x-2 group-hover:border-border-strong transition-colors">
                          <div className="skew-x-2 flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-secondary" />
                            <span className="font-mono text-[10px] truncate">
                              {typeof report.latitude === 'number' && typeof report.longitude === 'number'
                                ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` 
                                : report.location.replace('Canal Coordinates: ', '')}
                            </span>
                          </div>
                          <div className="skew-x-2 flex items-center gap-1 text-text-muted group-hover:text-brand-primary text-[10px] font-mono font-bold uppercase transition-colors shrink-0 ml-1">
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>

                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 5. Pagination Bar for Large Collections */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle shrink-0">
                  <div className="text-xs font-mono text-text-muted">
                    Showing <span className="text-text-primary font-bold">{startIndex + 1}</span> to{" "}
                    <span className="text-text-primary font-bold">
                      {Math.min(startIndex + ITEMS_PER_PAGE, historyReports.length)}
                    </span>{" "}
                    of <span className="text-text-primary font-bold">{historyReports.length}</span> submissions
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* First Page (<<) */}
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className={twMerge(
                        "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all -skew-x-3 flex items-center justify-center border",
                        currentPage === 1
                          ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                          : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
                      )}
                      title="First Page (<<)"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5 skew-x-3" />
                    </button>

                    {/* Previous Page (<) */}
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={twMerge(
                        "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all -skew-x-3 flex items-center justify-center border",
                        currentPage === 1
                          ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                          : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
                      )}
                      title="Previous Page (<)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 skew-x-3" />
                    </button>

                    {/* Numbered Page Buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={twMerge(
                          "w-7 h-7 rounded-sm text-xs font-mono font-bold transition-all -skew-x-3 flex items-center justify-center border cursor-pointer active:scale-95",
                          currentPage === pageNum
                            ? "bg-brand-primary text-white border-brand-primary shadow-sm shadow-brand-primary/30"
                            : "bg-surface/60 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface"
                        )}
                      >
                        <span className="skew-x-3">{pageNum}</span>
                      </button>
                    ))}

                    {/* Next Page (>) */}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={twMerge(
                        "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all -skew-x-3 flex items-center justify-center border",
                        currentPage === totalPages
                          ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                          : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
                      )}
                      title="Next Page (>)"
                    >
                      <ChevronRight className="w-3.5 h-3.5 skew-x-3" />
                    </button>

                    {/* Last Page (>>) */}
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className={twMerge(
                        "w-7 h-7 rounded-sm text-xs font-mono font-bold uppercase transition-all -skew-x-3 flex items-center justify-center border",
                        currentPage === totalPages
                          ? "border-border-subtle text-text-muted opacity-30 cursor-not-allowed"
                          : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
                      )}
                      title="Last Page (>>)"
                    >
                      <ChevronsRight className="w-3.5 h-3.5 skew-x-3" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* 6. Case Details Modal with AnimatePresence */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
            {/* Soft Frosted Backdrop matching Cookie & Terms Policy */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedReport(null);
                setIsImageFocused(false);
              }}
              className="fixed inset-0 bg-app-bg/75 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-surface/95 backdrop-blur-2xl border-2 border-brand-primary/50 rounded-sm shadow-2xl overflow-hidden z-10 my-auto -skew-x-1 sm:-skew-x-2"
            >
              <BorderBeam delay={0} color="#60A5FA" />

              <div className="skew-x-1 sm:skew-x-2 p-5 sm:p-6">
                
                {/* Header (Cleaned: removed repetitive 'x' button) */}
                <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={twMerge(
                      "px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm -skew-x-6 border shadow-sm inline-flex items-center",
                      getStatusColor(selectedReport.status)
                    )}>
                      <span className="skew-x-6 inline-flex items-center gap-1.5">
                        {getStatusIcon(selectedReport.status)}
                        {selectedReport.statusLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-text-muted text-xs font-mono">{selectedReport.date}</span>
                </div>

                {/* Tracking ID with Copy Button */}
                <div className="flex items-center justify-between gap-3 bg-app-bg/80 border border-border-subtle p-3 rounded-sm mb-4 -skew-x-2">
                  <div className="skew-x-2">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted">Tracking Code</div>
                    <div className="text-lg sm:text-xl font-heading font-black tracking-wider text-text-primary">
                      {selectedReport.trackingRef}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(selectedReport.trackingRef)}
                    className="skew-x-2 px-3 py-1.5 bg-surface hover:bg-brand-primary hover:text-white border border-border-subtle rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  >
                    {copiedId === selectedReport.trackingRef ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Evidence Image (Clickable for Natural Focus View) */}
                <div 
                  onClick={() => setIsImageFocused(true)}
                  className="w-full h-48 rounded-sm overflow-hidden border border-border-subtle mb-4 relative bg-black/50 cursor-pointer group/img"
                  title="Click to expand"
                >
                  <img 
                    src={selectedReport.image} 
                    alt="Canal Condition"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-mono font-bold">
                    <Maximize2 className="w-4 h-4" />
                    <span>Click to expand</span>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="flex flex-col gap-2.5 text-xs font-mono text-text-secondary mb-5">
                  {/* Canal Location Row with direct 'View on Map' Action */}
                  <div className="flex items-center justify-between gap-2 bg-app-bg/50 p-2.5 sm:p-3 rounded-sm border border-border-subtle -skew-x-2">
                    <div className="flex items-start gap-2 skew-x-2 min-w-0">
                      <MapPin className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-text-muted uppercase">Canal Location</div>
                        <div className="font-bold text-text-primary text-xs sm:text-sm truncate">{selectedReport.location}</div>
                      </div>
                    </div>

                    {typeof selectedReport.latitude === 'number' && typeof selectedReport.longitude === 'number' && (
                      <Link
                        to={`/citizen/public-map?lat=${selectedReport.latitude}&lng=${selectedReport.longitude}&ref=${selectedReport.trackingRef}`}
                        className="skew-x-2 px-2.5 py-1.5 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black border border-brand-primary text-[10px] font-mono font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shrink-0 transition-colors shadow-xs active:scale-95 whitespace-nowrap cursor-pointer"
                        title="View on Live Basin Map"
                      >
                        <Compass className="w-3.5 h-3.5 shrink-0" />
                        <span>View on Map</span>
                      </Link>
                    )}
                  </div>

                  {/* Citizen Notes with Scroll Containment */}
                  {selectedReport.notes && (
                    <div className="bg-app-bg/50 p-2.5 sm:p-3 rounded-sm border border-border-subtle -skew-x-2">
                      <div className="skew-x-2">
                        <div className="text-[10px] text-text-muted uppercase mb-1 font-mono">Citizen Notes</div>
                        <div className="max-h-40 overflow-y-auto pr-1">
                          <p className="font-sans text-xs text-text-primary leading-relaxed italic break-words">
                            "{selectedReport.notes}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setIsImageFocused(false);
                  }}
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black transition-colors rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center -skew-x-3 sm:-skew-x-6 cursor-pointer active:scale-95"
                >
                  <span className="skew-x-3 sm:skew-x-6">Close Details</span>
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Image Focus Lightbox Modal */}
      <AnimatePresence>
        {isImageFocused && selectedReport && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Lightbox Soft Frosted Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImageFocused(false)}
              className="fixed inset-0 bg-app-bg/80 backdrop-blur-md cursor-pointer"
            />

            {/* Focused Image Box (Natural / Unskewed) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-20 max-w-4xl w-full max-h-[90vh] flex flex-col items-center gap-3 p-3 sm:p-4 bg-surface/95 border-2 border-brand-primary rounded-sm shadow-2xl"
            >
              <div className="w-full flex items-center justify-between pb-2 border-b border-border-subtle text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-text-primary truncate">{selectedReport.trackingRef}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageFocused(false)}
                  className="px-2.5 py-1 bg-surface hover:bg-brand-primary hover:text-white border border-border-subtle rounded-sm text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>

              <div className="w-full max-h-[75vh] overflow-hidden rounded-sm bg-black/60 flex items-center justify-center">
                <img 
                  src={selectedReport.image} 
                  alt="Full canal evidence" 
                  className="w-auto h-auto max-w-full max-h-[75vh] object-contain rounded-sm"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
