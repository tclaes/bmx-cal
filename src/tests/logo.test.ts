import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Logo from '@ui/Logo.svelte';

describe('Logo', () => {
  it('shows the wordmark by default and hides the decorative mark from assistive tech', () => {
    const { container } = render(Logo);
    expect(screen.getByLabelText('BMX Kalender')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.textContent).toContain('BMX');
    expect(container.textContent).toContain('KALENDER');
  });

  it('exposes the mark as an image with a label when the wordmark is off', () => {
    const { container } = render(Logo, { props: { wordmark: false } });
    expect(screen.getByRole('img', { name: 'BMX Kalender' })).toBeInTheDocument();
    expect(container.textContent).not.toContain('KALENDER');
  });

  it('draws 12 gear teeth and applies the size', () => {
    const { container } = render(Logo, { props: { size: 80 } });
    expect(container.querySelectorAll('.tooth')).toHaveLength(12);
    expect(container.querySelector('svg')).toHaveAttribute('width', '80');
  });
});
