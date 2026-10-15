import { useTheme } from '../../context/ThemeContext';

export default function TacticalBackground() {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const dotColor = isLight ? '#112D4E' : '#3F72AF';
  const contourColor = isLight ? '#3F72AF' : '#60A5FA';

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Layer 1: Ambient Engineering Dot Grid */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isLight ? 0.05 : 0.08,
          backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: '44px 44px',
        }}
      />

      {/* Layer 2: Subtle Ambient Atmospheric Glows */}
      <div 
        className={`absolute -top-32 -right-32 w-96 md:w-[600px] h-96 md:h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-700 ${
          isLight ? 'bg-brand-primary/10' : 'bg-brand-primary/15'
        }`}
      />
      <div 
        className={`absolute -bottom-32 -left-32 w-80 md:w-[500px] h-80 md:h-[500px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isLight ? 'bg-brand-light/40' : 'bg-[#1E416D]/30'
        }`}
      />

      {/* Layer 3: Faint Bathymetric Watermark - Top Right */}
      <div className="absolute top-0 right-0 w-[500px] h-[380px] opacity-60 overflow-hidden pointer-events-none">
        <svg 
          className="w-full h-full" 
          viewBox="0 0 600 450" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={contourColor} strokeWidth="1.2" opacity={isLight ? 0.2 : 0.28}>
            <path d="M120,-40 C220,60 380,20 480,120 S560,240 640,280" />
            <path d="M200,-50 C300,70 420,50 510,160 S580,290 660,340" />
            <path d="M280,-60 C380,80 460,90 540,210 S600,340 680,410" />
            <path d="M360,-70 C460,90 500,130 570,260 S630,390 700,470" />
            {/* Dashed micro contour line */}
            <path 
              d="M160,-45 C260,65 400,35 495,140 S570,265 650,310" 
              strokeDasharray="4 8"
              opacity="0.6"
            />
          </g>
        </svg>
      </div>

      {/* Layer 4: Faint Bathymetric Watermark - Bottom Left */}
      <div className="absolute bottom-0 left-0 w-[450px] h-[340px] opacity-60 overflow-hidden pointer-events-none">
        <svg 
          className="w-full h-full" 
          viewBox="0 0 550 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <g stroke={contourColor} strokeWidth="1.2" opacity={isLight ? 0.18 : 0.25}>
            <path d="M-60,180 C80,120 160,260 280,220 S420,320 500,360" />
            <path d="M-50,250 C90,190 180,310 300,270 S440,360 520,410" />
            <path d="M-40,320 C100,260 200,360 320,320 S460,400 540,460" />
            {/* Dashed micro contour line */}
            <path 
              d="M-55,215 C85,155 170,285 290,245 S430,340 510,385" 
              strokeDasharray="4 8"
              opacity="0.5"
            />
          </g>
        </svg>
      </div>

      {/* Layer 5: Technical Telemetry Accents */}
      <div className="absolute top-6 left-6 text-text-muted/20 font-data text-[10px] tracking-widest hidden md:block">
        + ESTE-SYS // 14°35'N 120°58'E
      </div>
      <div className="absolute bottom-6 right-6 text-text-muted/20 font-data text-[10px] tracking-widest hidden md:block">
        SYS.GRID.ACTIVE // L-01
      </div>
    </div>
  );
}
