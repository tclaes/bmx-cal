import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TypeLabel from '../shared/components/TypeLabel.svelte';

describe('TypeLabel', () => {
  it('uses the token set of a known type', () => {
    render(TypeLabel, { props: { type: 'European Cup' } });
    const label = screen.getByText('EC');
    expect(label).toHaveClass('type-ec');
  });

  it('falls back to a neutral style for an unknown type', () => {
    render(TypeLabel, { props: { type: 'Dare2Race' } });
    const label = screen.getByText('DAR');
    expect(label).toHaveClass('type-unknown');
  });

  it('does not break without a type', () => {
    const { container } = render(TypeLabel, { props: { type: null } });
    expect(container.querySelector('.type-unknown')).toBeInTheDocument();
  });
});
