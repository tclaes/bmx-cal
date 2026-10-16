export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const sanitizedHex = hex.replace('#', '');

  if (sanitizedHex.length === 3) {
    const [r, g, b] = sanitizedHex.split('').map(char => parseInt(char + char, 16));
    return [r, g, b];
  }

  if (sanitizedHex.length === 6) {
    const r = parseInt(sanitizedHex.substring(0, 2), 16);
    const g = parseInt(sanitizedHex.substring(2, 4), 16);
    const b = parseInt(sanitizedHex.substring(4, 6), 16);
    return [r, g, b];
  }

  return null;
}

export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#ffffff');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');

  return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
}

export function darkenColorForWhiteText(hex: string, minContrast = 4.5): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  let [r, g, b] = rgb;

  if (getContrastRatio(hex, '#ffffff') >= minContrast) {
    return hex;
  }

  while (getContrastRatio(rgbToHex(r, g, b), '#ffffff') < minContrast && (r > 0 || g > 0 || b > 0)) {
    r = Math.max(0, Math.floor(r * 0.9));
    g = Math.max(0, Math.floor(g * 0.9));
    b = Math.max(0, Math.floor(b * 0.9));
  }

  return rgbToHex(r, g, b);
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const contrast = getContrastRatio(foreground, background);
  const minRatio = level === 'AAA' ? 7 : 4.5;
  return contrast >= minRatio;
}
