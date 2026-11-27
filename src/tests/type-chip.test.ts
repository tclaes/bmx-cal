import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TypeChip from '@ui/TypeChip.svelte';

describe('TypeChip', () => {
  it('shows the code for a known type with a token dot', () => {
    const { container } = render(TypeChip, { props: { type: 'European Cup' } });
    expect(screen.getByRole('button', { name: 'EC' })).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('.dot-ec')).not.toBeNull();
  });

  it('shows the full name with a neutral dot for unknown types', () => {
    const { container } = render(TypeChip, { props: { type: 'Training' } });
    expect(screen.getByRole('button', { name: 'Training' })).toBeInTheDocument();
    expect(container.querySelector('.dot-unknown')).not.toBeNull();
  });

  it('maps states to aria-pressed and shows the count', () => {
    const { component } = render(TypeChip, { props: { type: 'Cycling Vlaanderen', count: 7, state: 'on' } });
    expect(screen.getByRole('button', { name: 'CV 7' })).toHaveAttribute('aria-pressed', 'true');
    component.$set({ state: 'partial' });
    return Promise.resolve().then(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'mixed');
    });
  });

  it('renders a plain label chip without a dot and forwards clicks', async () => {
    const { container, component } = render(TypeChip, { props: { label: 'ALLE', state: 'on' } });
    let clicks = 0;
    component.$on('click', () => clicks++);
    expect(container.querySelector('.dot')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'ALLE' }));
    expect(clicks).toBe(1);
  });
});
