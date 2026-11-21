import {
  AppSettings,
  FONT_FAMILY_CSS,
  FONT_SIZE_PX,
  PAPER_MARGIN_MM,
  PAPER_SIZE_CSS,
  THEME_PRESETS,
} from '../types/settings';

export function applyAppSettingsToDom(settings: AppSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // 1. Dark / Light mode
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    settings.colorMode === 'dark' || (settings.colorMode === 'system' && prefersDark);

  root.classList.toggle('dark', isDark);

  // 2. Theme color CSS variables
  const preset =
    THEME_PRESETS.find((p) => p.id === settings.themeColor) ?? THEME_PRESETS[0];
  root.style.setProperty('--app-accent', isDark ? preset.darkAccent : preset.accent);
  root.style.setProperty('--app-accent-hover', isDark ? preset.darkAccentHover : preset.accentHover);
  root.style.setProperty('--app-accent-soft', isDark ? preset.darkAccentSoft : preset.accentSoft);
  root.style.setProperty('--app-accent-text', isDark ? preset.darkAccentText : preset.accentText);
  root.style.setProperty(
    '--app-accent-border',
    isDark ? preset.darkAccentBorder : preset.accentBorder
  );

  // Update theme-color meta tag
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', preset.accent);
  }

  // 3. Font Size & Font Family
  root.style.fontSize = FONT_SIZE_PX[settings.fontSize] ?? '16px';
  root.style.setProperty(
    '--app-font-family',
    FONT_FAMILY_CSS[settings.fontFamily] ?? FONT_FAMILY_CSS.jakarta
  );

  // 4. Dynamic @page print rule (Paper Size, Orientation, Margins)
  const paper = PAPER_SIZE_CSS[settings.paperSize] ?? PAPER_SIZE_CSS.A4;
  const marginMm = PAPER_MARGIN_MM[settings.paperMargin] ?? 12;
  const pageSizeCss =
    settings.paperSize === 'F4'
      ? settings.paperOrientation === 'landscape'
        ? `${paper.heightMm}mm ${paper.widthMm}mm`
        : `${paper.widthMm}mm ${paper.heightMm}mm`
      : `${settings.paperSize} ${settings.paperOrientation}`;

  let styleEl = document.getElementById('dynamic-print-page') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-page';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@media print { @page { size: ${pageSizeCss}; margin: ${marginMm}mm; } }`;
}
