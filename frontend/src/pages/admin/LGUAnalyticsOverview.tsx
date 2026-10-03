import { BarChart3, TrendingUp, Clock, AlertTriangle, CheckCircle, Calendar, Map } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function LGUAnalyticsOverview() {
  
  // Dummy Data
  const severityData = [
    { level: 'Critical', percentage: 15, color: 'bg-semantic-urgent' },
    { level: 'Severe', percentage: 25, color: 'bg-orange-500' },
    { level: 'Moderate', percentage: 40, color: 'bg-semantic-warning' },
    { level: 'Minor', percentage: 20, color: 'bg-semantic-info' },
  ];

  const weeklyActivity = [
    45, 52, 38, 65, 80, 42, 30, // Week 1
    50, 60, 45, 70, 85, 55, 40, // Week 2
    40, 48, 35, 55, 65, 38, 25, // Week 3
    60, 75, 50, 80, 95, 70, 55  // Week 4
  ];

  const getHeatmapColor = (value: number) => {
    if (value > 80) return 'bg-brand-primary/100';
    if (value > 60) return 'bg-brand-primary/80';
    if (value > 40) return 'bg-brand-primary/60';
    if (value > 20) return 'bg-brand-primary/40';
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
          <div className="bg-surface border border-border-subtle px-4 py-2 flex items-center gap-2 rounded-sm -skew-x-[6deg] cursor-pointer hover:border-brand-primary transition-colors">
            <Calendar className="w-4 h-4 text-brand-primary skew-x-[6deg]" />
            <span className="skew-x-[6deg] text-sm font-bold uppercase tracking-widest">Last 30 Days</span>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border-subtle p-6 rounded-sm shadow-md relative overflow-hidden -skew-x-[2deg] group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>
          <div className="skew-x-[2deg]">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <CheckCircle className="w-5 h-5 text-semantic-success" />
              <span className="text-xs font-bold uppercase tracking-widest">Total Reports Triaged</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-text-primary">1,248</span>
              <span className="text-sm font-bold text-semantic-success flex items-center mb-1">
                <TrendingUp className="w-4 h-4 mr-1" /> +12%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle p-6 rounded-sm shadow-md relative overflow-hidden -skew-x-[2deg] group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl group-hover:bg-brand-secondary/10 transition-colors"></div>
          <div className="skew-x-[2deg]">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <Clock className="w-5 h-5 text-brand-secondary" />
              <span className="text-xs font-bold uppercase tracking-widest">Avg Clearance Time</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-text-primary">4.2<span className="text-xl text-text-muted ml-1">hrs</span></span>
              <span className="text-sm font-bold text-semantic-success flex items-center mb-1">
                <TrendingUp className="w-4 h-4 mr-1" /> -45m
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border-subtle p-6 rounded-sm shadow-md relative overflow-hidden -skew-x-[2deg] group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-semantic-warning/5 rounded-full blur-2xl group-hover:bg-semantic-warning/10 transition-colors"></div>
          <div className="skew-x-[2deg]">
            <div className="flex items-center gap-2 text-text-muted mb-4">
              <AlertTriangle className="w-5 h-5 text-semantic-warning" />
              <span className="text-xs font-bold uppercase tracking-widest">Flood Risk Index</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-semantic-warning">High</span>
              <span className="text-sm font-bold text-text-muted mb-1 flex items-center gap-1">
                <Map className="w-4 h-4" /> District 3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 flex-1">
        
        {/* Severity Breakdown */}
        <div className="bg-surface border border-border-strong rounded-sm p-6 shadow-xl flex flex-col h-full -skew-x-[2deg]">
          <div className="skew-x-[2deg] h-full flex flex-col">
            <h2 className="font-heading font-black text-xl mb-6">Blockage Severity Breakdown</h2>
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {severityData.map((item) => (
                <div key={item.level} className="w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold uppercase tracking-widest text-text-secondary">{item.level}</span>
                    <span className="text-lg font-black">{item.percentage}%</span>
                  </div>
                  {/* CSS Bar Chart */}
                  <div className="w-full h-4 bg-app-bg rounded-sm overflow-hidden border border-border-subtle">
                    <div 
                      className={`h-full ${item.color} transition-all duration-1000 ease-out rounded-r-sm`} 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dispatch Heatmap */}
        <div className="bg-surface border border-border-strong rounded-sm p-6 shadow-xl flex flex-col h-full -skew-x-[2deg]">
          <div className="skew-x-[2deg] h-full flex flex-col">
            <h2 className="font-heading font-black text-xl mb-2">Dispatch Activity Heatmap</h2>
            <p className="text-text-muted text-sm mb-6">Volume of dispatched units over the last 28 days.</p>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* CSS Heatmap Grid */}
              <div className="grid grid-cols-7 gap-2 md:gap-3 p-4 bg-app-bg border border-border-subtle rounded-sm w-full max-w-sm">
                
                {/* Days Header */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-text-muted">{day}</div>
                ))}

                {/* Heatmap Cells */}
                {weeklyActivity.map((val, i) => (
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
