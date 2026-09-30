import { Shield, Award, User, Camera, CheckCircle2, Bell, LogOut, Lock, ChevronRight } from 'lucide-react';

export default function CitizenProfile() {
  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      <div className="mb-8 md:mb-12 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-3 border-l-4 border-brand-primary pl-4">Account Profile</h1>
        <p className="text-text-muted text-sm md:text-lg pl-5">Manage your identity, settings, and civic stewardship score. Verified accounts help LGUs prioritize reports faster.</p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Left Column (Identity & Civic ID) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Identity Card */}
          <div className="w-full bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg flex flex-col items-center text-center relative overflow-hidden group -skew-x-[2deg]">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10"></div>
            
            {/* Unskew wrapper for content */}
            <div className="skew-x-[2deg] flex flex-col items-center w-full z-10">
              {/* Profile Picture */}
              <div className="relative mt-6 mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-surface shadow-xl overflow-hidden relative z-10 bg-app-bg">
                  <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300')" }}></div>
                </div>
                <button className="absolute bottom-0 right-0 z-20 p-2.5 bg-brand-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-2xl font-heading font-black text-text-primary flex items-center gap-2 justify-center">
                Aling Nena <CheckCircle2 className="w-5 h-5 text-brand-primary" />
              </h2>
              <p className="text-text-muted font-mono mt-1 tracking-widest">+63 917 123 4567</p>
              
              <div className="mt-6 w-full flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-2 rounded-sm -skew-x-6">
                <Shield className="w-4 h-4 skew-x-6" />
                <span className="skew-x-6 text-xs font-bold uppercase tracking-widest">Verified Reporter</span>
              </div>
            </div>
          </div>

          {/* Civic ID Card */}
          <div className="w-full bg-surface border border-border-strong rounded-sm p-6 shadow-xl relative overflow-hidden -skew-x-[2deg]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-full pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>
            
            <div className="skew-x-[2deg] flex flex-col gap-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-12 shadow-inner">
                    <Award className="w-6 h-6 skew-x-12" />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black text-text-muted uppercase tracking-widest">Civic ID</h2>
                    <p className="text-xl font-heading font-black text-text-primary">ER-8942-X</p>
                  </div>
                </div>
              </div>

              <div className="bg-app-bg p-4 border border-border-subtle rounded-sm flex items-center justify-between -skew-x-[4deg] shadow-inner">
                <div className="skew-x-[4deg] flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Stewardship Credits</p>
                    <p className="text-3xl font-mono font-black text-brand-primary">150</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Forms & Settings) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Personal Information Form */}
          <section className="w-full bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-black tracking-widest uppercase text-text-secondary mb-6 flex items-center gap-3">
              <User className="w-5 h-5 text-brand-primary" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">First Name</label>
                <input type="text" defaultValue="Elena" className="w-full bg-app-bg border border-border-strong rounded-sm px-4 py-3 text-text-primary font-medium focus:outline-none focus:border-brand-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Last Name</label>
                <input type="text" defaultValue="Dela Cruz" className="w-full bg-app-bg border border-border-strong rounded-sm px-4 py-3 text-text-primary font-medium focus:outline-none focus:border-brand-primary transition-colors" />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono font-bold">+63</span>
                  <input type="tel" defaultValue="917 123 4567" className="w-full bg-app-bg border border-border-strong rounded-sm pl-12 pr-4 py-3 text-text-primary font-medium focus:outline-none focus:border-brand-primary transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end pt-6 border-t border-border-subtle">
              <button className="px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold uppercase tracking-widest text-sm rounded-sm transition-all -skew-x-12 shadow-md hover:shadow-lg">
                <span className="skew-x-12 block">Save Changes</span>
              </button>
            </div>
          </section>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-widest uppercase text-text-secondary mb-4 flex items-center gap-3">
                <Bell className="w-5 h-5 text-brand-secondary" /> Notifications
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-brand-primary/50 cursor-pointer transition-colors bg-app-bg">
                  <span className="text-sm font-bold text-text-primary">SMS Updates</span>
                  <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4" />
                </label>
                <label className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-brand-primary/50 cursor-pointer transition-colors bg-app-bg">
                  <span className="text-sm font-bold text-text-primary">Push Notifications</span>
                  <input type="checkbox" defaultChecked className="accent-brand-primary w-4 h-4" />
                </label>
              </div>
            </section>

            <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-sm">
              <h3 className="text-sm font-black tracking-widest uppercase text-text-secondary mb-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-brand-secondary" /> Security
              </h3>
              <div className="flex flex-col gap-3">
                <button className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-text-primary transition-colors bg-app-bg text-left group">
                  <span className="text-sm font-bold text-text-primary">Change Password</span>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                </button>
                <button className="flex items-center justify-between p-3 border border-border-subtle rounded-sm hover:border-semantic-urgent transition-colors bg-app-bg text-left group">
                  <span className="text-sm font-bold text-semantic-urgent">Sign Out</span>
                  <LogOut className="w-4 h-4 text-semantic-urgent/70 group-hover:text-semantic-urgent transition-colors" />
                </button>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
