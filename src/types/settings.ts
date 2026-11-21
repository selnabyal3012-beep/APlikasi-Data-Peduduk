export type ThemeColorId =
  | 'biru-nusantara'
  | 'hijau-zamrud'
  | 'merah-marun'
  | 'ungu-indigo'
  | 'abu-grafit';

export type ScreenColorMode = 'light' | 'dark' | 'system';
export type ScreenWidthMode = 'standard' | 'compact' | 'full';
export type TableDensityMode = 'normal' | 'compact';
export type FontSizeMode = 'small' | 'normal' | 'large' | 'xlarge';
export type FontFamilyMode = 'jakarta' | 'public' | 'lora' | 'mono';
export type PaperSizeMode = 'A4' | 'F4' | 'Letter' | 'Legal';
export type PaperOrientationMode = 'landscape' | 'portrait';
export type PaperMarginMode = 'narrow' | 'standard' | 'wide';
export type DateFormatMode = 'dd/mm/yyyy' | 'yyyy-mm-dd' | 'dd-mmm-yyyy';

export interface AppSettings {
  themeColor: ThemeColorId;
  colorMode: ScreenColorMode;
  screenWidth: ScreenWidthMode;
  tableDensity: TableDensityMode;
  fontSize: FontSizeMode;
  fontFamily: FontFamilyMode;
  paperSize: PaperSizeMode;
  paperOrientation: PaperOrientationMode;
  paperMargin: PaperMarginMode;
  printShowLogo: boolean;
  printShowSignature: boolean;
  rowsPerPage: 10 | 25 | 50 | 100;
  showQuickActionBar: boolean;
  strictNikValidation: boolean;
  dateFormat: DateFormatMode;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  themeColor: 'biru-nusantara',
  colorMode: 'light',
  screenWidth: 'standard',
  tableDensity: 'normal',
  fontSize: 'normal',
  fontFamily: 'jakarta',
  paperSize: 'A4',
  paperOrientation: 'landscape',
  paperMargin: 'standard',
  printShowLogo: true,
  printShowSignature: true,
  rowsPerPage: 25,
  showQuickActionBar: true,
  strictNikValidation: false,
  dateFormat: 'dd/mm/yyyy',
};

export interface ThemePreset {
  id: ThemeColorId;
  name: string;
  desc: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentText: string;
  accentBorder: string;
  darkAccent: string;
  darkAccentHover: string;
  darkAccentSoft: string;
  darkAccentText: string;
  darkAccentBorder: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'biru-nusantara',
    name: 'Biru Nusantara',
    desc: 'Biru modern yang cerah, bersih, dan tegas',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentSoft: '#EFF6FF',
    accentText: '#1D4ED8',
    accentBorder: '#BFDBFE',
    darkAccent: '#2563EB',
    darkAccentHover: '#3B82F6',
    darkAccentSoft: 'rgba(37, 99, 235, 0.16)',
    darkAccentText: '#93C5FD',
    darkAccentBorder: 'rgba(59, 130, 246, 0.35)',
  },
  {
    id: 'hijau-zamrud',
    name: 'Hijau Zamrud',
    desc: 'Hijau desa klasik bernuansa tenang',
    accent: '#064E3B',
    accentHover: '#065F46',
    accentSoft: '#ECFDF5',
    accentText: '#064E3B',
    accentBorder: '#A7F3D0',
    darkAccent: '#059669',
    darkAccentHover: '#10B981',
    darkAccentSoft: 'rgba(5, 150, 105, 0.16)',
    darkAccentText: '#6EE7B7',
    darkAccentBorder: 'rgba(16, 185, 129, 0.35)',
  },
  {
    id: 'merah-marun',
    name: 'Merah Marun',
    desc: 'Merah marun formal dan berwibawa',
    accent: '#881337',
    accentHover: '#9F1239',
    accentSoft: '#FFF1F2',
    accentText: '#881337',
    accentBorder: '#FECDD3',
    darkAccent: '#E11D48',
    darkAccentHover: '#F43F5E',
    darkAccentSoft: 'rgba(225, 29, 72, 0.16)',
    darkAccentText: '#FDA4AF',
    darkAccentBorder: 'rgba(244, 63, 94, 0.35)',
  },
  {
    id: 'ungu-indigo',
    name: 'Ungu Indigo',
    desc: 'Indigo modern dengan kontras tajam',
    accent: '#312E81',
    accentHover: '#3730A3',
    accentSoft: '#EEF2FF',
    accentText: '#312E81',
    accentBorder: '#C7D2FE',
    darkAccent: '#4F46E5',
    darkAccentHover: '#6366F1',
    darkAccentSoft: 'rgba(79, 70, 229, 0.16)',
    darkAccentText: '#A5B4FC',
    darkAccentBorder: 'rgba(99, 102, 241, 0.35)',
  },
  {
    id: 'abu-grafit',
    name: 'Abu Grafit',
    desc: 'Monokrom arsip gelap yang netral',
    accent: '#0F172A',
    accentHover: '#1E293B',
    accentSoft: '#F1F5F9',
    accentText: '#0F172A',
    accentBorder: '#CBD5E1',
    darkAccent: '#475569',
    darkAccentHover: '#64748B',
    darkAccentSoft: 'rgba(100, 116, 139, 0.2)',
    darkAccentText: '#CBD5E1',
    darkAccentBorder: 'rgba(148, 163, 184, 0.35)',
  },
];

export const FONT_SIZE_PX: Record<FontSizeMode, string> = {
  small: '14px',
  normal: '16px',
  large: '18px',
  xlarge: '20px',
};

export const FONT_FAMILY_CSS: Record<FontFamilyMode, string> = {
  jakarta: '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  public: '"Public Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
  lora: '"Lora", Georgia, Cambria, "Times New Roman", serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
};

export const PAPER_SIZE_CSS: Record<PaperSizeMode, { widthMm: number; heightMm: number; label: string }> = {
  A4: { widthMm: 210, heightMm: 297, label: 'A4 (210 × 297 mm)' },
  F4: { widthMm: 215, heightMm: 330, label: 'F4 / Folio (215 × 330 mm)' },
  Letter: { widthMm: 216, heightMm: 279, label: 'Letter (216 × 279 mm)' },
  Legal: { widthMm: 216, heightMm: 356, label: 'Legal (216 × 356 mm)' },
};

export const PAPER_MARGIN_MM: Record<PaperMarginMode, number> = {
  narrow: 8,
  standard: 12,
  wide: 18,
};
