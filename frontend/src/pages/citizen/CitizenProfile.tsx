import { Shield, Award, Settings, Trash2 } from 'lucide-react';

export default function CitizenProfile() {
  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      <div className="mb-8 md:mb-10 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-3 border-l-4 border-brand-primary pl-4">Civic ID</h1>
        <p className="text-text-muted text-sm md:text-lg pl-5">Your anonymous local profile. Earn stewardship credits for verified reports.</p>
      </div>

      <div className="w-full max-w-md mx-auto md:mx-0 flex flex-col gap-6">
        
        {/* Civic ID Card */}
        <div className="w-full bg-surface border border-border-strong rounded-sm p-6 shadow-2xl relative overflow-hidden group -skew-x-[2deg]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-full pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
          
          <div className="skew-x-[2deg] flex flex-col gap-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-12 shadow-inner">
                  <Shield className="w-6 h-6 skew-x-12" />
                </div>
                <div>
                  <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Anonymous Citizen</h2>
                  <p className="text-xl md:text-2xl font-heading font-black text-text-primary">ID: ER-8942-X</p>
                </div>
              </div>
            </div>

            <div className="bg-app-bg p-4 border border-border-subtle rounded-sm flex items-center justify-between -skew-x-[4deg] shadow-inner">
              <div className="skew-x-[4deg] flex items-center gap-4">
                <Award className="w-8 h-8 md:w-10 md:h-10 text-brand-secondary" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stewardship Credits</p>
                  <p className="text-3xl md:text-4xl font-mono font-black text-brand-primary">150</p>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-text-secondary flex items-start gap-2 bg-text-muted/5 p-3 rounded-sm border border-border-subtle">
              <span className="font-bold">Note:</span> Credits are stored locally on your device. Clearing your browser data will reset your Civic ID.
            </p>
          </div>
        </div>

        {/* Settings / Actions */}
        <div className="flex flex-col gap-3 mt-4">
          <h3 className="text-sm font-black tracking-widest uppercase text-text-muted mb-2">Settings & Data</h3>
          
          <button className="flex items-center justify-between p-4 bg-surface border border-border-subtle rounded-sm hover:border-brand-primary hover:bg-brand-primary/5 transition-all group">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-text-secondary group-hover:text-brand-primary transition-colors" />
              <span className="font-bold text-sm text-text-primary">App Preferences</span>
            </div>
          </button>

          <button className="flex items-center justify-between p-4 bg-surface border border-border-subtle rounded-sm hover:border-semantic-urgent hover:bg-semantic-urgent/5 transition-all group">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-text-secondary group-hover:text-semantic-urgent transition-colors" />
              <span className="font-bold text-sm text-text-primary group-hover:text-semantic-urgent transition-colors">Clear Local History</span>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
