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
    return priorityScore >= 70 ? 'critical' : priorityScore >= 40 ? 'moderate' : 'moderate';
  }
  return 'critical';
}

const PIN_CONFIGS: Record<EsteroPinVariant, {
  gradStart: string;
  gradEnd: string;
  wellBg: string;
  glowColor: string;
  iconSvg: string;
}> = {
  critical: {
    gradStart: '#EF4444',
    gradEnd: '#991B1B',
    wellBg: '#7F1D1D',
    glowColor: 'rgba(239, 68, 68, 0.6)',
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
    glowColor: 'rgba(245, 158, 11, 0.6)',
    iconSvg: `
      <circle cx="16" cy="15.5" r="4.5" stroke="#FFFFFF" stroke-width="1.6"/>
      <polyline points="16 13 16 15.5 18 16.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  dispatched: {
    gradStart: '#F59E0B',
    gradEnd: '#D97706',
    wellBg: '#78350F',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    iconSvg: `
      <circle cx="16" cy="15.5" r="4.5" stroke="#FFFFFF" stroke-width="1.6"/>
      <polyline points="16 13 16 15.5 18 16.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  resolved: {
    gradStart: '#10B981',
    gradEnd: '#047857',
    wellBg: '#064E3B',
    glowColor: 'rgba(16, 185, 129, 0.6)',
    iconSvg: `
      <polyline points="12.5 15.5 15 18 19.5 13" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `,
  },
  pending: {
    gradStart: '#3B82F6',
    gradEnd: '#1D4ED8',
    wellBg: '#1E3A8A',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    iconSvg: `
      <circle cx="16" cy="15.5" r="2.2" fill="#FFFFFF"/>
      <circle cx="16" cy="15.5" r="5" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="2 2"/>
    `,
  },
  review: {
    gradStart: '#8B5CF6',
    gradEnd: '#6D28D9',
    wellBg: '#4C1D95',
    glowColor: 'rgba(139, 92, 246, 0.6)',
    iconSvg: `
      <circle cx="15" cy="14.5" r="3.5" stroke="#FFFFFF" stroke-width="1.6"/>
      <line x1="17.6" y1="17.1" x2="20" y2="19.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
    `,
  },
};

/**
 * Creates a high-grade, precision vector teardrop pin marker with smooth curves,
 * inner depth badge, drop shadow, and selection halo ring.
 */
export function createEsteroMarkerIcon(options: EsteroPinOptions = {}): L.DivIcon {
  const { status, priorityScore = 0, needsReview = false, isSelected = false } = options;
  const variant = options.variant || resolvePinVariant(status, priorityScore, needsReview);
  const cfg = PIN_CONFIGS[variant] || PIN_CONFIGS.critical;

  const width = isSelected ? 36 : 30;
  const height = isSelected ? 48 : 42;
  const filterId = `estero-pin-shadow-${variant}-${isSelected ? 'sel' : 'def'}`;
  const gradId = `estero-pin-grad-${variant}-${isSelected ? 'sel' : 'def'}`;

  // SVG Teardrop geometry: Top circle r=13 centered at (16, 15.5), tapering down smoothly to (16, 40.5)
  const svgHtml = `
    <svg width="${width}" height="${height}" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-transform duration-200 group-hover:scale-115 ${isSelected ? 'scale-115 drop-shadow-[0_0_10px_rgba(96,165,250,0.9)]' : ''}">
      <defs>
        <filter id="${filterId}" x="-25%" y="-15%" width="150%" height="135%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
        <linearGradient id="${gradId}" x1="16" y1="2" x2="16" y2="40.5" gradientUnits="userSpaceOnUse">
          <stop stop-color="${cfg.gradStart}"/>
          <stop offset="1" stop-color="${cfg.gradEnd}"/>
        </linearGradient>
      </defs>

      ${isSelected ? `
        <!-- Selection Animated Radar Glow Ring -->
        <path d="M16 1C8.27 1 2 7.27 2 15.5C2 25.5 14.1 39.8 15.35 41.1C15.7 41.45 16.3 41.45 16.65 41.1C17.9 39.8 30 25.5 30 15.5C30 7.27 23.73 1 16 1Z" stroke="#60A5FA" stroke-width="2.5" stroke-opacity="0.95"/>
      ` : ''}

      <!-- Main Pin Body -->
      <path filter="url(#${filterId})" d="M16 2C8.82 2 3 7.82 3 15.5C3 25.5 14.2 39.2 15.38 40.45C15.72 40.81 16.28 40.81 16.62 40.45C17.8 39.2 29 25.5 29 15.5C29 7.82 23.18 2 16 2Z" fill="url(#${gradId})" stroke="#FFFFFF" stroke-width="1.8"/>

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
