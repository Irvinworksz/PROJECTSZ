/**
 * Standard simulated Philippine Government & Barangay ID Card Templates
 * Generates crisp SVG Data URLs for ID attachment and residency verification
 */

export interface SampleIdOption {
  idType: string;
  idNumber: string;
  fileName: string;
  dataUrl: string;
  description: string;
}

export function generateSampleIdDataUrl(type: string, name: string, idNumber: string, purok: string = 'Purok 4'): string {
  const cleanName = (name || 'MARIA C. SANTOS').toUpperCase();
  const cleanId = (idNumber || 'PHIL-2026-8841-9920').toUpperCase();
  const cleanPurok = purok || 'Purok 4';
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 380" width="600" height="380">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f2b48" />
        <stop offset="40%" stop-color="#1e3a8a" />
        <stop offset="100%" stop-color="#0b1e36" />
      </linearGradient>
      <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="50%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <pattern id="guilloche" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="15" cy="15" r="14" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
        <circle cx="15" cy="15" r="8" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="0.5" />
      </pattern>
    </defs>

    <!-- Card Base with Rounded Corners -->
    <rect x="0" y="0" width="600" height="380" rx="20" fill="url(#cardGrad)" />
    <rect x="0" y="0" width="600" height="380" rx="20" fill="url(#guilloche)" />
    <rect x="0" y="0" width="600" height="380" rx="20" fill="none" stroke="rgba(251,191,36,0.3)" stroke-width="2" />

    <!-- Card Header Top Bar -->
    <rect x="0" y="0" width="600" height="74" rx="20" fill="rgba(15, 23, 42, 0.6)" />
    <rect x="0" y="70" width="600" height="4" fill="url(#goldAccent)" />

    <!-- Emblem / Coat of Arms Symbol -->
    <circle cx="48" cy="37" r="24" fill="#1e3a8a" stroke="#fbbf24" stroke-width="1.5" />
    <circle cx="48" cy="37" r="18" fill="none" stroke="#fbbf24" stroke-dasharray="3,2" />
    <text x="48" y="42" font-family="sans-serif" font-size="14" font-weight="900" fill="#fbbf24" text-anchor="middle">PH</text>

    <!-- Official Header Titles -->
    <text x="86" y="28" font-family="sans-serif" font-size="11" font-weight="800" letter-spacing="1.5" fill="#93c5fd">REPUBLIKA NG PILIPINAS</text>
    <text x="86" y="46" font-family="sans-serif" font-size="14" font-weight="900" letter-spacing="1" fill="#ffffff">${type.toUpperCase()}</text>
    <text x="86" y="60" font-family="sans-serif" font-size="9" font-weight="700" letter-spacing="0.5" fill="#cbd5e1">OFFICIAL IDENTIFICATION &amp; RESIDENCY CREDENTIAL</text>

    <!-- Photo Box -->
    <rect x="36" y="96" width="130" height="160" rx="10" fill="#0f172a" stroke="#93c5fd" stroke-width="2" />
    <!-- Stylized Avatar Silhouette inside Photo Box -->
    <circle cx="101" cy="155" r="32" fill="#334155" />
    <path d="M 56 240 Q 101 190 146 240 Z" fill="#334155" />
    <rect x="36" y="236" width="130" height="20" fill="rgba(30,58,138,0.8)" rx="4" />
    <text x="101" y="250" font-family="sans-serif" font-size="9" font-weight="800" fill="#fbbf24" text-anchor="middle">VERIFIED PHOTO</text>

    <!-- Watermark / Microprint Line -->
    <line x1="184" y1="96" x2="560" y2="96" stroke="rgba(255,255,255,0.15)" stroke-width="1" />

    <!-- Resident Information Block -->
    <!-- Full Name -->
    <text x="184" y="116" font-family="sans-serif" font-size="9" font-weight="700" fill="#94a3b8">APELYIDO, MGA PANGALAN / FULL NAME</text>
    <text x="184" y="136" font-family="sans-serif" font-size="16" font-weight="900" letter-spacing="0.5" fill="#ffffff">${cleanName}</text>

    <!-- ID Card Serial Number -->
    <text x="184" y="162" font-family="sans-serif" font-size="9" font-weight="700" fill="#94a3b8">CARD NUMBER / SERIAL</text>
    <text x="184" y="180" font-family="monospace" font-size="14" font-weight="800" letter-spacing="2" fill="#fbbf24">${cleanId}</text>

    <!-- Address / Jurisdiction -->
    <text x="184" y="206" font-family="sans-serif" font-size="9" font-weight="700" fill="#94a3b8">RESIDENTIAL ADDRESS / JURISDICTION</text>
    <text x="184" y="224" font-family="sans-serif" font-size="12" font-weight="800" fill="#e2e8f0">${cleanPurok}, Barangay Cabucbucan, Rizal, N.E.</text>

    <!-- Card Metadata Grid: Date Issued & Civil Status -->
    <g transform="translate(184, 240)">
      <text x="0" y="12" font-family="sans-serif" font-size="8" font-weight="700" fill="#94a3b8">DATE OF ISSUE</text>
      <text x="0" y="26" font-family="sans-serif" font-size="11" font-weight="800" fill="#ffffff">15 AUG 2024</text>

      <text x="110" y="12" font-family="sans-serif" font-size="8" font-weight="700" fill="#94a3b8">CITIZENSHIP</text>
      <text x="110" y="26" font-family="sans-serif" font-size="11" font-weight="800" fill="#ffffff">FILIPINO</text>

      <text x="210" y="12" font-family="sans-serif" font-size="8" font-weight="700" fill="#94a3b8">EXPIRY</text>
      <text x="210" y="26" font-family="sans-serif" font-size="11" font-weight="800" fill="#fbbf24">PERMANENT</text>
    </g>

    <!-- Microchip / Security Hologram Chip -->
    <rect x="490" y="112" width="70" height="54" rx="6" fill="#eab308" stroke="#ca8a04" stroke-width="1.5" />
    <path d="M 490 139 L 560 139 M 525 112 L 525 166" stroke="#ca8a04" stroke-width="1" />
    <circle cx="525" cy="139" r="8" fill="#ca8a04" />
    <text x="525" y="142" font-family="sans-serif" font-size="7" font-weight="900" fill="#fef08a" text-anchor="middle">SEC</text>

    <!-- Signature Line & Decorative Security Guilloche -->
    <path d="M 40 310 Q 70 295 100 315 T 160 305" fill="none" stroke="#60a5fa" stroke-width="1.5" />
    <text x="40" y="328" font-family="sans-serif" font-size="8" font-weight="700" fill="#94a3b8">SIGNATURE OF BEARER</text>

    <!-- Machine Readable Zone (MRZ) Bottom Footer -->
    <rect x="0" y="340" width="600" height="40" rx="0" fill="#080e1a" />
    <text x="36" y="358" font-family="monospace" font-size="11" font-weight="700" fill="#64748b" letter-spacing="3">IDPHL${cleanId.replace(/[^A-Z0-9]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    <text x="36" y="372" font-family="monospace" font-size="11" font-weight="700" fill="#64748b" letter-spacing="3">${cleanName.replace(/[^A-Z]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;9506154M3008157PHL</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_ID_TEMPLATES: SampleIdOption[] = [
  {
    idType: 'Philippine National ID (PhilSys)',
    idNumber: 'PHIL-2026-8841-9920',
    fileName: 'philsys_national_id_sample.svg',
    dataUrl: generateSampleIdDataUrl('Philippine National ID (PhilSys)', 'Maria C. Santos', 'PHIL-2026-8841-9920', 'Purok 4'),
    description: 'Republic of the Philippines PhilSys Card with security chip and photo'
  },
  {
    idType: "Driver's License (LTO)",
    idNumber: 'DL-N02-24-998812',
    fileName: 'lto_drivers_license_sample.svg',
    dataUrl: generateSampleIdDataUrl("Driver's License (LTO)", 'Maria Clara Santos', 'DL-N02-24-998812', 'Purok 2'),
    description: 'Land Transportation Office Professional / Non-Professional License'
  },
  {
    idType: "Voter's ID / Comelec Certificate",
    idNumber: 'VR-2025-03-4921A',
    fileName: 'comelec_voters_id_sample.svg',
    dataUrl: generateSampleIdDataUrl("Voter's ID / Comelec Certificate", 'Ricardo M. Dalisay', 'VR-2025-03-4921A', 'Purok 3'),
    description: 'Commission on Elections Official Voter Identification'
  },
  {
    idType: 'Barangay Resident ID',
    idNumber: 'BRGY-CAB-2026-0418',
    fileName: 'barangay_resident_id_sample.svg',
    dataUrl: generateSampleIdDataUrl('Barangay Resident ID', 'Elena Ramos', 'BRGY-CAB-2026-0418', 'Purok 1'),
    description: 'Official Barangay Cabucbucan Resident ID with jurisdiction certification'
  }
];
