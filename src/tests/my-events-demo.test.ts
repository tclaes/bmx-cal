import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import MyEventsDemoPage from '../features/my-events/MyEventsDemoPage.svelte';
import { locale } from '../i18n';

beforeEach(() => locale.setLocale('nl'));

describe('MyEventsDemoPage', () => {
  it('previews rows with token type labels', () => {
    const { container } = render(MyEventsDemoPage);
    expect(container.querySelectorAll('.race-row')).toHaveLength(6);
    expect(container.querySelector('.type-ec')).not.toBeNull();
    expect(container.querySelector('.type-tc')).not.toBeNull();
    expect(container.querySelector('.type-wc')).not.toBeNull();
  });

  it('offers create-account and sign-in actions on dark-theme accent buttons', () => {
    const { container } = render(MyEventsDemoPage);
    expect(screen.getAllByRole('button', { name: /account/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Aanmelden' }).length).toBeGreaterThan(0);
    expect(container.querySelector('.btn--primary')).not.toBeNull();
  });

  it('lets the visitor try the star on the sample races', async () => {
    render(MyEventsDemoPage);
    const stars = screen.getAllByRole('button', { name: /bewaard|bewaren/i });
    const before = stars.filter(b => b.getAttribute('aria-pressed') === 'true').length;
    const target = stars.find(b => b.getAttribute('aria-pressed') === 'false')!;
    await fireEvent.click(target);
    const after = screen.getAllByRole('button', { name: /bewaard|bewaren/i }).filter(b => b.getAttribute('aria-pressed') === 'true').length;
    expect(after).toBe(before + 1);
  });
});
