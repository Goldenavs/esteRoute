import { Archive, Search, Filter, Download, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle } from 'lucide-react';

export default function HistoricalArchiveView() { 
  
  const archiveData = [
    { id: 'RPT-8712', date: '2026-09-28', location: 'Estero de Paco', category: 'Heavy Blockage', status: 'RESOLVED', team: 'Alpha Team' },
    { id: 'RPT-8711', date: '2026-09-28', location: 'Estero de San Miguel', category: 'Siltation', status: 'RESOLVED', team: 'Bravo Team' },
    { id: 'RPT-8710', date: '2026-09-27', location: 'Estero de Binondo', category: 'Illegal Dumping', status: 'FAILED', team: 'Delta Team' },
    { id: 'RPT-8709', date: '2026-09-27', location: 'Estero de Quiapo', category: 'Heavy Blockage', status: 'RESOLVED', team: 'Alpha Team' },
    { id: 'RPT-8708', date: '2026-09-26', location: 'Estero de Magdalena', category: 'Flood Risk', status: 'RESOLVED', team: 'Charlie Team' },
    { id: 'RPT-8707', date: '2026-09-25', location: 'Estero de Vitas', category: 'Siltation', status: 'RESOLVED', team: 'Bravo Team' },
  ];

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
          <button className="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 px-6 py-2.5 flex items-center gap-2 rounded-sm -skew-x-[6deg] hover:bg-brand-secondary hover:text-white transition-colors shadow-lg">
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
              className="w-full bg-app-bg border border-border-subtle rounded-sm py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-brand-primary text-text-primary placeholder:text-text-muted"
            />
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none bg-app-bg border border-border-subtle px-4 py-2 flex items-center justify-center gap-2 rounded-sm hover:border-brand-primary transition-colors text-sm font-bold text-text-secondary">
              <Filter className="w-4 h-4" /> Category
            </button>
            <button className="flex-1 md:flex-none bg-app-bg border border-border-subtle px-4 py-2 flex items-center justify-center gap-2 rounded-sm hover:border-brand-primary transition-colors text-sm font-bold text-text-secondary">
              <Filter className="w-4 h-4" /> Status
            </button>
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
              {archiveData.map((row) => (
                <tr key={row.id} className="hover:bg-app-bg/50 transition-colors group">
                  <td className="p-4 pl-6 font-mono font-bold text-sm text-text-primary">{row.id}</td>
                  <td className="p-4 text-sm text-text-secondary">{row.date}</td>
                  <td className="p-4 text-sm text-text-primary font-medium">{row.location}</td>
                  <td className="p-4 text-sm text-text-secondary">{row.category}</td>
                  <td className="p-4 text-sm text-text-secondary">{row.team}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      row.status === 'RESOLVED' 
                        ? 'bg-semantic-success/10 text-semantic-success border border-semantic-success/20' 
                        : 'bg-semantic-urgent/10 text-semantic-urgent border border-semantic-urgent/20'
                    }`}>
                      {row.status === 'RESOLVED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button className="p-2 bg-surface border border-border-subtle rounded text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm group-hover:bg-app-bg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

      {/* Pagination */}
      <div className="w-full mt-6 flex justify-between items-center -skew-x-[2deg]">
        <span className="skew-x-[2deg] text-xs font-bold uppercase tracking-widest text-text-muted">Showing 1-6 of 248 records</span>
        
        <div className="flex gap-2">
          <button className="bg-surface border border-border-subtle p-2 rounded-sm hover:border-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-text-secondary" disabled>
            <ChevronLeft className="w-4 h-4 skew-x-[2deg]" />
          </button>
          
          <button className="bg-brand-primary text-white px-3 py-1 text-sm font-bold rounded-sm">
            <span className="skew-x-[2deg] block">1</span>
          </button>
          <button className="bg-surface border border-border-subtle hover:bg-surface-subtle px-3 py-1 text-sm font-bold text-text-secondary rounded-sm transition-colors">
            <span className="skew-x-[2deg] block">2</span>
          </button>
          <button className="bg-surface border border-border-subtle hover:bg-surface-subtle px-3 py-1 text-sm font-bold text-text-secondary rounded-sm transition-colors">
            <span className="skew-x-[2deg] block">3</span>
          </button>
          <span className="px-2 py-1 text-text-muted skew-x-[2deg]">...</span>
          <button className="bg-surface border border-border-subtle hover:bg-surface-subtle px-3 py-1 text-sm font-bold text-text-secondary rounded-sm transition-colors">
            <span className="skew-x-[2deg] block">42</span>
          </button>

          <button className="bg-surface border border-border-subtle p-2 rounded-sm hover:border-brand-primary transition-colors text-text-secondary">
            <ChevronRight className="w-4 h-4 skew-x-[2deg]" />
          </button>
        </div>
      </div>

    </div>
  )
}
