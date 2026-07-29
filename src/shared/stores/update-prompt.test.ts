import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { updateStore } from './pwa.store';

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
