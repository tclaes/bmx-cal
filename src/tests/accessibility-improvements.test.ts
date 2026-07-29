import { describe, it, expect } from 'vitest';
import { getContrastRatio } from '../shared/utils/color-contrast';

describe('Accessibility Improvements', () => {
  describe('Registration Button Color Contrast', () => {
    it('should meet WCAG AA contrast for Registration Open (green)', () => {
      const greenBackground = '#047857';
      const whiteText = '#ffffff';
      const contrast = getContrastRatio(greenBackground, whiteText);

      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA contrast for Registration Opens Soon (amber)', () => {
      const amberBackground = '#b45309';
      const whiteText = '#ffffff';
      const contrast = getContrastRatio(amberBackground, whiteText);

      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA contrast for Register Now (blue)', () => {
      const blueBackground = '#1d4ed8';
      const whiteText = '#ffffff';
      const contrast = getContrastRatio(blueBackground, whiteText);

      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('should meet WCAG AA contrast for Registration Closed (gray)', () => {
      const grayBackground = '#6b7280';
      const whiteText = '#ffffff';
      const contrast = getContrastRatio(grayBackground, whiteText);

      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Old Registration Colors Should Fail', () => {
    it('old green should NOT meet WCAG AA contrast', () => {
      const oldGreen = '#10b981';
      const whiteText = '#ffffff';
      const contrast = getContrastRatio(oldGreen, whiteText);

      expect(contrast).toBeLessThan(4.5);
    });

    it('old amber should NOT meet WCAG AA contrast', () => {
      const oldAmber = '#f59e0b';
      const whiteText = '#ffffff';
      const contrast = getContrastRatio(oldAmber, whiteText);

      expect(contrast).toBeLessThan(4.5);
    });
  });
});
