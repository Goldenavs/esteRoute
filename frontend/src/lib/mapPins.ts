import L from 'leaflet';

export type EsteroPinVariant = 'critical' | 'moderate' | 'dispatched' | 'resolved' | 'pending' | 'review';

export interface EsteroPinOptions {
  variant?: EsteroPinVariant;
  status?: string;
  priorityScore?: number;
  needsReview?: boolean;
  isSelected?: boolean;
}

export function resolvePinVariant(status?: string, priorityScore: number = 0, needsReview: boolean = false): EsteroPinVariant {
  if (status === 'resolved') return 'resolved';
  if (status === 'pending_analysis' || status === 'pending') return 'pending';
  if (status === 'failed_analysis' || needsReview) return 'review';
  if (status === 'dispatched' || status === 'in_progress' || status === 'acknowledged') return 'dispatched';
  if (status === 'blocked' || status === 'triaged') {
    return priorityScore >= 70 ? 'critical' : 'moderate';
  }
  return 'critical';
}

const PIN_CONFIGS: Record<EsteroPinVariant, {
  gradStart: string;
  gradEnd: string;
  wellBg: string;
  iconSvg: string;
}> = {
  critical: {
    gradStart: '#EF4444',
    gradEnd: '#991B1B',
    wellBg: '#7F1D1D',
    iconSvg: `
      <path d="M16 10L20.8 18.5H11.2L16 10Z" stroke="#FFFFFF" stroke-width="1.6" stroke-linejoin="round"/>
      <line x1="16" y1="13" x2="16" y2="15.2" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="16" cy="17" r="0.75" fill="#FFFFFF"/>
    `,
  },
  moderate: {
    gradStart: '#F59E0B',
    gradEnd: '#B45309',
    wellBg: '#78350F',
    iconSvg: `
      <circle cx="16" cy="15.5" r="4.5" stroke="#FFFFFF" stroke-width="1.6"/>
      <polyline points="16 13 16 15.5 18 16.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  dispatched: {
    gradStart: '#F59E0B',
    gradEnd: '#D97706',
    wellBg: '#78350F',
    iconSvg: `
      <circle cx="16" cy="15.5" r="4.5" stroke="#FFFFFF" stroke-width="1.6"/>
      <polyline points="16 13 16 15.5 18 16.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  resolved: {
    gradStart: '#10B981',
    gradEnd: '#047857',
    wellBg: '#064E3B',
    iconSvg: `
      <polyline points="12.5 15.5 15 18 19.5 13" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  pending: {
    gradStart: '#3B82F6',
    gradEnd: '#1D4ED8',
    wellBg: '#1E3A8A',
    iconSvg: `
      <circle cx="16" cy="15.5" r="2.2" fill="#FFFFFF"/>
      <circle cx="16" cy="15.5" r="5" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="2 2"/>
    `,
  },
  review: {
    gradStart: '#8B5CF6',
    gradEnd: '#6D28D9',
    wellBg: '#4C1D95',
    iconSvg: `
      <circle cx="15" cy="14.5" r="3.5" stroke="#FFFFFF" stroke-width="1.6"/>
      <line x1="17.6" y1="17.1" x2="20" y2="19.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
    `,
  },
};

/**
 * Creates a high-grade, precision vector teardrop pin marker with smooth curves,
 * inner depth badge, and clean drop shadow (no harsh neon glow).
 */
export function createEsteroMarkerIcon(options: EsteroPinOptions = {}): L.DivIcon {
  const { status, priorityScore = 0, needsReview = false, isSelected = false } = options;
  const variant = options.variant || resolvePinVariant(status, priorityScore, needsReview);
  const cfg = PIN_CONFIGS[variant] || PIN_CONFIGS.critical;

  const width = isSelected ? 34 : 30;
  const height = isSelected ? 46 : 42;
  const filterId = `estero-pin-shadow-${variant}-${isSelected ? 'sel' : 'def'}`;
  const gradId = `estero-pin-grad-${variant}-${isSelected ? 'sel' : 'def'}`;

  // SVG Teardrop geometry: Top circle r=13 centered at (16, 15.5), tapering down smoothly to (16, 40.5)
  // Selected state uses crisp white 2.4px border and subtle scale elevation without eye-straining glow
  const strokeWidth = isSelected ? '2.4' : '1.8';
  const shadowSpread = isSelected ? '3.5' : '2';
  const shadowOpacity = isSelected ? '0.6' : '0.45';

  const svgHtml = `
    <svg width="${width}" height="${height}" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform duration-200 group-hover:scale-110 ${isSelected ? 'scale-110' : ''}">
      <defs>
        <filter id="${filterId}" x="-25%" y="-15%" width="150%" height="135%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="${shadowSpread}" flood-color="#000000" flood-opacity="${shadowOpacity}"/>
        </filter>
        <linearGradient id="${gradId}" x1="16" y1="2" x2="16" y2="40.5" gradientUnits="userSpaceOnUse">
          <stop stop-color="${cfg.gradStart}"/>
          <stop offset="1" stop-color="${cfg.gradEnd}"/>
        </linearGradient>
      </defs>

      <!-- Main Pin Body -->
      <path filter="url(#${filterId})" d="M16 2C8.82 2 3 7.82 3 15.5C3 25.5 14.2 39.2 15.38 40.45C15.72 40.81 16.28 40.81 16.62 40.45C17.8 39.2 29 25.5 29 15.5C29 7.82 23.18 2 16 2Z" fill="url(#${gradId})" stroke="#FFFFFF" stroke-width="${strokeWidth}"/>

      <!-- Inner Depth Well -->
      <circle cx="16" cy="15.5" r="9" fill="${cfg.wellBg}" fill-opacity="0.38"/>

      <!-- Centered Crisp Vector Icon -->
      <g>
        ${cfg.iconSvg}
      </g>
    </svg>
  `;

  return L.divIcon({
    className: `custom-estero-pin ${isSelected ? 'pin-selected' : ''}`,
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group select-none pointer-events-auto">
        ${svgHtml}
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height],
  });
}

/**
 * Creates a high-grade cluster badge showing the aggregated report count and highest severity.
 */
export function createClusterIcon(count: number, highestStatus: string = 'critical'): L.DivIcon {
  const colorMap: Record<string, { bg: string; border: string; shadow: string }> = {
    critical: {
      bg: 'linear-gradient(135deg, #EF4444, #B91C1C)',
      border: '#F87171',
      shadow: 'rgba(239, 68, 68, 0.45)',
    },
    blocked: {
      bg: 'linear-gradient(135deg, #EF4444, #B91C1C)',
      border: '#F87171',
      shadow: 'rgba(239, 68, 68, 0.45)',
    },
    moderate: {
      bg: 'linear-gradient(135deg, #F59E0B, #B45309)',
      border: '#FBBF24',
      shadow: 'rgba(245, 158, 11, 0.45)',
    },
    dispatched: {
      bg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      border: '#FBBF24',
      shadow: 'rgba(245, 158, 11, 0.45)',
    },
    resolved: {
      bg: 'linear-gradient(135deg, #10B981, #047857)',
      border: '#34D399',
      shadow: 'rgba(16, 185, 129, 0.45)',
    },
    review: {
      bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      border: '#A78BFA',
      shadow: 'rgba(139, 92, 246, 0.45)',
    },
    pending: {
      bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      border: '#60A5FA',
      shadow: 'rgba(59, 130, 246, 0.45)',
    },
  };

  const style = colorMap[highestStatus] || colorMap.critical;
  const size = count >= 50 ? 44 : count >= 10 ? 38 : 32;

  return L.divIcon({
    className: 'custom-cluster-marker',
    html: `
      <div class="relative w-full h-full flex items-center justify-center cursor-pointer group select-none pointer-events-auto">
        <div style="
          width: ${size}px; 
          height: ${size}px; 
          background: ${style.bg}; 
          border: 2px solid ${style.border}; 
          box-shadow: 0 4px 14px ${style.shadow};
        " class="rounded-full flex items-center justify-center text-white font-mono font-black text-xs transition-transform duration-200 group-hover:scale-115">
          <span>${count}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export interface DepotPinOptions {
  isCustom?: boolean;
  tag?: string;
  isSelected?: boolean;
}

/**
 * Creates a high-grade teardrop pin marker for LGU Operations Base / Depot
 * featuring a crisp headquarters icon and clean micro-tag badge.
 */
export function createDepotMarkerIcon(options: DepotPinOptions | string = {}): L.DivIcon {
  const opts: DepotPinOptions = typeof options === 'string' 
    ? { tag: options.toLowerCase().includes('custom') ? 'CUSTOM DEPOT' : 'HQ DEPOT' }
    : options;

  const isCustom = opts.isCustom ?? (opts.tag ? opts.tag.toLowerCase().includes('custom') : false);
  const tagText = opts.tag || (isCustom ? 'CUSTOM DEPOT' : 'HQ DEPOT');
  const isSelected = opts.isSelected ?? false;

  const width = isSelected ? 34 : 30;
  const height = isSelected ? 46 : 42;
  const gradId = `depot-pin-grad-${isCustom ? 'custom' : 'hq'}-${isSelected ? 'sel' : 'def'}`;
  const filterId = `depot-pin-shadow-${isCustom ? 'custom' : 'hq'}-${isSelected ? 'sel' : 'def'}`;
  
  const gradStart = isCustom ? '#10B981' : '#059669';
  const gradEnd = isCustom ? '#047857' : '#064E3B';
  const wellBg = '#022C22';
  const strokeWidth = isSelected ? '2.4' : '1.8';

  const svgHtml = `
    <svg width="${width}" height="${height}" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform duration-200 group-hover:scale-110 ${isSelected ? 'scale-110' : ''}">
      <defs>
        <filter id="${filterId}" x="-25%" y="-15%" width="150%" height="135%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
        <linearGradient id="${gradId}" x1="16" y1="2" x2="16" y2="40.5" gradientUnits="userSpaceOnUse">
          <stop stop-color="${gradStart}"/>
          <stop offset="1" stop-color="${gradEnd}"/>
        </linearGradient>
      </defs>

      <!-- Teardrop Pin Body -->
      <path filter="url(#${filterId})" d="M16 2C8.82 2 3 7.82 3 15.5C3 25.5 14.2 39.2 15.38 40.45C15.72 40.81 16.28 40.81 16.62 40.45C17.8 39.2 29 25.5 29 15.5C29 7.82 23.18 2 16 2Z" fill="url(#${gradId})" stroke="#FFFFFF" stroke-width="${strokeWidth}"/>

      <!-- Inner Depth Well -->
      <circle cx="16" cy="15.5" r="9" fill="${wellBg}" fill-opacity="0.45"/>

      <!-- Headquarters / Depot Building Icon -->
      <g stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M10 14L16 9.5L22 14" stroke-width="1.6"/>
        <path d="M11.5 14V21H20.5V14"/>
        <path d="M14.5 21V16.5H17.5V21" fill="#FFFFFF" fill-opacity="0.3"/>
      </g>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-depot-pin',
    html: `
      <div class="relative flex flex-col items-center justify-center cursor-pointer group select-none pointer-events-auto">
        ${svgHtml}
        <div class="-mt-1 px-1.5 py-0.2 bg-black/80 backdrop-blur-md border border-emerald-500/60 rounded-xs text-[8.5px] font-heading font-black text-emerald-400 tracking-wider shadow-md whitespace-nowrap uppercase">
          ${tagText}
        </div>
      </div>
    `,
    iconSize: [60, height + 16],
    iconAnchor: [30, height],
    popupAnchor: [0, -height],
  });
}
