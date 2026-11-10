import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RaceRow from '@ui/RaceRow.svelte';

const base = {
  title: 'UEC BMX European Cup Round 1',
  href: '/events/1',
  day: '13',
  month: 'mrt',
  meta: 'Vrijdag · Zolder',
  type: 'European Cup',
  registrationUrl: 'https://example.com/register',
  registerLabel: 'Inschrijven',
  opensLabel: 'Opent 1 mrt',
};

describe('RaceRow', () => {
  it('makes the title the only row link to the detail target', () => {
    render(RaceRow, { props: { ...base, status: null } });
    const link = screen.getByRole('link', { name: base.title });
    expect(link).toHaveAttribute('href', '/events/1');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows an independent registration link when registration is open', () => {
    render(RaceRow, { props: { ...base, status: { state: 'open', label: 'Inschrijving open' } } });
    const register = screen.getByRole('link', { name: 'Inschrijven' });
    expect(register).toHaveAttribute('href', 'https://example.com/register');
    expect(register).toHaveAttribute('target', '_blank');
    expect(register).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(register.closest('.action')).not.toBeNull();
    expect(register.closest('.row-link')).toBeNull();
  });

  it('shows the opening time and no button before registration opens', () => {
    render(RaceRow, { props: { ...base, status: { state: 'soon', label: 'Binnenkort' } } });
    expect(screen.getByText('Opent 1 mrt')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
  });

  it('shows no button when closed or without a registration url', () => {
    const { unmount } = render(RaceRow, { props: { ...base, status: { state: 'closed', label: 'Gesloten' } } });
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
    unmount();
    render(RaceRow, { props: { ...base, registrationUrl: null, status: { state: 'open', label: 'Open' } } });
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
  });

  it('uses the type tokens for the row and neutral ones for unknown types', () => {
    const { container, unmount } = render(RaceRow, { props: { ...base, status: null } });
    expect(container.querySelector('.race-ec')).toBeInTheDocument();
    unmount();
    const { container: c2 } = render(RaceRow, { props: { ...base, type: 'Training', status: null } });
    expect(c2.querySelector('.race-unknown')).toBeInTheDocument();
  });
});
