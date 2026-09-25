import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Navigation, MonitorDot, Camera, MapPin, Sprout, ChevronDown, ArrowRight } from 'lucide-react';

export default function UniversalLogin() {
  const [hoveredPanel, setHoveredPanel] = useState<'admin' | 'citizen' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar when scrolled down slightly (e.g., 20% of viewport)
      setIsScrolled(window.scrollY > window.innerHeight * 0.2);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth flex-grow ratios for desktop hover effect
  const adminFlex = hoveredPanel === 'admin' ? 1.4 : hoveredPanel === 'citizen' ? 0.8 : 1;
  const citizenFlex = hoveredPanel === 'citizen' ? 1.4 : hoveredPanel === 'admin' ? 0.8 : 1;

  return (
    <div className="min-h-screen bg-app-bg text-text-primary w-full overflow-x-hidden">
      
      {/* Sticky Navbar (Appears on Scroll) */}
      <div 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${
          isScrolled ? 'translate-y-0 opacity-100 bg-surface/80 backdrop-blur-md border-b border-border-subtle shadow-sm' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-heading font-bold text-xl text-text-primary tracking-tight">
            esteRoute
          </div>
          <div className="flex gap-3">
            <Link to="/citizen" className="text-sm font-bold bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary/90 transition-colors">
              Citizen
            </Link>
            <Link to="/admin" className="text-sm font-bold bg-brand-dark text-white px-4 py-2 rounded-lg hover:bg-brand-dark/90 transition-colors">
              Dispatcher
            </Link>
          </div>
        </div>
      </div>
      
      {/* Hero Section - 100vh Split Screen */}
      <section className="relative h-screen w-full flex flex-col md:flex-row">
        
        {/* Left Side: Dispatcher / Admin */}
        <div 
          className="relative h-1/2 md:h-full flex flex-col justify-center items-center p-8 transition-all duration-700 ease-in-out border-b md:border-b-0 md:border-r border-border-subtle bg-surface/50 overflow-hidden group"
          style={{ flex: adminFlex }}
          onMouseEnter={() => setHoveredPanel('admin')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-dark via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-md w-full flex flex-col items-center md:items-start text-center md:text-left transition-transform duration-700 group-hover:-translate-y-2">
            <div className="bg-brand-dark/20 p-4 rounded-2xl mb-6 ring-1 ring-brand-dark/30 group-hover:ring-brand-dark transition-all">
              <ShieldAlert className="w-10 h-10 text-brand-dark" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight">
              LGU Command
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              Dispatcher portal for real-time estero blockage monitoring, AI-optimized drone routes, and clean-up fleet management.
            </p>
            
            <div className="space-y-4 mb-10 w-full">
              <FeatureItem icon={<Navigation className="w-5 h-5 text-brand-dark" />} text="A* Pathfinding for Cleanup Routes" />
              <FeatureItem icon={<MonitorDot className="w-5 h-5 text-brand-dark" />} text="Live Fleet & Drone Dispatch" />
            </div>

            <Link to="/admin" className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-dark text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-dark/20 transition-all hover:-translate-y-1">
              Enter Dispatch Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Right Side: Citizen */}
        <div 
          className="relative h-1/2 md:h-full flex flex-col justify-center items-center p-8 transition-all duration-700 ease-in-out bg-surface/20 overflow-hidden group"
          style={{ flex: citizenFlex }}
          onMouseEnter={() => setHoveredPanel('citizen')}
          onMouseLeave={() => setHoveredPanel(null)}
        >
           {/* Background pattern */}
           <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-md w-full flex flex-col items-center md:items-start text-center md:text-left transition-transform duration-700 group-hover:-translate-y-2">
            <div className="bg-brand-primary/20 p-4 rounded-2xl mb-6 ring-1 ring-brand-primary/30 group-hover:ring-brand-primary transition-all">
              <Sprout className="w-10 h-10 text-brand-primary" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight">
              Citizen Portal
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              Community gateway to report floating waste, view public waterway safety maps, and track local clean-up progress.
            </p>
            
            <div className="space-y-4 mb-10 w-full">
              <FeatureItem icon={<Camera className="w-5 h-5 text-brand-primary" />} text="Geo-tagged Blockage Reporting" />
              <FeatureItem icon={<MapPin className="w-5 h-5 text-brand-primary" />} text="Public Estero Status Map" />
            </div>

            <Link to="/citizen" className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all hover:-translate-y-1">
              Enter Citizen Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-text-muted z-20 hidden md:flex">
          <span className="text-xs font-bold uppercase tracking-widest mb-2">Explore esteRoute</span>
          <ChevronDown className="w-5 h-5" />
        </div>

      </section>

      {/* Feature Showcase (Below the fold) - Just a placeholder for now */}
      <section className="min-h-screen bg-app-bg py-24 px-8 flex flex-col items-center">
        <div className="max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">Real-time Estero Optimization</h2>
          <p className="text-xl text-text-secondary mb-16">
            Bridging the gap between citizen vigilance and LGU rapid response through smart technology.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-surface border border-border-subtle p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3 text-brand-primary">1. Report</h3>
              <p className="text-text-secondary">Citizens capture photos of waterway blockages which are instantly geo-tagged and uploaded to the public grid.</p>
            </div>
            <div className="bg-surface border border-border-subtle p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3 text-brand-dark">2. Process</h3>
              <p className="text-text-secondary">LGU admins review submissions and our algorithm calculates the most optimal path for drone inspection and boat cleanups.</p>
            </div>
            <div className="bg-surface border border-border-subtle p-6 rounded-2xl">
              <h3 className="font-bold text-xl mb-3 text-success">3. Resolve</h3>
              <p className="text-text-secondary">Track the clean-up progress live as response fleets clear the estero and return it to a safe, flowing state.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-app-bg/50 border border-border-subtle/50 w-full backdrop-blur-sm">
      {icon}
      <span className="font-medium text-text-secondary">{text}</span>
    </div>
  );
}
