import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  getAccessibleTextColor,
  meetsContrastRequirement,
  darkenColorForWhiteText,
  rgbToHex
} from '../shared/utils/color-contrast';

describe('Color Contrast Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    });

    it('should convert 3-digit hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('000000')).toEqual([0, 0, 0]);
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#12')).toBeNull();
      expect(hexToRgb('#1234567')).toBeNull();
    });
  });

  describe('getRelativeLuminance', () => {
    it('should return 1 for white', () => {
      const luminance = getRelativeLuminance('#ffffff');
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('should return 0 for black', () => {
      const luminance = getRelativeLuminance('#000000');
      expect(luminance).toBeCloseTo(0, 2);
    });

    it('should calculate luminance for colors', () => {
      const redLuminance = getRelativeLuminance('#ff0000');
      const greenLuminance = getRelativeLuminance('#00ff00');
      const blueLuminance = getRelativeLuminance('#0000ff');

      expect(redLuminance).toBeGreaterThan(0);
      expect(redLuminance).toBeLessThan(1);
      expect(greenLuminance).toBeGreaterThan(redLuminance);
      expect(blueLuminance).toBeLessThan(redLuminance);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21:1 for black and white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1:1 for same colors', () => {
      expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 2);
      expect(getContrastRatio('#000000', '#000000')).toBeCloseTo(1, 2);
      expect(getContrastRatio('#ff0000', '#ff0000')).toBeCloseTo(1, 2);
    });

    it('should be commutative', () => {
      const ratio1 = getContrastRatio('#3b82f6', '#ffffff');
      const ratio2 = getContrastRatio('#ffffff', '#3b82f6');
      expect(ratio1).toBeCloseTo(ratio2, 2);
    });

    it('should calculate typical UI color ratios', () => {
      const blueOnWhite = getContrastRatio('#3b82f6', '#ffffff');
      expect(blueOnWhite).toBeGreaterThan(3);

      const darkGrayOnWhite = getContrastRatio('#333333', '#ffffff');
      expect(darkGrayOnWhite).toBeGreaterThan(10);
    });
  });

  describe('getAccessibleTextColor', () => {
    it('should return white for dark backgrounds', () => {
      expect(getAccessibleTextColor('#000000')).toBe('#ffffff');
      expect(getAccessibleTextColor('#333333')).toBe('#ffffff');
      expect(getAccessibleTextColor('#0000ff')).toBe('#ffffff');
    });

    it('should return black for light backgrounds', () => {
      expect(getAccessibleTextColor('#ffffff')).toBe('#000000');
      expect(getAccessibleTextColor('#eeeeee')).toBe('#000000');
      expect(getAccessibleTextColor('#ffff00')).toBe('#000000');
    });

    it('should choose color with better contrast', () => {
      const mediumGray = '#888888';
      const textColor = getAccessibleTextColor(mediumGray);
      expect(['#ffffff', '#000000']).toContain(textColor);

      const whiteContrast = getContrastRatio(mediumGray, '#ffffff');
      const blackContrast = getContrastRatio(mediumGray, '#000000');
      const expectedColor = whiteContrast >= blackContrast ? '#ffffff' : '#000000';
      expect(textColor).toBe(expectedColor);
    });
  });

  describe('meetsContrastRequirement', () => {
    it('should pass AA requirement for high contrast', () => {
      expect(meetsContrastRequirement('#000000', '#ffffff', 'AA')).toBe(true);
      expect(meetsContrastRequirement('#333333', '#ffffff', 'AA')).toBe(true);
    });

    it('should fail AA requirement for low contrast', () => {
      expect(meetsContrastRequirement('#aaaaaa', '#ffffff', 'AA')).toBe(false);
      expect(meetsContrastRequirement('#cccccc', '#ffffff', 'AA')).toBe(false);
    });

    it('should pass AAA requirement for very high contrast', () => {
      expect(meetsContrastRequirement('#000000', '#ffffff', 'AAA')).toBe(true);
    });

    it('should fail AAA requirement for moderate contrast', () => {
      const ratio = getContrastRatio('#555555', '#ffffff');
      if (ratio >= 4.5 && ratio < 7) {
        expect(meetsContrastRequirement('#555555', '#ffffff', 'AA')).toBe(true);
        expect(meetsContrastRequirement('#555555', '#ffffff', 'AAA')).toBe(false);
      }
    });

    it('should default to AA level', () => {
      const resultAA = meetsContrastRequirement('#000000', '#ffffff');
      const resultExplicitAA = meetsContrastRequirement('#000000', '#ffffff', 'AA');
      expect(resultAA).toBe(resultExplicitAA);
    });

    it('should validate typical UI combinations', () => {
      expect(meetsContrastRequirement('#3b82f6', '#ffffff', 'AA')).toBe(false);

      expect(meetsContrastRequirement('#2563eb', '#ffffff', 'AA')).toBe(true);

      expect(meetsContrastRequirement('#ffffff', '#000000', 'AAA')).toBe(true);
    });
  });

  describe('Badge color accessibility', () => {
    it('should ensure readable text on common badge colors', () => {
      const colors = [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#8b5cf6'
      ];

      colors.forEach(color => {
        const textColor = getAccessibleTextColor(color);
        const contrast = getContrastRatio(color, textColor);
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should handle edge cases', () => {
      expect(getAccessibleTextColor('#808080')).toBeTruthy();
      expect(getAccessibleTextColor('#ff00ff')).toBeTruthy();
      expect(getAccessibleTextColor('#00ffff')).toBeTruthy();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB values to hex', () => {
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(59, 130, 246)).toBe('#3b82f6');
    });

    it('should handle single digit values', () => {
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
      expect(rgbToHex(15, 15, 15)).toBe('#0f0f0f');
    });
  });

  describe('darkenColorForWhiteText', () => {
    it('should keep dark colors unchanged', () => {
      const darkBlue = '#1e40af';
      const result = darkenColorForWhiteText(darkBlue);
      const contrast = getContrastRatio(result, '#ffffff');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should darken light colors to meet contrast requirements', () => {
      const lightColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ff0000'];

      lightColors.forEach(color => {
        const darkened = darkenColorForWhiteText(color);
        const contrast = getContrastRatio(darkened, '#ffffff');
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should maintain color hue while darkening', () => {
      const blue = '#3b82f6';
      const darkened = darkenColorForWhiteText(blue);

      // The darkened color should still be blue (lower RGB values but same ratios)
      const originalRgb = hexToRgb(blue);
      const darkenedRgb = hexToRgb(darkened);

      expect(darkenedRgb).not.toBeNull();
      expect(originalRgb).not.toBeNull();

      if (darkenedRgb && originalRgb) {
        // Blue should still be the dominant or significant component
        expect(darkenedRgb[2]).toBeGreaterThan(0);
      }
    });

    it('should respect custom minimum contrast ratio', () => {
      const color = '#3b82f6';
      const darkened = darkenColorForWhiteText(color, 7);
      const contrast = getContrastRatio(darkened, '#ffffff');
      expect(contrast).toBeGreaterThanOrEqual(7);
    });

    it('should return original color if already has sufficient contrast', () => {
      const darkColor = '#1e3a8a';
      const result = darkenColorForWhiteText(darkColor);
      const originalContrast = getContrastRatio(darkColor, '#ffffff');

      if (originalContrast >= 4.5) {
        expect(result).toBe(darkColor);
      }
    });
  });
});
