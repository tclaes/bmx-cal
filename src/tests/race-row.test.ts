import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RaceRow from '@ui/RaceRow.svelte';
import type { RaceView } from '@shared/utils';
import type { EventWithDetails } from '@types';

type Props = {
  status?: RaceView['status'];
  registrationUrl?: string | null;
  type?: string;
  deadlineLabel?: string;
  ongoing?: boolean;
  livestreamUrl?: string | null;
  saved?: boolean;
  saveLabel?: string;
  livestreamLabel?: string;
};

const title = 'UEC BMX European Cup Round 1';

/** RaceRow props for one race; every test overrides only what it is about. */
const props = (o: Props = {}) => ({
  event: {
    id: '1', title, registration_url: o.registrationUrl === undefined ? 'https://example.com/register' : o.registrationUrl,
    livestream_url: o.livestreamUrl ?? null, event_type: { name: o.type ?? 'European Cup' },
  } as unknown as EventWithDetails,
  view: {
    day: '13', month: 'mrt', monthLong: 'maart', weekday: 'Vrijdag', meta: 'Vrijdag · Zolder', locationLabel: 'Zolder',
    status: o.status ?? null, opensLabel: 'Opent 1 mrt', deadlineLabel: o.deadlineLabel ?? '',
    ongoing: o.ongoing ?? false, href: '/events/1',
  } satisfies RaceView,
  registerLabel: 'Inschrijven',
  saved: o.saved ?? false,
  saveLabel: o.saveLabel ?? '',
  livestreamLabel: o.livestreamLabel ?? '',
});

describe('RaceRow', () => {
  it('makes the title the only row link to the detail target', () => {
    render(RaceRow, { props: props() });
    const link = screen.getByRole('link', { name: title });
    expect(link).toHaveAttribute('href', '/events/1');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('shows an independent registration link when registration is open', () => {
    render(RaceRow, { props: props({ status: { state: 'open', label: 'Inschrijving open' } }) });
    const register = screen.getByRole('link', { name: 'Inschrijven' });
    expect(register).toHaveAttribute('href', 'https://example.com/register');
    expect(register).toHaveAttribute('target', '_blank');
    expect(register).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(register.closest('.action')).not.toBeNull();
    expect(register.closest('.row-link')).toBeNull();
  });

  it('shows the opening time and no button before registration opens', () => {
    render(RaceRow, { props: props({ status: { state: 'soon', label: 'Binnenkort' } }) });
    expect(screen.getByText('Opent 1 mrt')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
  });

  it('shows no button when closed or without a registration url', () => {
    const { unmount } = render(RaceRow, { props: props({ status: { state: 'closed', label: 'Gesloten' } }) });
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
    unmount();
    render(RaceRow, { props: props({ registrationUrl: null, status: { state: 'open', label: 'Open' } }) });
    expect(screen.queryByRole('link', { name: 'Inschrijven' })).not.toBeInTheDocument();
  });

  it('uses the type tokens for the row and neutral ones for unknown types', () => {
    const { container, unmount } = render(RaceRow, { props: props() });
    expect(container.querySelector('.race-ec')).toBeInTheDocument();
    unmount();
    const { container: c2 } = render(RaceRow, { props: props({ type: 'Training' }) });
    expect(c2.querySelector('.race-unknown')).toBeInTheDocument();
  });
});

describe('RaceRow save and livestream slots', () => {
  it('shows a pressed star button outside the row link and emits save', async () => {
    const { fireEvent } = await import('@testing-library/svelte');
    const { component } = render(RaceRow, { props: props({ saveLabel: 'Bewaren', saved: true }) });
    let saves = 0;
    component.$on('save', () => saves++);
    const star = screen.getByRole('button', { name: 'Bewaren' });
    expect(star).toHaveAttribute('aria-pressed', 'true');
    expect(star.closest('.row-link')).toBeNull();
    await fireEvent.click(star);
    expect(saves).toBe(1);
  });

  it('hides the star without a label', () => {
    render(RaceRow, { props: props() });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a livestream link only with url and label', () => {
    const { unmount } = render(RaceRow, { props: props({ ongoing: true, livestreamUrl: 'https://live.example', livestreamLabel: 'Livestream' }) });
    expect(screen.getByRole('link', { name: 'Livestream' })).toHaveAttribute('href', 'https://live.example');
    unmount();
    render(RaceRow, { props: props({ ongoing: true, livestreamUrl: 'https://live.example' }) });
    expect(screen.queryByRole('link', { name: 'Livestream' })).not.toBeInTheDocument();
  });

  it('hides the livestream link when the race is not ongoing', () => {
    render(RaceRow, { props: props({ livestreamUrl: 'https://live.example', livestreamLabel: 'Livestream' }) });
    expect(screen.queryByRole('link', { name: 'Livestream' })).not.toBeInTheDocument();
  });
});

describe('RaceRow deadline and type placement', () => {
  it('shows the deadline next to an open registration instead of the status label', () => {
    render(RaceRow, { props: props({ status: { state: 'open', label: 'Inschrijving open' }, deadlineLabel: 'Deadline 12 mrt' }) });
    expect(screen.getByText('Deadline 12 mrt')).toBeInTheDocument();
    expect(screen.queryByText('Inschrijving open')).not.toBeInTheDocument();
  });

  it('keeps the status label when registration is closed', () => {
    render(RaceRow, { props: props({ status: { state: 'closed', label: 'Gesloten' }, deadlineLabel: 'Deadline 12 mrt' }) });
    expect(screen.getByText('Gesloten')).toBeInTheDocument();
    expect(screen.queryByText('Deadline 12 mrt')).not.toBeInTheDocument();
  });

  it('renders the title as h3 by default and as h4 when asked', () => {
    const { unmount } = render(RaceRow, { props: props() });
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    unmount();
    render(RaceRow, { props: { ...props(), headingLevel: 4 } });
    expect(screen.getByRole('heading', { level: 4, name: title })).toBeInTheDocument();
  });

  it('renders one type label per row', () => {
    const { container } = render(RaceRow, { props: props() });
    expect(container.querySelectorAll('.type-label')).toHaveLength(1);
  });
});
