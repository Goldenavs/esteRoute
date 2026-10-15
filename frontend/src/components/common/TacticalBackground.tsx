import { useTheme } from '../../context/ThemeContext';

export default function TacticalBackground() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const strokeColor = isLight ? '#3F72AF' : '#60A5FA';
  const dotColor = isLight ? '#112D4E' : '#3F72AF';

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Layer 1: Ambient Engineering Dot Grid */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isLight ? 0.06 : 0.10,
          backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Layer 2: Subtle Ambient Atmospheric Glows */}
      <div 
        className={`absolute -top-32 -right-32 w-96 md:w-[600px] h-96 md:h-[600px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isLight ? 'bg-brand-primary/8' : 'bg-brand-primary/12'
        }`}
      />
      <div 
        className={`absolute -bottom-32 -left-32 w-80 md:w-[500px] h-80 md:h-[500px] rounded-full blur-[160px] pointer-events-none transition-opacity duration-700 ${
          isLight ? 'bg-brand-light/30' : 'bg-[#1E416D]/20'
        }`}
      />

      {/* Layer 3: Topographic / Bathymetric Contour Lines (Identical Landing Page Style, Static & Calm) */}
      <div className="absolute inset-0 opacity-70">
        <svg 
          className="w-full h-full min-w-[1200px] min-h-[900px]" 
          viewBox="0 0 1600 1200" 
          preserveAspectRatio="none" 
          fill="none"
        >
          {/* Wave group A: Primary natural elevation curves */}
          <g
            stroke={strokeColor}
            strokeWidth="1.4"
            opacity={isLight ? 0.18 : 0.28}
          >
            <path d="M-200,120 C200,40 500,240 950,150 S1450,40 1900,180" />
            <path d="M-200,280 C150,190 550,400 1000,290 S1500,190 1900,340" />
            <path d="M-200,450 C240,360 450,560 960,460 S1550,360 1900,520" />
            <path d="M-200,620 C160,530 580,720 1050,620 S1480,520 1900,690" />
            <path d="M-200,800 C260,700 480,900 980,810 S1520,700 1900,860" />
            <path d="M-200,980 C180,880 600,1060 1080,970 S1500,860 1900,1040" />
          </g>

          {/* Wave group B: Secondary dashed bathymetric currents */}
          <g
            stroke={strokeColor}
            strokeWidth="1.0"
            strokeDasharray="10 10"
            opacity={isLight ? 0.14 : 0.22}
          >
            <path d="M-200,200 C300,100 650,320 1100,220 S1600,100 1900,260" />
            <path d="M-200,530 C200,430 620,630 1080,530 S1560,430 1900,590" />
            <path d="M-200,890 C320,780 680,980 1150,880 S1620,770 1900,940" />
          </g>
        </svg>
      </div>
    </div>
  );
}
