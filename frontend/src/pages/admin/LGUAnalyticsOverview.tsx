import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Calendar, Trophy, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function LGUAnalyticsOverview() {
  
  const [reports, setReports] = useState<any[]>([]);
  const [agentResults, setAgentResults] = useState<any[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  const [timeFilter, setTimeFilter] = useState<'7' | '30' | 'ALL'>('30');

  useEffect(() => {
    const fetchAllData = async () => {
      const [repRes, agentRes, logRes, profRes] = await Promise.all([
        supabase.from('reports').select('*'),
        supabase.from('agent_results').select('*').eq('agent_type', 'vision_triage'),
        supabase.from('dispatch_status_log').select('*'),
        supabase.from('profiles').select('*').order('stewardship_score', { ascending: false }).limit(5)
      ]);

      if (repRes.data) setReports(repRes.data);
      if (agentRes.data) setAgentResults(agentRes.data);
      if (logRes.data) setDispatchLogs(logRes.data);
      if (profRes.data) setProfiles(profRes.data);
    };

    fetchAllData();
  }, []);

  const stats = useMemo(() => {
    // 1. Apply Time Filter
    const now = new Date();
    const filterMs = timeFilter === '7' ? 7 * 24 * 60 * 60 * 1000 : timeFilter === '30' ? 30 * 24 * 60 * 60 * 1000 : Infinity;
    const thresholdDate = new Date(now.getTime() - filterMs);

    const filteredReports = reports.filter(r => new Date(r.created_at) >= thresholdDate);
    const validReportIds = new Set(filteredReports.map(r => r.report_id));
    const filteredAgentResults = agentResults.filter(ar => validReportIds.has(ar.report_id));
    const filteredDispatchLogs = dispatchLogs.filter(log => validReportIds.has(log.report_id));

    const totalReports = filteredReports.length;
    const resolvedReports = filteredReports.filter(r => r.status === 'resolved').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

    let totalMs = 0;
    let resolvedCount = 0;
    const resolutionLogs = filteredDispatchLogs.filter(log => log.to_status === 'resolved');
    
    resolutionLogs.forEach(log => {
      const report = reports.find(r => r.report_id === log.report_id);
      if (report) {
        const createdDate = new Date(report.created_at).getTime();
        const resolvedDate = new Date(log.created_at).getTime();
        totalMs += (resolvedDate - createdDate);
        resolvedCount++;
      }
    });
    
    const avgClearanceHours = resolvedCount > 0 ? (totalMs / resolvedCount / (1000 * 60 * 60)).toFixed(1) : "0.0";

    let critical = 0, severe = 0, moderate = 0;
    filteredReports.forEach(r => {
      if (r.priority_score >= 70) critical++;
      else if (r.priority_score >= 40) severe++;
      else moderate++;
    });

    const severityData = [
      { name: 'Critical', value: critical, color: '#EF4444' }, // semantic-urgent
      { name: 'Moderate/Severe', value: severe, color: '#F59E0B' }, // semantic-warning
      { name: 'Minor', value: moderate, color: '#3F72AF' }, // brand-primary
    ];

    const categoryCounts: Record<string, number> = {};
    filteredAgentResults.forEach(res => {
      const cats = res.result_json?.waste_categories || [];
      cats.forEach((c: string) => {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
    });

    const wasteData = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Map 28 days of activity based on real reports data
    const weeklyActivity = new Array(28).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredReports.forEach(r => {
      if (r.created_at) {
        const reportDate = new Date(r.created_at);
        reportDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - reportDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 28) {
          // index 27 is today, index 0 is 27 days ago
          weeklyActivity[27 - diffDays]++;
        }
      }
    });

    return { totalReports, resolutionRate, avgClearanceHours, severityData, wasteData, weeklyActivity };
  }, [reports, agentResults, dispatchLogs, timeFilter]);

  const getHeatmapColor = (value: number) => {
    if (value > 40) return 'bg-brand-primary/100';
    if (value > 30) return 'bg-brand-primary/80';
    if (value > 20) return 'bg-brand-primary/60';
    if (value > 10) return 'bg-brand-primary/40';
    return 'bg-brand-primary/20';
  };

  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-brand-primary" /> 
            LGU Analytics
          </h1>
          <p className="text-text-muted text-sm md:text-lg">Data-driven insights for strategic waterway management and flood prevention.</p>
        </div>
        
        {/* Filter / Actions */}
        <div className="flex items-center gap-4">
          <div className="bg-surface border border-border-subtle px-4 py-2 flex items-center gap-2 rounded-sm -skew-x-[6deg] hover:border-brand-primary transition-colors focus-within:border-brand-primary">
            <Calendar className="w-4 h-4 text-brand-primary skew-x-[6deg]" />
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="skew-x-[6deg] bg-transparent text-sm font-bold uppercase tracking-widest outline-none cursor-pointer text-text-primary appearance-none pr-2"
            >
              <option value="7" className="bg-surface text-text-primary">Last 7 Days</option>
              <option value="30" className="bg-surface text-text-primary">Last 30 Days</option>
              <option value="ALL" className="bg-surface text-text-primary">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border-subtle p-6 rounded-sm shadow-md relative overflow-hidden -skew-x-[2deg] group hover:border-brand-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>
          <div className="skew-x-[2deg]">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <CheckCircle className="w-5 h-5 text-semantic-success" />
              <span className="text-xs font-bold uppercase tracking-widest">Total Reports Managed</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-text-primary">{stats.totalReports}</span>
              <span className="text-sm font-bold text-semantic-success flex items-center mb-1">
                <TrendingUp className="w-4 h-4 mr-1" /> Live
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle p-6 rounded-sm shadow-md relative overflow-hidden -skew-x-[2deg] group hover:border-brand-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl group-hover:bg-brand-secondary/10 transition-colors"></div>
          <div className="skew-x-[2deg]">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <Clock className="w-5 h-5 text-brand-secondary" />
              <span className="text-xs font-bold uppercase tracking-widest">Avg Clearance Time</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-text-primary">{stats.avgClearanceHours}<span className="text-xl text-text-muted ml-1">hrs</span></span>
              <span className="text-[10px] font-bold text-text-muted flex items-center mb-1 uppercase tracking-widest">
                From Dispatch
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle p-6 rounded-sm shadow-md relative overflow-hidden -skew-x-[2deg] group hover:border-brand-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-semantic-warning/5 rounded-full blur-2xl group-hover:bg-semantic-warning/10 transition-colors"></div>
          <div className="skew-x-[2deg]">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <AlertTriangle className="w-5 h-5 text-semantic-warning" />
              <span className="text-xs font-bold uppercase tracking-widest">Resolution Rate</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-semantic-warning">{stats.resolutionRate}%</span>
              <span className="text-[10px] font-bold text-text-muted mb-1 flex items-center gap-1 uppercase tracking-widest">
                System Wide
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 flex-1">
        
        {/* Row 1: Waste Categories & Severity Pie */}
        <div className="bg-surface border border-border-strong rounded-sm p-6 shadow-xl flex flex-col h-[400px] -skew-x-[2deg]">
          <div className="skew-x-[2deg] h-full flex flex-col">
            <h2 className="font-heading font-black text-xl mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-brand-primary" /> AI Vision: Detected Pollutants
            </h2>
            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-6">Aggregate waste distribution from image processing</p>
            
            <div className="flex-1 w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.wasteData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1E36', borderColor: '#3F72AF', borderRadius: '4px', borderStyle: 'solid', borderWidth: '1px' }}
                    itemStyle={{ color: '#F9F7F7', fontWeight: 'bold' }}
                    cursor={{fill: 'rgba(63, 114, 175, 0.1)'}}
                  />
                  <Bar dataKey="value" fill="#3F72AF" radius={[0, 4, 4, 0]} maxBarSize={40}>
                    {stats.wasteData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#F59E0B' : '#3F72AF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-strong rounded-sm p-6 shadow-xl flex flex-col h-[400px] -skew-x-[2deg]">
          <div className="skew-x-[2deg] h-full flex flex-col">
            <h2 className="font-heading font-black text-xl mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-semantic-urgent" /> Severity Distribution
            </h2>
            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-4">Risk levels evaluated by AI Triage Pipeline</p>
            
            <div className="flex-1 w-full h-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1E36', borderColor: '#3F72AF', borderRadius: '4px' }}
                    itemStyle={{ color: '#F9F7F7', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Citizen Leaderboard & Dispatch Heatmap */}
        <div className="bg-surface border border-border-strong rounded-sm p-6 shadow-xl flex flex-col h-[400px] -skew-x-[2deg]">
          <div className="skew-x-[2deg] h-full flex flex-col">
            <h2 className="font-heading font-black text-xl mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-brand-secondary" /> Top Citizen Stewards
            </h2>
            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-6">Gamified community engagement scores</p>
            
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
              {profiles.map((profile, index) => (
                <div key={profile.id} className="flex items-center bg-app-bg border border-border-subtle p-3 rounded-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-4 ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500' :
                    index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300' :
                    index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700' :
                    'bg-surface-subtle text-text-muted'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-text-primary">{profile.full_name || 'Anonymous Citizen'}</div>
                    <div className="text-[10px] uppercase tracking-widest text-text-muted">{profile.role}</div>
                  </div>
                  <div className="font-black text-brand-primary text-lg">
                    {profile.stewardship_score} <span className="text-[10px] font-bold text-text-muted">PTS</span>
                  </div>
                </div>
              ))}
              {profiles.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-text-muted text-sm font-bold italic">
                  No citizens found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dispatch Heatmap (Maintained from skeleton) */}
        <div className="bg-surface border border-border-strong rounded-sm p-6 shadow-xl flex flex-col h-[400px] -skew-x-[2deg]">
          <div className="skew-x-[2deg] h-full flex flex-col">
            <h2 className="font-heading font-black text-xl mb-2">Dispatch Activity Heatmap</h2>
            <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-6">Volume of active reports over the last 28 days.</p>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* CSS Heatmap Grid */}
              <div className="grid grid-cols-7 gap-2 md:gap-3 p-4 bg-app-bg border border-border-subtle rounded-sm w-full max-w-sm">
                
                {/* Days Header */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-text-muted">{day}</div>
                ))}

                {/* Heatmap Cells */}
                {stats.weeklyActivity.map((val, i) => (
                  <div 
                    key={i}
                    className={`aspect-square rounded-sm ${getHeatmapColor(val)} hover:scale-110 transition-transform cursor-crosshair border border-black/5 dark:border-white/5 relative group`}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface text-text-primary text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-border-strong opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                      {val} reports
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-brand-primary/20"></div>
                  <div className="w-3 h-3 rounded-sm bg-brand-primary/40"></div>
                  <div className="w-3 h-3 rounded-sm bg-brand-primary/60"></div>
                  <div className="w-3 h-3 rounded-sm bg-brand-primary/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-brand-primary/100"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
