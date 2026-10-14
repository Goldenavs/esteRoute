import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  MapPin, 
  ArrowRight, 
  ShieldCheck, 
  CloudRain, 
  CheckCircle2, 
  ChevronDown, 
  AlertTriangle,
  Sparkles,
  Radio
} from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  scrollTo: (id: string) => void;
  onOpenModal: (type: 'admin' | 'citizen') => void;
}

export default function HeroSection({ scrollTo, onOpenModal }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section 
      id="hero" 
      className="relative min-h-screen w-full flex flex-col justify-between pt-28 lg:pt-36 pb-12 px-6 lg:px-16 bg-app-bg overflow-hidden"
    >
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-48 w-[28rem] h-[28rem] bg-brand-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main Content Grid */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center my-auto z-10">
        
        {/* Left Column: Citizen Value Proposition & Direct Actions */}
        <motion.div 
          className="lg:col-span-7 flex flex-col items-start"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Civic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider">
              Urban Drainage & Flood Mitigation System
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight text-text-primary leading-[1.1] mb-6">
            Keep our esteros clean. <br />
            <span className="text-brand-primary">Protect our community</span> from flash floods.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-text-secondary leading-relaxed max-w-2xl mb-8 font-normal">
            An open civic platform connecting residents with municipal sanitation units. 
            Snap a geotagged photo of canal blockages to automatically trigger AI-driven flood risk triage 
            and prioritized LGU clean-up dispatches.
          </p>

          {/* Primary Action Buttons */}
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/citizen')}
              className="flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            >
              <Camera className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>Report a Blockage</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => navigate('/citizen/public-map')}
              className="flex items-center justify-center gap-2.5 bg-surface hover:bg-surface-subtle text-text-primary border border-border-subtle hover:border-brand-primary/50 px-7 py-4 rounded-xl font-bold text-base shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <MapPin className="w-5 h-5 text-brand-primary" />
              <span>View Estero Status Map</span>
            </button>
          </div>

          {/* Frictionless Trust Badges */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-text-secondary font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
              <span>No sign-up required to report</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
              <span>Instant GPS location tagging</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
              <span>Free & community-accessible</span>
            </div>
          </div>

          {/* Subtle Municipal LGU Login Link */}
          <div className="mt-8 pt-6 border-t border-border-subtle/80 w-full max-w-lg flex items-center justify-between text-xs sm:text-sm text-text-secondary">
            <span>Are you an LGU municipal or sanitation officer?</span>
            <button
              type="button"
              onClick={() => onOpenModal('admin')}
              className="text-brand-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer ml-2 shrink-0"
            >
              <span>Dispatcher Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Right Column: Live Incident & Triage Demonstration Card */}
        <motion.div 
          className="lg:col-span-5 w-full flex justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-full max-w-md bg-surface/90 backdrop-blur-xl border border-border-subtle rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden group">
            
            {/* Live Telemetry Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-urgent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-semantic-urgent"></span>
                </span>
                <span className="text-xs font-heading font-black tracking-wider uppercase text-text-primary">
                  Live Dispatch Stream
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle text-text-secondary text-[11px] font-semibold border border-border-subtle/60">
                <Radio className="w-3 h-3 text-brand-primary animate-pulse" />
                <span>Real-Time</span>
              </div>
            </div>

            {/* Estero Incident Photo Snapshot */}
            <div className="relative mt-4 rounded-xl overflow-hidden aspect-video bg-surface-subtle border border-border-subtle">
              <img 
                src="/Auth/CitizenAuth.jpg" 
                alt="Estero Canal Inspection" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Location Badge on Photo */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  <span className="truncate">Estero de Binondo, Manila</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/20">
                  Tag: Canal Blockage
                </span>
              </div>
            </div>

            {/* AI Automated Synthesis Preview */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Vision AI Pill */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle/80 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-brand-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Vision Triage</span>
                </div>
                <span className="text-xs font-semibold text-text-primary line-clamp-1">
                  Plastics & Debris
                </span>
                <span className="text-[10px] text-text-secondary">82% Canal Occlusion</span>
              </div>

              {/* Rain Risk Pill */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border-subtle/80 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-blue-500">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">48h Rain Risk</span>
                </div>
                <span className="text-xs font-semibold text-text-primary line-clamp-1">
                  High Precipitation
                </span>
                <span className="text-[10px] text-text-secondary">Open-Meteo Radar</span>
              </div>
            </div>

            {/* Priority Score Banner */}
            <div className="mt-4 p-3.5 rounded-xl bg-semantic-urgent/10 border border-semantic-urgent/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-semantic-urgent/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-semantic-urgent" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary">Computed Priority Score</div>
                  <div className="text-[11px] text-text-secondary">Composite hazard algorithm</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-heading font-black text-semantic-urgent">91</span>
                <span className="text-[10px] text-text-muted">/100</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
              <span className="text-text-secondary">Status:</span>
              <span className="font-bold text-semantic-warning flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning animate-pulse" />
                Dispatched to Sanitation Fleet
              </span>
            </div>

          </div>
        </motion.div>

      </div>

      {/* Downward Scroll Indicator to Features */}
      <div className="w-full flex justify-center pt-8 z-10">
        <button 
          onClick={() => scrollTo('features')}
          className="flex flex-col items-center gap-1.5 text-text-muted hover:text-brand-primary transition-colors cursor-pointer group"
        >
          <span className="text-[11px] font-bold uppercase tracking-widest group-hover:tracking-wider transition-all">
            Explore How It Works
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
