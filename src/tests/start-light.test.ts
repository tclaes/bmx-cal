import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StartLight from '@ui/StartLight.svelte';

describe('StartLight', () => {
  it.each(['open', 'soon', 'closed', 'register'] as const)('renders the %s state with four lamps', (state) => {
    const { container } = render(StartLight, { props: { state } });
    expect(container.querySelector(`.start-light-${state}`)).toBeInTheDocument();
    expect(container.querySelectorAll('.lamp')).toHaveLength(4);
  });

  it('exposes the label to assistive tech when given', () => {
    render(StartLight, { props: { state: 'open', label: 'Inschrijving open' } });
    expect(screen.getByRole('img', { name: 'Inschrijving open' })).toBeInTheDocument();
  });

  it('is hidden from assistive tech without a label', () => {
    const { container } = render(StartLight, { props: { state: 'closed' } });
    expect(container.querySelector('.start-light')).toHaveAttribute('aria-hidden', 'true');
  });
});
