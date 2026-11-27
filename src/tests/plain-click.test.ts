import { describe, it, expect } from 'vitest';
import { isPlainLeftClick } from '@shared/utils';

describe('isPlainLeftClick', () => {
  it('accepts an unmodified primary click', () => {
    expect(isPlainLeftClick(new MouseEvent('click', { button: 0 }))).toBe(true);
  });
  it('rejects modifier clicks and other buttons', () => {
    expect(isPlainLeftClick(new MouseEvent('click', { button: 0, metaKey: true }))).toBe(false);
    expect(isPlainLeftClick(new MouseEvent('click', { button: 0, ctrlKey: true }))).toBe(false);
    expect(isPlainLeftClick(new MouseEvent('click', { button: 0, shiftKey: true }))).toBe(false);
    expect(isPlainLeftClick(new MouseEvent('click', { button: 1 }))).toBe(false);
  });
});
