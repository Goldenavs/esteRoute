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
    // Simulate submission
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="bg-surface/80 backdrop-blur-xl border border-border-subtle p-10 rounded-2xl shadow-2xl text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-secondary"></div>
          
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <h2 className="text-3xl font-heading font-black tracking-tight text-text-primary mb-2">Report Submitted</h2>
          <p className="text-text-muted mb-8">Thank you for keeping our community safe. Your report is being processed.</p>
          
          <div className="bg-app-bg w-full p-4 rounded-xl border border-border-subtle mb-8 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Tracking Reference</span>
            <span className="text-xl font-mono font-bold text-brand-primary">ER-2026-000481</span>
          </div>

          <button 
            onClick={() => { setIsSubmitted(false); setHasPhoto(false); setNotes(''); }}
            className="w-full bg-surface border-2 border-border-strong hover:border-brand-primary text-text-primary font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>Submit Another Report</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-text-primary mb-2">Report a Blockage</h1>
        <p className="text-text-muted text-sm md:text-base">Help prevent flooding by reporting clogged esteros and canals in your area.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Photo Upload Section */}
        <section className="bg-surface/60 backdrop-blur-xl border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <Camera className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Photo Evidence <span className="text-semantic-urgent">*</span></h2>
          </div>
          
          {!hasPhoto ? (
            <div 
              onClick={() => setHasPhoto(true)}
              className="w-full h-48 md:h-64 border-2 border-dashed border-border-strong rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-6 h-6 text-brand-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-text-primary">Tap to take a photo</p>
                <p className="text-xs text-text-muted mt-1">or browse gallery (Max 8MB)</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden group border border-border-subtle">
              <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
              {/* Placeholder for uploaded image */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596767746408-db2891d4e0e2?q=80&w=1000')] bg-cover bg-center mix-blend-overlay opacity-80"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              
              <button 
                type="button"
                onClick={() => setHasPhoto(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-semantic-urgent backdrop-blur-md rounded-full text-white transition-colors duration-300"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white/90 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span>Image attached</span>
              </div>
            </div>
          )}
        </section>

        {/* Location Section */}
        <section className="bg-surface/60 backdrop-blur-xl border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-secondary/10 rounded-lg text-brand-secondary">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Location <span className="text-semantic-urgent">*</span></h2>
          </div>

          <div className="w-full h-[200px] bg-app-bg border border-border-subtle rounded-xl overflow-hidden relative flex items-center justify-center">
            {/* Map Placeholder */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blue-500/10"></div>
            <MapIcon className="w-12 h-12 text-border-strong absolute" />
            
            <div className="z-10 bg-surface/90 backdrop-blur-sm border border-border-subtle px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transform translate-y-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
              </span>
              <span className="text-xs font-bold text-text-primary">Acquiring GPS...</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-3 flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-text-secondary" />
            <span>Drag the pin to adjust the exact location if the GPS is inaccurate.</span>
          </p>
        </section>

        {/* Notes Section */}
        <section className="bg-surface/60 backdrop-blur-xl border border-border-subtle rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg text-text-secondary">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Additional Notes</h2>
            </div>
            <span className="text-xs text-text-muted font-mono">{notes.length}/280</span>
          </div>

          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 280))}
            placeholder="Provide any additional details about the blockage..."
            className="w-full bg-app-bg border border-border-subtle rounded-xl p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all resize-none min-h-[100px]"
          />
        </section>

        {/* Submit Button */}
        <button 
          type="submit"
          className={twMerge(
            clsx(
              "w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-brand-primary/25",
              hasPhoto 
                ? "bg-brand-primary hover:bg-brand-secondary text-white transform hover:-translate-y-1" 
                : "bg-surface border-2 border-border-strong text-text-muted cursor-not-allowed opacity-70"
            )
          )}
          disabled={!hasPhoto}
        >
          <span>Submit Report</span>
          <ChevronRight className={twMerge(clsx("w-5 h-5 transition-transform", hasPhoto && "group-hover:translate-x-1"))} />
        </button>

      </form>
    </div>
  );
}
