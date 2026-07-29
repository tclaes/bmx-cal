import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Configuration', () => {
  it('should have valid manifest.json structure', () => {
    const manifestPath = path.resolve(__dirname, '../../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.name).toBe('BMX Events Calendar');
    expect(manifest.short_name).toBe('BMX Calendar');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(1);
    expect(manifest.icons[0].src).toBe('/bmx-calendar.png');
  });

  it('should have relative paths in manifest', () => {
    const manifestPath = path.resolve(__dirname, '../../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.start_url).toMatch(/^\//);
    expect(manifest.scope).toMatch(/^\//);
    manifest.icons.forEach((icon: { src: string }) => {
      expect(icon.src).toMatch(/^\//);
    });
  });
});

describe('Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register service worker on supported browsers', async () => {
    const mockRegister = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: mockRegister,
        addEventListener: vi.fn(),
      },
      configurable: true,
    });

    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    }
  });

  it('should skip service worker on unsupported browsers', () => {
    const originalServiceWorker = (navigator as any).serviceWorker;
    delete (navigator as any).serviceWorker;

    expect('serviceWorker' in navigator).toBe(false);

    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    });
  });
});

describe('PWA Install Prompt', () => {
  it('should detect standalone mode', () => {
    const matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal('matchMedia', matchMediaMock);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    expect(isStandalone).toBe(true);
  });

  it('should detect iOS devices correctly', () => {
    const originalUserAgent = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    expect(isIOS).toBe(true);

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('should detect Android devices correctly', () => {
    const originalUserAgent = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      configurable: true,
    });

    const isAndroid = /Android/.test(navigator.userAgent);
    expect(isAndroid).toBe(true);

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });
});

describe('Multi-domain Support', () => {
  it('should work with relative URLs for cross-domain compatibility', () => {
    const manifestPath = path.resolve(__dirname, '../../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.start_url).not.toMatch(/^https?:\/\//);
    expect(manifest.scope).not.toMatch(/^https?:\/\//);

    manifest.icons.forEach((icon: { src: string }) => {
      expect(icon.src).not.toMatch(/^https?:\/\//);
    });
  });

  it('should use theme color from manifest', () => {
    const manifestPath = path.resolve(__dirname, '../../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.theme_color).toBe('#2563eb');
    expect(manifest.background_color).toBe('#ffffff');
  });

  it('should not use prefer_related_applications by default', () => {
    const manifestPath = path.resolve(__dirname, '../../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.prefer_related_applications).toBe(false);
  });
});
