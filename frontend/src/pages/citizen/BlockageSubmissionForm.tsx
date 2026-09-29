import { useState } from 'react';
import { Camera, MapPin, Map as MapIcon, UploadCloud, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function BlockageSubmissionForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-lg bg-surface/90 backdrop-blur-xl border border-border-subtle rounded-sm shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-secondary"></div>
          
          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            
            <h2 className="text-3xl font-heading font-black tracking-tight text-text-primary mb-2">Report Submitted</h2>
            <p className="text-text-muted mb-8">Thank you for keeping our community safe. Your report is being processed.</p>
            
            <div className="bg-app-bg w-full p-5 rounded-sm border border-border-subtle mb-8 flex flex-col gap-1 -skew-x-6 relative">
              <span className="skew-x-6 text-xs font-bold uppercase tracking-widest text-text-muted">Tracking Reference</span>
              <span className="skew-x-6 text-2xl font-mono font-black text-brand-primary">ER-2026-000481</span>
            </div>

            <button 
              onClick={() => { setIsSubmitted(false); setHasPhoto(false); setNotes(''); }}
              className="w-full bg-surface border-2 border-border-strong hover:border-brand-primary text-text-primary font-bold py-4 px-4 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group -skew-x-12"
            >
              <span className="skew-x-12 uppercase tracking-widest">Submit Another Report</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      
      <div className="mb-8 md:mb-12 max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-4 border-l-4 border-brand-primary pl-4">Report a Blockage</h1>
        <p className="text-text-muted text-sm md:text-lg pl-5">Help prevent flooding by reporting clogged esteros and canals in your area. Our AI will automatically assess the severity and notify the local government.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        
        {/* Left Column (Photo & Map) */}
        <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
          
          {/* Photo Upload Section */}
          <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg shadow-black/5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-primary/10 rounded-sm text-brand-primary -skew-x-6">
                  <Camera className="w-5 h-5 skew-x-6" />
                </div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider">Photo Evidence</h2>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest bg-semantic-urgent text-white px-2 py-1 rounded-sm -skew-x-12 shadow-sm">
                <span className="skew-x-12 block">Required</span>
              </span>
            </div>
            
            {!hasPhoto ? (
              <div 
                onClick={() => setHasPhoto(true)}
                className="w-full h-56 md:h-72 border-2 border-dashed border-border-strong rounded-sm flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-300 group bg-app-bg/50"
              >
                <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 border border-border-subtle">
                  <UploadCloud className="w-7 h-7 text-brand-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-text-primary text-lg">Tap to take a photo</p>
                  <p className="text-sm text-text-muted mt-1">or browse gallery (Max 8MB)</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-56 md:h-72 rounded-sm overflow-hidden group border border-border-subtle shadow-inner">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596767746408-db2891d4e0e2?q=80&w=1000')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                <button 
                  type="button"
                  onClick={() => setHasPhoto(false)}
                  className="absolute top-4 right-4 p-2.5 bg-black/50 hover:bg-semantic-urgent backdrop-blur-md rounded-full text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm font-bold bg-green-500/90 backdrop-blur-md px-4 py-2 rounded-sm -skew-x-12 shadow-lg">
                  <span className="skew-x-12 flex items-center gap-2 tracking-wide uppercase">
                    <CheckCircle2 className="w-5 h-5" />
                    Image Attached
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* Location Section */}
          <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg shadow-black/5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-secondary/10 rounded-sm text-brand-secondary -skew-x-6">
                  <MapPin className="w-5 h-5 skew-x-6" />
                </div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider">Location</h2>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest bg-semantic-urgent text-white px-2 py-1 rounded-sm -skew-x-12 shadow-sm">
                <span className="skew-x-12 block">Required</span>
              </span>
            </div>

            <div className="w-full h-[240px] bg-app-bg border border-border-subtle rounded-sm overflow-hidden relative flex items-center justify-center shadow-inner group">
              {/* Map Placeholder */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blue-500/10"></div>
              <MapIcon className="w-16 h-16 text-border-strong absolute group-hover:scale-110 transition-transform duration-700" />
              
              <div className="z-10 bg-surface border border-border-subtle px-6 py-3 rounded-sm shadow-xl flex items-center gap-3 transform translate-y-6 -skew-x-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                <div className="skew-x-12 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                  </span>
                  <span className="text-sm font-bold text-text-primary uppercase tracking-widest">Acquiring GPS</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-text-muted mt-5 flex items-start gap-2 bg-app-bg/50 p-3 rounded-sm border border-border-subtle">
              <AlertCircle className="w-5 h-5 shrink-0 text-brand-secondary" />
              <span>Drag the pin to adjust the exact location if the GPS is inaccurate.</span>
            </p>
          </section>

        </div>

        {/* Right Column (Notes & Submit) */}
        <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8 h-full">
          
          {/* Notes Section */}
          <section className="bg-surface/80 backdrop-blur-xl border border-border-subtle rounded-sm p-6 shadow-lg shadow-black/5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-500/10 rounded-sm text-text-secondary -skew-x-6">
                  <AlertCircle className="w-5 h-5 skew-x-6" />
                </div>
                <h2 className="text-lg font-bold text-text-primary uppercase tracking-wider">Notes</h2>
              </div>
              <span className="text-xs text-text-muted font-mono bg-app-bg px-2.5 py-1 rounded-sm border border-border-subtle shadow-sm -skew-x-6">
                <span className="skew-x-6 block">{notes.length}/280</span>
              </span>
            </div>

            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 280))}
              placeholder="Provide any additional details about the blockage (e.g. 'Water is almost overflowing onto the street')..."
              className="w-full flex-1 bg-app-bg/80 border border-border-subtle rounded-sm p-5 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all resize-none min-h-[200px] lg:min-h-0 shadow-inner"
            />
          </section>

          {/* Submit Button */}
          <button 
            type="submit"
            className={twMerge(
              clsx(
                "w-full py-6 px-6 rounded-sm font-black text-xl tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-300 -skew-x-12 group shadow-[0px_4px_15px_rgba(0,0,0,0.1)]",
                hasPhoto 
                  ? "bg-brand-primary hover:bg-brand-secondary text-white hover:translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_rgba(0,0,0,0.2)]" 
                  : "bg-surface border-2 border-border-strong text-text-muted cursor-not-allowed opacity-80"
              )
            )}
            disabled={!hasPhoto}
          >
            <div className="skew-x-12 flex items-center gap-2">
              <span>Submit Report</span>
              <ChevronRight className={twMerge(clsx("w-6 h-6 transition-transform", hasPhoto && "group-hover:translate-x-2"))} />
            </div>
          </button>

        </div>

      </form>
    </div>
  );
}
