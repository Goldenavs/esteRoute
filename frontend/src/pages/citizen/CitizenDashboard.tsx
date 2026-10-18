import { useState, useEffect, useId, useMemo } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Activity, 
  AlertTriangle, 
  Copy, 
  Check, 
  X, 
  PlusCircle,
  Truck,
  Eye
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CitizenFilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'in_progress': 
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'review':
        return 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/30';
      default: 
        return 'bg-brand-primary/10 text-brand-primary border-brand-primary/30';
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

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (filter === 'pending') return r.status === 'pending' || r.status === 'review';
      if (filter === 'in_progress') return r.status === 'in_progress';
      if (filter === 'resolved') return r.status === 'resolved';
      return true;
    });
  }, [reports, filter]);

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
            <motion.button
              key={metric.label}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(metric.filter)}
              className={twMerge(
                "group relative overflow-hidden flex h-10 sm:min-h-[56px] items-center border bg-surface/75 shadow-md backdrop-blur-md transition-all duration-300 hover:border-brand-primary -skew-x-2 sm:-skew-x-6 cursor-pointer text-left",
                metric.border,
                isSelected 
                  ? "ring-1 sm:ring-2 ring-brand-primary opacity-100 z-10 scale-[1.02]" 
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
            </motion.button>
          );
        })}
      </motion.div>

      {/* 3. Main Content Area */}
      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* Featured Case Card (Frosted Glass with BorderBeam Highlight) */}
        {featuredReport && filter !== 'resolved' && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-500 rounded-sm p-4 sm:p-6 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 relative overflow-hidden group"
          >
            {/* Traveling Highlight Beam */}
            <BorderBeam delay={0} color="#60A5FA" />

            {/* Industrial Left Accent Pillar */}
            <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary" />

            <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-start md:items-center relative z-20">
              
              {/* Image Preview with Skewed Badge */}
              <div className="w-full md:w-56 h-48 md:h-40 rounded-sm border-2 border-border-subtle overflow-hidden shrink-0 relative shadow-inner bg-black/40">
                <img 
                  src={featuredReport.image} 
                  alt="Report Evidence"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="px-2.5 py-1 bg-brand-primary text-white text-[10px] font-mono font-black uppercase tracking-widest rounded-sm -skew-x-6 shadow-md inline-block">
                    <span className="skew-x-6 flex items-center gap-1.5">
                      <Activity className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} /> 
                      Active Tracking
                    </span>
                  </span>
                </div>
              </div>

              {/* Info Column */}
              <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={twMerge(
                    "px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest rounded-sm -skew-x-6 border",
                    getStatusColor(featuredReport.status)
                  )}>
                    <span className="skew-x-6 flex items-center gap-1.5">
                      {getStatusIcon(featuredReport.status)}
                      {featuredReport.statusLabel}
                    </span>
                  </span>
                  <span className="text-text-muted text-xs font-mono tracking-wide">
                    {featuredReport.date}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black tracking-tight text-text-primary group-hover:text-brand-primary transition-colors truncate">
                  {featuredReport.trackingRef}
                </h2>

                <div className="flex items-start gap-2 text-text-secondary mt-1">
                  <MapPin className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                  <span className="font-medium text-xs sm:text-sm line-clamp-1">{featuredReport.location}</span>
                </div>

                {featuredReport.notes && (
                  <p className="text-text-muted text-xs line-clamp-2 mt-1 leading-relaxed italic">
                    "{featuredReport.notes}"
                  </p>
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
          </motion.div>
        )}

        {/* 4. History Grid Section with Pagination */}
        <div className="mt-2">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-base sm:text-lg font-heading font-black tracking-widest uppercase text-text-secondary flex items-center gap-2 shrink-0">
              {filter === 'all' ? 'All Submissions' : filter === 'pending' ? 'Under Review' : filter === 'in_progress' ? 'Active In Field' : 'Resolved Records'}
            </h3>
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-xs font-mono text-text-muted">
              {historyReports.length} {filter === 'all' && featuredReport ? 'Other ' : ''}Records
            </span>
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
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedReport(report)}
                    className="bg-surface/35 hover:bg-surface/85 backdrop-blur-xl border-2 border-border-subtle hover:border-brand-primary transition-all duration-300 rounded-sm p-4 sm:p-5 shadow-sm hover:shadow-xl hover:shadow-brand-primary/10 flex flex-col group cursor-pointer relative overflow-hidden"
                  >
                    {/* Subtle Border highlight on hover */}
                    <BorderBeam delay={idx * 1.8} color="#3F72AF" />

                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-3 relative z-20">
                      <span className={twMerge(
                        "px-2.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-wider rounded-sm -skew-x-6 border",
                        getStatusColor(report.status)
                      )}>
                        <span className="skew-x-6 flex items-center gap-1.5">
                          {getStatusIcon(report.status)}
                          {report.statusLabel}
                        </span>
                      </span>
                      <span className="text-text-muted text-[10px] font-mono">
                        {report.date.split('•')[0].trim()}
                      </span>
                    </div>

                    {/* ID & Notes */}
                    <div className="relative z-20 mb-3">
                      <h4 className="text-lg sm:text-xl font-heading font-black tracking-tight text-text-primary group-hover:text-brand-primary transition-colors truncate">
                        {report.trackingRef}
                      </h4>
                      {report.notes && (
                        <p className="text-text-muted text-[11px] line-clamp-2 mt-1 leading-relaxed">
                          {report.notes}
                        </p>
                      )}
                    </div>

                    {/* Location Pill */}
                    <div className="mt-auto relative z-20 flex items-center justify-between text-xs text-text-secondary bg-app-bg/60 p-2.5 rounded-sm border border-border-subtle -skew-x-2 group-hover:border-border-strong transition-colors">
                      <div className="skew-x-2 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-secondary" />
                        <span className="font-mono text-[10px] truncate">{report.location}</span>
                      </div>
                      <Eye className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-primary shrink-0 transition-colors ml-1" />
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
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={twMerge(
                        "px-2.5 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-all -skew-x-3 flex items-center gap-1 border",
                        currentPage === 1
                          ? "border-border-subtle text-text-muted opacity-40 cursor-not-allowed"
                          : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
                      )}
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 skew-x-3" />
                      <span className="skew-x-3 hidden sm:inline">Prev</span>
                    </button>

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

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={twMerge(
                        "px-2.5 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-all -skew-x-3 flex items-center gap-1 border",
                        currentPage === totalPages
                          ? "border-border-subtle text-text-muted opacity-40 cursor-not-allowed"
                          : "border-border-subtle bg-surface/60 hover:bg-brand-primary hover:text-white text-text-primary cursor-pointer active:scale-95"
                      )}
                      title="Next Page"
                    >
                      <span className="skew-x-3 hidden sm:inline">Next</span>
                      <ChevronRight className="w-3.5 h-3.5 skew-x-3" />
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
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
                
                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={twMerge(
                      "px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider rounded-sm -skew-x-6 border",
                      getStatusColor(selectedReport.status)
                    )}>
                      <span className="skew-x-6 flex items-center gap-1.5">
                        {getStatusIcon(selectedReport.status)}
                        {selectedReport.statusLabel}
                      </span>
                    </span>
                    <span className="text-text-muted text-xs font-mono">{selectedReport.date}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="p-1 rounded-sm text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tracking ID with Copy Button */}
                <div className="flex items-center justify-between gap-3 bg-app-bg/80 border border-border-subtle p-3 rounded-sm mb-4">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-text-muted">Tracking Code</div>
                    <div className="text-lg sm:text-xl font-heading font-black tracking-wider text-text-primary">
                      {selectedReport.trackingRef}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(selectedReport.trackingRef)}
                    className="px-3 py-1.5 bg-surface hover:bg-brand-primary hover:text-white border border-border-subtle rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
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

                {/* Evidence Image */}
                <div className="w-full h-48 rounded-sm overflow-hidden border border-border-subtle mb-4 relative bg-black/50">
                  <img 
                    src={selectedReport.image} 
                    alt="Canal Condition"
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Details Breakdown */}
                <div className="flex flex-col gap-2.5 text-xs font-mono text-text-secondary mb-5">
                  <div className="flex items-start gap-2 bg-app-bg/50 p-2.5 rounded-sm border border-border-subtle">
                    <MapPin className="w-4 h-4 text-brand-secondary shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-text-muted uppercase">Canal Location</div>
                      <div className="font-bold text-text-primary">{selectedReport.location}</div>
                    </div>
                  </div>

                  {selectedReport.notes && (
                    <div className="bg-app-bg/50 p-2.5 rounded-sm border border-border-subtle">
                      <div className="text-[10px] text-text-muted uppercase mb-1">Citizen Notes</div>
                      <p className="font-sans text-xs text-text-primary leading-relaxed italic">
                        "{selectedReport.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white hover:text-black transition-colors rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center -skew-x-3 sm:-skew-x-6 cursor-pointer"
                >
                  <span className="skew-x-3 sm:skew-x-6">Close Details</span>
                </button>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
