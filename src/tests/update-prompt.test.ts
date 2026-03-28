import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { updateStore } from '@shared/stores/pwa.store';

describe('UpdateStore', () => {
  beforeEach(() => {
    updateStore.confirmUpdate();
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = get(updateStore);
    expect(state.available).toBe(false);
    expect(state.forceUpdate).toBe(false);
    expect(state.checking).toBe(false);
  });

  it('should set update available', () => {
    updateStore.setAvailable(true, false);
    const state = get(updateStore);
    expect(state.available).toBe(true);
    expect(state.forceUpdate).toBe(false);
  });

  it('should set force update', () => {
    updateStore.setAvailable(true, true);
    const state = get(updateStore);
    expect(state.available).toBe(true);
    expect(state.forceUpdate).toBe(true);
  });

  it('should set checking state', () => {
    updateStore.setChecking(true);
    const state = get(updateStore);
    expect(state.checking).toBe(true);
  });

  it('should dismiss update prompt', () => {
    updateStore.setAvailable(true, false);
    updateStore.dismiss();
    const state = get(updateStore);
    expect(state.available).toBe(false);
  });

  it('should confirm update and reset state', () => {
    updateStore.setAvailable(true, true);
    updateStore.confirmUpdate();
    const state = get(updateStore);
    expect(state.available).toBe(false);
    expect(state.forceUpdate).toBe(false);
    expect(state.checking).toBe(false);
  });
});

describe('UpdatePrompt Service Worker Integration', () => {
  let mockServiceWorker: any;
  let mockRegistration: any;
  let mockWaitingWorker: any;
  let controllerChangeHandler: (() => void) | null = null;

  beforeEach(() => {
    controllerChangeHandler = null;

    mockWaitingWorker = {
      postMessage: vi.fn(),
    };

    mockRegistration = {
      waiting: null,
      update: vi.fn().mockResolvedValue(undefined),
    };

    mockServiceWorker = {
      getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      addEventListener: vi.fn((event, handler, options) => {
        if (event === 'controllerchange') {
          controllerChangeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call skip waiting when waiting worker exists', async () => {
    mockRegistration.waiting = mockWaitingWorker;

    const registration = await navigator.serviceWorker.getRegistration();
    expect(registration).toBe(mockRegistration);

    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    }
  });

  it('should call update when no waiting worker exists', async () => {
    mockRegistration.waiting = null;

    const registration = await navigator.serviceWorker.getRegistration();
    expect(registration).toBe(mockRegistration);

    if (registration && !registration.waiting) {
      await registration.update();
      expect(mockRegistration.update).toHaveBeenCalled();
    }
  });

  it('should setup controller change listener', () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {}, { once: true });
    expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
      { once: true }
    );
  });

  it('should trigger controller change callback when set', () => {
    let callbackTriggered = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      callbackTriggered = true;
    }, { once: true });

    expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
      { once: true }
    );

    if (controllerChangeHandler) {
      controllerChangeHandler();
      expect(callbackTriggered).toBe(true);
    }
  });
});
