import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PWA Configuration', () => {
  it('should have valid manifest.json structure', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.name).toBe('BMX Events Calendar');
    expect(manifest.short_name).toBe('BMX Calendar');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((i: { src: string }) => i.src)).toEqual([
      '/icon-192.png',
      '/icon-512.png',
      '/icon-maskable-512.png',
    ]);
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true);
  });

  it('should have relative paths in manifest', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
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
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.start_url).not.toMatch(/^https?:\/\//);
    expect(manifest.scope).not.toMatch(/^https?:\/\//);

    manifest.icons.forEach((icon: { src: string }) => {
      expect(icon.src).not.toMatch(/^https?:\/\//);
    });
  });

  it('should use theme color from manifest', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.theme_color).toBe('#14171c');
    expect(manifest.background_color).toBe('#14171c');
  });

  it('should not use prefer_related_applications by default', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    expect(manifest.prefer_related_applications).toBe(false);
  });
});

describe('Service worker caching (public/sw.js)', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../public/sw.js'), 'utf-8');

  type Handler = (event: any) => void;

  function loadWorker(opts: { fetchImpl: (req: any) => Promise<any>; cached?: Record<string, any>; cacheNames?: string[] }) {
    const handlers: Record<string, Handler> = {};
    const deleted: string[] = [];
    const postMessage = vi.fn();
    const cache = { addAll: vi.fn().mockResolvedValue(undefined), put: vi.fn().mockResolvedValue(undefined) };
    const selfMock = {
      addEventListener: (type: string, handler: Handler) => { handlers[type] = handler; },
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn().mockResolvedValue(undefined), matchAll: vi.fn().mockResolvedValue([{ postMessage }]) },
      registration: { showNotification: vi.fn() },
    };
    const cachesMock = {
      open: vi.fn().mockResolvedValue(cache),
      match: vi.fn(async (req: any) => opts.cached?.[typeof req === 'string' ? req : new URL(req.url).pathname]),
      keys: vi.fn().mockResolvedValue(opts.cacheNames ?? []),
      delete: vi.fn(async (name: string) => { deleted.push(name); return true; }),
    };
    const run = new Function('self', 'caches', 'fetch', 'location', 'Response', source.replaceAll('__APP_VERSION__', '9.9.9'));
    run(selfMock, cachesMock, vi.fn(opts.fetchImpl), { origin: 'https://bmxkalender.be' }, { error: () => ({ type: 'error' }) });
    return { handlers, deleted, postMessage, cachesMock, cache };
  }

  function fetchEvent(path: string, mode = 'no-cors') {
    const event = { request: { url: `https://bmxkalender.be${path}`, method: 'GET', mode }, respondWith: vi.fn(), waitUntil: vi.fn() };
    return event;
  }

  it('keeps the version placeholder for the build to replace', () => {
    expect(source).toContain("'bmx-calendar-__APP_VERSION__'");
  });

  it('loads pages from the network first', async () => {
    const fresh = { ok: true, status: 200, type: 'basic', headers: new Headers({ 'content-type': 'text/html' }), clone: () => ({}) };
    const { handlers } = loadWorker({ fetchImpl: async () => fresh, cached: { '/index.html': { stale: true } } });
    const event = fetchEvent('/', 'navigate');
    handlers.fetch(event);
    expect(await event.respondWith.mock.calls[0][0]).toBe(fresh);
  });

  it('stores only HTML navigations as the offline shell', async () => {
    const xml = { ok: true, status: 200, type: 'basic', headers: new Headers({ 'content-type': 'application/xml' }), clone: () => ({}) };
    const html = { ok: true, status: 200, type: 'basic', headers: new Headers({ 'content-type': 'text/html; charset=UTF-8' }), clone: () => ({}) };
    const { handlers, cachesMock, cache } = loadWorker({ fetchImpl: async (req: any) => (req.url.endsWith('.xml') ? xml : html) });

    const sitemap = fetchEvent('/sitemap.xml', 'navigate');
    handlers.fetch(sitemap);
    expect(await sitemap.respondWith.mock.calls[0][0]).toBe(xml);
    expect(sitemap.waitUntil).not.toHaveBeenCalled();
    expect(cachesMock.open).not.toHaveBeenCalled();

    const page = fetchEvent('/calendar', 'navigate');
    handlers.fetch(page);
    expect(await page.respondWith.mock.calls[0][0]).toBe(html);
    await page.waitUntil.mock.calls[0][0];
    expect(cache.put).toHaveBeenCalledWith('/index.html', expect.anything());
  });

  it('never caches the SPA fallback HTML for a missing asset', async () => {
    const fallback = { ok: true, status: 200, type: 'basic', headers: new Headers({ 'content-type': 'text/html' }), clone: () => ({}) };
    const { handlers } = loadWorker({ fetchImpl: async () => fallback });
    const asset = fetchEvent('/assets/missing-abc.js');
    handlers.fetch(asset);
    expect(await asset.respondWith.mock.calls[0][0]).toBe(fallback);
    expect(asset.waitUntil).not.toHaveBeenCalled();
  });

  it('keeps the worker alive until the cache write finishes', async () => {
    const html = { ok: true, status: 200, type: 'basic', headers: new Headers({ 'content-type': 'text/html' }), clone: () => ({}) };
    const { handlers } = loadWorker({ fetchImpl: async () => html });
    const page = fetchEvent('/', 'navigate');
    handlers.fetch(page);
    await page.respondWith.mock.calls[0][0];
    expect(page.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
  });

  it('falls back to the cached shell when offline', async () => {
    const shell = { stale: true };
    const { handlers } = loadWorker({ fetchImpl: async () => { throw new TypeError('offline'); }, cached: { '/index.html': shell } });
    const event = fetchEvent('/calendar', 'navigate');
    handlers.fetch(event);
    expect(await event.respondWith.mock.calls[0][0]).toBe(shell);
  });

  it('never intercepts /version.json', () => {
    const { handlers } = loadWorker({ fetchImpl: async () => ({}) });
    const event = fetchEvent('/version.json?ts=1');
    handlers.fetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('serves hashed assets from the cache first', async () => {
    const asset = { cached: true };
    const fetchImpl = vi.fn();
    const { handlers } = loadWorker({ fetchImpl, cached: { '/assets/index-abc.js': asset } });
    const event = fetchEvent('/assets/index-abc.js');
    handlers.fetch(event);
    expect(await event.respondWith.mock.calls[0][0]).toBe(asset);
  });

  it('removes old caches on activate without messaging clients', async () => {
    const { handlers, deleted, postMessage } = loadWorker({
      fetchImpl: async () => ({}),
      cacheNames: ['bmx-calendar-v6', 'bmx-calendar-9.9.9'],
    });
    let done: Promise<unknown> = Promise.resolve();
    handlers.activate({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect(deleted).toEqual(['bmx-calendar-v6']);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
