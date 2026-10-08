import { Archive, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle } from 'lucide-react';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';

export default function HistoricalArchiveView() { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agentResults, setAgentResults] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      // Only fetch closed/terminal states for the archive
      const { data: repData } = await supabase
        .from('reports')
        .select('*')
        .in('status', ['resolved', 'failed', 'false_alarm'])
        .order('created_at', { ascending: false });
        
      const { data: agentData } = await supabase
        .from('agent_results')
        .select('*')
        .eq('agent_type', 'vision_triage');

      if (repData) setReports(repData);
      if (agentData) setAgentResults(agentData);
    };

    fetchData();
  }, []);

  const archiveData = useMemo(() => {
    return reports.map(r => {
      const agentRes = agentResults.find(ar => ar.report_id === r.report_id);
      const category = agentRes?.result_json?.waste_categories?.[0] || 'Unknown';
      const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A';
      const location = (r.location_lat != null && r.location_lng != null)
        ? `[${Number(r.location_lat).toFixed(4)}, ${Number(r.location_lng).toFixed(4)}]`
        : 'Unknown Location';
      
      return {
        id: r.report_id || 'UNKNOWN',
        shortId: (r.report_id || 'UNKNOWN').slice(0, 8).toUpperCase(),
        date,
        location,
        category,
        status: (r.status || 'UNKNOWN').toUpperCase(),
        team: 'LGU Dispatch' // Placeholder until team routing is implemented
      };
    }).filter(item => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.id.toLowerCase().includes(term) || 
             item.location.toLowerCase().includes(term) || 
             item.category.toLowerCase().includes(term) ||
             item.team.toLowerCase().includes(term);
    });
  }, [reports, agentResults, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(archiveData.length / itemsPerPage) || 1;
  const currentData = archiveData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExportCSV = () => {
    if (archiveData.length === 0) return;

    const headers = ['Report ID', 'Date Filed', 'Location', 'Category', 'Dispatch Team', 'Status'];
    
    const csvRows = archiveData.map(row => {
      return [
        `"${row.id}"`,
        `"${row.date}"`,
        `"${row.location}"`,
        `"${row.category}"`,
        `"${row.team}"`,
        `"${row.status.replace('_', ' ')}"`
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

  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-2 flex items-center gap-3">
            <Archive className="w-10 h-10 text-brand-secondary" /> 
            Historical Archive
          </h1>
          <p className="text-text-muted text-sm md:text-lg">Review past resolutions, generate reports, and analyze historical blockage data.</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExportCSV}
            className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 px-6 py-2.5 flex items-center gap-2 rounded-sm -skew-x-[6deg] hover:bg-brand-secondary hover:text-white transition-colors shadow-lg"
          >
            <Download className="w-4 h-4 skew-x-[6deg]" />
            <span className="skew-x-[6deg] text-sm font-bold uppercase tracking-widest">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="w-full bg-surface border border-border-strong p-4 rounded-sm shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center -skew-x-[2deg]">
        <div className="skew-x-[2deg] w-full flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by Report ID, Location, or Team..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset pagination on search
              }}
              className="w-full bg-app-bg border border-border-subtle rounded-sm py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-primary text-text-primary placeholder:text-text-muted"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-none relative bg-app-bg border border-border-subtle flex items-center gap-1 rounded-sm hover:border-brand-primary transition-colors text-sm font-bold text-text-secondary px-2">
              <Filter className="w-4 h-4 ml-1" />
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent py-2 pr-2 outline-none appearance-none cursor-pointer w-full uppercase tracking-widest text-[10px]"
              >
                <option value="ALL" className="bg-surface text-text-primary">All Categories</option>
                <option value="Plastic" className="bg-surface text-text-primary">Plastic</option>
                <option value="Organic" className="bg-surface text-text-primary">Organic</option>
                <option value="Medical" className="bg-surface text-text-primary">Medical</option>
                <option value="Hazardous" className="bg-surface text-text-primary">Hazardous</option>
                <option value="Unknown" className="bg-surface text-text-primary">Unknown</option>
              </select>
            </div>
            
            <div className="flex-1 md:flex-none relative bg-app-bg border border-border-subtle flex items-center gap-1 rounded-sm hover:border-brand-primary transition-colors text-sm font-bold text-text-secondary px-2">
              <Filter className="w-4 h-4 ml-1" />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent py-2 pr-2 outline-none appearance-none cursor-pointer w-full uppercase tracking-widest text-[10px]"
              >
                <option value="ALL" className="bg-surface text-text-primary">All Status</option>
                <option value="RESOLVED" className="bg-surface text-text-primary">Resolved</option>
                <option value="FALSE_ALARM" className="bg-surface text-text-primary">False Alarm</option>
                <option value="FAILED" className="bg-surface text-text-primary">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full bg-surface border border-border-strong rounded-sm shadow-xl flex flex-col flex-1 -skew-x-[2deg] overflow-hidden">
        <div className="skew-x-[2deg] h-full flex flex-col w-full overflow-x-auto">
          
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-subtle border-b border-border-strong text-xs uppercase tracking-widest text-text-muted font-bold">
                <th className="p-4 pl-6">Report ID</th>
                <th className="p-4">Date Filed</th>
                <th className="p-4">Location</th>
                <th className="p-4">Category</th>
                <th className="p-4">Dispatch Team</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {currentData.map((row) => (
                <tr key={row.id} className="hover:bg-app-bg/50 transition-colors group">
                  <td className="p-4 pl-6 font-mono font-bold text-sm text-text-primary">{row.shortId}</td>
                  <td className="p-4 text-sm text-text-secondary">{row.date}</td>
                  <td className="p-4 text-sm text-text-primary font-medium">{row.location}</td>
                  <td className="p-4 text-sm text-text-secondary">{row.category}</td>
                  <td className="p-4 text-sm text-text-secondary">{row.team}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      row.status === 'RESOLVED' 
                        ? 'bg-semantic-success/10 text-semantic-success border border-semantic-success/20' 
                        : row.status === 'FALSE_ALARM'
                        ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20'
                        : 'bg-semantic-urgent/10 text-semantic-urgent border border-semantic-urgent/20'
                    }`}>
                      {row.status === 'RESOLVED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {row.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button className="p-2 bg-surface border border-border-subtle rounded text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm group-hover:bg-app-bg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {currentData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted font-bold italic text-sm">
                    No archive records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      </div>

      {/* Pagination */}
      <div className="w-full mt-6 flex justify-between items-center -skew-x-[2deg]">
        <span className="skew-x-[2deg] text-xs font-bold uppercase tracking-widest text-text-muted">
          Showing {archiveData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, archiveData.length)} of {archiveData.length} records
        </span>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="bg-surface border border-border-subtle p-2 rounded-sm hover:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary"
          >
            <ChevronLeft className="w-4 h-4 skew-x-[2deg]" />
          </button>
          
          <button className="bg-brand-primary text-white px-3 py-1 text-sm font-bold rounded-sm">
            <span className="skew-x-[2deg] block">{currentPage}</span>
          </button>
          
          <span className="px-2 py-1 text-text-muted skew-x-[2deg]">/ {totalPages}</span>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="bg-surface border border-border-subtle p-2 rounded-sm hover:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary"
          >
            <ChevronRight className="w-4 h-4 skew-x-[2deg]" />
          </button>
        </div>
      </div>

    </div>
  )
}
