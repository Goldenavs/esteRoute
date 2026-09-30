import { MapPin, Clock, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const dummyReports = [
  {
    id: 'ER-2026-000481',
    date: 'Oct 15, 2026 • 2:30 PM',
    status: 'In Progress',
    severity: 'High',
    location: 'Rizal Ave & 4th St',
    image: 'https://images.unsplash.com/photo-1596767746408-db2891d4e0e2?q=80&w=300'
  },
  {
    id: 'ER-2026-000329',
    date: 'Oct 02, 2026 • 9:15 AM',
    status: 'Resolved',
    severity: 'Medium',
    location: 'San Juan Spillway',
    image: 'https://images.unsplash.com/photo-1584449856172-2d8544d6db53?q=80&w=300'
  },
  {
    id: 'ER-2026-000490',
    date: 'Oct 17, 2026 • 11:05 AM',
    status: 'Pending',
    severity: 'Pending AI',
    location: 'Luna Canal Lateral B',
    image: 'https://images.unsplash.com/photo-1621360662234-5835694a50bb?q=80&w=300'
  }
];

export default function CitizenDashboard() {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Resolved': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'In Progress': return 'bg-brand-primary/10 text-brand-primary border-brand-primary/30';
      default: return 'bg-text-muted/10 text-text-secondary border-border-strong';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Resolved': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'In Progress': return <Activity className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      <div className="mb-8 md:mb-10 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-3 border-l-4 border-brand-primary pl-4">My Reports</h1>
        <p className="text-text-muted text-sm md:text-lg pl-5">Track the status of blockages you've reported. We save your history securely on this device.</p>
      </div>

      <div className="w-full flex flex-col gap-6 md:gap-8">
        
        {/* Active Tracking Card (Featured) */}
        <div className="w-full bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-1 shadow-xl shadow-black/5 -skew-x-[2deg] lg:-skew-x-[4deg]">
          <div className="w-full bg-app-bg border border-border-subtle p-5 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center skew-x-[2deg] lg:skew-x-[4deg]">
             
             {/* Info */}
             <div className="flex-1 flex flex-col gap-3">
               <div className="flex flex-wrap items-center gap-3">
                 <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-xs font-black uppercase tracking-widest rounded-sm -skew-x-12">
                   <span className="skew-x-12 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Active Case</span>
                 </span>
                 <span className="text-text-muted text-sm font-mono tracking-wide">{dummyReports[0].date}</span>
               </div>
               
               <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-text-primary">{dummyReports[0].id}</h2>
               
               <div className="flex items-center gap-2 text-text-secondary mt-1">
                 <MapPin className="w-5 h-5 text-brand-secondary shrink-0" />
                 <span className="font-bold">{dummyReports[0].location}</span>
               </div>
             </div>

             {/* Image & Action */}
             <div className="w-full md:w-auto flex items-stretch gap-4 md:pl-6 md:border-l border-border-subtle">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-sm border border-border-strong overflow-hidden shrink-0 -skew-x-6 relative shadow-inner">
                  <div className="w-full h-full skew-x-6 scale-[1.3] bg-cover bg-center absolute inset-0" style={{ backgroundImage: `url(${dummyReports[0].image})`}}></div>
                </div>
                
                <button className="flex-1 md:flex-none px-6 md:px-8 bg-surface border border-border-strong hover:border-brand-primary hover:bg-brand-primary/5 transition-colors rounded-sm -skew-x-12 group shadow-sm">
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-text-secondary group-hover:text-brand-primary group-hover:translate-x-1.5 transition-all skew-x-12" />
                </button>
             </div>

          </div>
        </div>

        {/* History Grid */}
        <div className="mt-4">
          <h3 className="text-lg md:text-xl font-heading font-black tracking-widest uppercase text-text-secondary mb-5 flex items-center gap-4">
            Past Submissions
            <div className="flex-1 h-px bg-border-subtle"></div>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {dummyReports.slice(1).map((report, idx) => (
              <div key={idx} className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-5 shadow-lg shadow-black/5 flex flex-col hover:border-border-strong hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>

                <div className="flex items-start justify-between mb-5">
                  <span className={twMerge(clsx("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm -skew-x-12 border", getStatusColor(report.status)))}>
                    <span className="skew-x-12 flex items-center gap-1.5">{getStatusIcon(report.status)} {report.status}</span>
                  </span>
                  <span className="text-text-muted text-[11px] font-mono tracking-wider">{report.date.split('•')[0].trim()}</span>
                </div>
                
                <h4 className="text-xl md:text-2xl font-heading font-bold text-text-primary mb-3 group-hover:text-brand-primary transition-colors">{report.id}</h4>
                
                <div className="flex items-start gap-2 text-text-secondary text-sm mt-auto bg-app-bg/50 p-3 rounded-sm border border-border-subtle -skew-x-[4deg]">
                  <MapPin className="w-4 h-4 shrink-0 text-brand-secondary skew-x-[4deg]" />
                  <span className="font-medium line-clamp-1 skew-x-[4deg]">{report.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
