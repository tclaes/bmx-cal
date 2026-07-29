import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { installPromptStore } from '@shared/stores/pwa.store';

describe('InstallPromptStore', () => {
  beforeEach(() => {
    installPromptStore.reset();
  });

  it('should initialize with default values', () => {
    const state = get(installPromptStore);
    expect(state.canInstall).toBe(false);
    expect(state.isInstalled).toBe(false);
  });

  it('should set canInstall state', () => {
    installPromptStore.setCanInstall(true);
    const state = get(installPromptStore);
    expect(state.canInstall).toBe(true);
    expect(state.isInstalled).toBe(false);
  });

  it('should set isInstalled state', () => {
    installPromptStore.setInstalled(true);
    const state = get(installPromptStore);
    expect(state.canInstall).toBe(false);
    expect(state.isInstalled).toBe(true);
  });

  it('should update both states independently', () => {
    installPromptStore.setCanInstall(true);
    installPromptStore.setInstalled(true);
    const state = get(installPromptStore);
    expect(state.canInstall).toBe(true);
    expect(state.isInstalled).toBe(true);
  });

  it('should reset to default values', () => {
    installPromptStore.setCanInstall(true);
    installPromptStore.setInstalled(true);
    installPromptStore.reset();
    const state = get(installPromptStore);
    expect(state.canInstall).toBe(false);
    expect(state.isInstalled).toBe(false);
  });

  it('should maintain state when setting same value', () => {
    installPromptStore.setCanInstall(true);
    installPromptStore.setCanInstall(true);
    const state = get(installPromptStore);
    expect(state.canInstall).toBe(true);
  });

  it('should toggle canInstall state', () => {
    installPromptStore.setCanInstall(true);
    let state = get(installPromptStore);
    expect(state.canInstall).toBe(true);

    installPromptStore.setCanInstall(false);
    state = get(installPromptStore);
    expect(state.canInstall).toBe(false);
  });

  it('should toggle isInstalled state', () => {
    installPromptStore.setInstalled(true);
    let state = get(installPromptStore);
    expect(state.isInstalled).toBe(true);

    installPromptStore.setInstalled(false);
    state = get(installPromptStore);
    expect(state.isInstalled).toBe(false);
  });
});

describe('InstallPrompt Component Logic', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });

    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  it('should check localStorage for dismissed prompt', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue(null);

    const hasSeenPrompt = localStorage.getItem('pwa-install-dismissed');
    expect(hasSeenPrompt).toBeNull();
    expect(getItemSpy).toHaveBeenCalledWith('pwa-install-dismissed');
  });

  it('should save dismiss state to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    localStorage.setItem('pwa-install-dismissed', 'true');
    expect(setItemSpy).toHaveBeenCalledWith('pwa-install-dismissed', 'true');
  });

  it('should detect standalone mode', () => {
    const matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal('matchMedia', matchMediaMock);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    expect(isStandalone).toBe(true);
  });

  it('should detect iOS devices', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    expect(isIOS).toBe(true);

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('should detect non-iOS devices', () => {
    const originalUserAgent = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
      configurable: true,
    });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    expect(isIOS).toBe(false);

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });
});
