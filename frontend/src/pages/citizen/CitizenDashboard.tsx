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
        <div className="w-full bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-5 md:p-8 shadow-lg shadow-black/5 relative overflow-hidden group">
          {/* Subtle Accent Edge */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary"></div>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
             
             {/* Image */}
             <div className="w-full md:w-48 h-48 md:h-36 rounded-sm border border-border-subtle overflow-hidden shrink-0 relative shadow-inner">
               <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${dummyReports[0].image})`}}></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
               <div className="absolute bottom-3 left-3">
                 <span className="px-2.5 py-1 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-sm -skew-x-12 shadow-md inline-block">
                   <span className="skew-x-12 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Active Case</span>
                 </span>
               </div>
             </div>

             {/* Info */}
             <div className="flex-1 flex flex-col gap-2 w-full">
               <span className="text-text-muted text-xs font-mono tracking-wide">{dummyReports[0].date}</span>
               
               <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-text-primary group-hover:text-brand-primary transition-colors">{dummyReports[0].id}</h2>
               
               <div className="flex items-start gap-2 text-text-secondary mt-1 md:mt-2">
                 <MapPin className="w-5 h-5 text-brand-secondary shrink-0 mt-0.5" />
                 <span className="font-medium text-sm md:text-base leading-snug">{dummyReports[0].location}</span>
               </div>
             </div>

             {/* Action */}
             <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-border-subtle pt-5 md:pt-0 md:pl-8">
                <button className="w-full md:w-auto py-3.5 px-6 bg-app-bg border border-border-strong hover:border-brand-primary hover:bg-brand-primary/5 transition-all rounded-sm -skew-x-[6deg] flex items-center justify-center shadow-sm">
                  <span className="skew-x-[6deg] font-bold text-xs uppercase tracking-widest flex items-center gap-2 text-text-primary">
                    View <ChevronRight className="w-5 h-5 text-brand-primary" />
                  </span>
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
              <div key={idx} className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-5 shadow-sm hover:shadow-lg flex flex-col hover:border-border-strong hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                
                {/* Accent background graphic */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-text-muted/5 to-transparent rounded-bl-full pointer-events-none"></div>

                <div className="flex items-start justify-between mb-5">
                  <span className={twMerge(clsx("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm -skew-x-[6deg] border", getStatusColor(report.status)))}>
                    <span className="skew-x-[6deg] flex items-center gap-1.5">{getStatusIcon(report.status)} {report.status}</span>
                  </span>
                  <span className="text-text-muted text-[11px] font-mono tracking-wider">{report.date.split('•')[0].trim()}</span>
                </div>
                
                <h4 className="text-xl md:text-2xl font-heading font-bold text-text-primary mb-3 group-hover:text-brand-primary transition-colors">{report.id}</h4>
                
                <div className="flex items-start gap-2 text-text-secondary text-sm mt-auto bg-app-bg/50 p-3 rounded-sm border border-border-subtle -skew-x-[2deg]">
                  <MapPin className="w-4 h-4 shrink-0 text-text-muted skew-x-[2deg]" />
                  <span className="font-medium line-clamp-1 skew-x-[2deg]">{report.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
