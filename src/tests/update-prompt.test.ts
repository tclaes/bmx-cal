import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';

vi.mock('@config', () => ({
  APP_VERSION: '1.3.0',
  MIN_VERSION: '1.0.0',
  RELEASE_NOTES: { nl: 'Nieuw in 1.3.0', en: 'New in 1.3.0', fr: 'Nouveau en 1.3.0' },
}));

const fetchManifest = vi.fn();
const fetchOverride = vi.fn();
vi.mock('@core/services', () => ({
  ReleaseService: {
    fetchManifest: () => fetchManifest(),
    fetchOverride: () => fetchOverride(),
  },
}));

import { updateStore } from '@core/stores/pwa.store';
import { locale } from '../i18n';
import UpdatePrompt from '../layout/UpdatePrompt.svelte';
import UpdateRequired from '../layout/UpdateRequired.svelte';
import WhatsNew from '../layout/WhatsNew.svelte';

const manifest = (version: string, minVersion = '1.0.0') => ({ version, minVersion });

beforeEach(() => {
  localStorage.clear();
  locale.setLocale('en');
  updateStore.reset();
  fetchManifest.mockReset();
  fetchOverride.mockReset().mockResolvedValue(null);
});

describe('UpdatePrompt (optional update)', () => {
  it('shows a dismissible banner for a feature release, not a critical notice', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    render(UpdatePrompt);
    await updateStore.check();
    await tick();

    const banner = screen.getByRole('dialog', { name: 'A new version is available.' }) as HTMLDialogElement;
    expect(banner.tagName).toBe('DIALOG');
    expect(banner.open).toBe(true);
    expect(banner.dataset.modal).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
  });

  it('announces the banner through a live region that exists before it appears', async () => {
    const { container } = render(UpdatePrompt);
    const region = container.querySelector('[aria-live="polite"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveTextContent('');

    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    await updateStore.check();
    await tick();
    expect(region).toHaveTextContent('A new version is available. Actions available.');
  });

  it('uses ariaNotify instead of the live region when the browser has it', async () => {
    const ariaNotify = vi.fn();
    Object.defineProperty(document, 'ariaNotify', { configurable: true, value: ariaNotify });
    const { container } = render(UpdatePrompt);
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    await updateStore.check();
    await tick();
    expect(ariaNotify).toHaveBeenCalledWith('A new version is available. Actions available.');
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('');
    Reflect.deleteProperty(document, 'ariaNotify');
  });

  it('stays hidden after dismissing, also after another check', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    render(UpdatePrompt);
    await updateStore.check();
    await tick();

    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('A new version is available.')).not.toBeInTheDocument();

    await updateStore.check();
    await tick();
    expect(screen.queryByText('A new version is available.')).not.toBeInTheDocument();
  });

  it('reloads via applyUpdate', async () => {
    const apply = vi.spyOn(updateStore, 'applyUpdate').mockResolvedValue();
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    render(UpdatePrompt);
    await updateStore.check();
    await tick();

    await fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(apply).toHaveBeenCalled();
    apply.mockRestore();
  });

  it('is not shown for a mandatory update', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    render(UpdatePrompt);
    await updateStore.check();
    await tick();
    expect(screen.queryByText('A new version is available.')).not.toBeInTheDocument();
  });
});

describe('UpdateRequired (mandatory update)', () => {
  it('opens as a modal dialog with no way to dismiss it', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    render(UpdateRequired);
    await updateStore.check();
    await tick();

    const dialog = screen.getByRole('alertdialog') as HTMLDialogElement;
    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog.open).toBe(true);
    expect(dialog.dataset.modal).toBe('true');
    expect(screen.getByText('Update required')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update Now' })).toHaveFocus());
  });

  it('cannot be dismissed with Escape', async () => {
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    render(UpdateRequired);
    await updateStore.check();
    await tick();

    const dialog = screen.getByRole('alertdialog') as HTMLDialogElement;
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);

    dialog.close();
    expect(dialog.open).toBe(false);
    await waitFor(() => expect(dialog.open).toBe(true));
  });

  it('shows the override message in the user language', async () => {
    locale.setLocale('nl');
    fetchManifest.mockResolvedValue(manifest('1.4.0', '1.0.0'));
    fetchOverride.mockResolvedValue({ minVersion: '1.4.0', message: { nl: 'Belangrijke fix voor inschrijvingen', en: 'Fix' } });
    render(UpdateRequired);
    await updateStore.check();
    await tick();

    expect(screen.getByText('Belangrijke fix voor inschrijvingen')).toBeInTheDocument();
  });

  it('falls back to another language when the message lacks the user language', async () => {
    locale.setLocale('fr');
    fetchManifest.mockResolvedValue(manifest('1.4.0', '1.0.0'));
    fetchOverride.mockResolvedValue({ minVersion: '1.4.0', message: { en: 'Important fix for registrations' } });
    render(UpdateRequired);
    await updateStore.check();
    await tick();

    expect(screen.getByText('Important fix for registrations')).toBeInTheDocument();
  });

  it('calls applyUpdate from its only button', async () => {
    const apply = vi.spyOn(updateStore, 'applyUpdate').mockResolvedValue();
    fetchManifest.mockResolvedValue(manifest('1.3.1', '1.3.1'));
    render(UpdateRequired);
    await updateStore.check();
    await tick();

    await fireEvent.click(screen.getByRole('button', { name: 'Update Now' }));
    expect(apply).toHaveBeenCalled();
    apply.mockRestore();
  });

  it('stays closed for optional updates', async () => {
    fetchManifest.mockResolvedValue(manifest('1.4.0'));
    const { container } = render(UpdateRequired);
    await updateStore.check();
    await tick();
    expect((container.querySelector('dialog') as HTMLDialogElement).open).toBe(false);
  });
});

describe('WhatsNew (release notes)', () => {
  it('shows the notes once after updating', async () => {
    localStorage.setItem('last_seen_version', '1.2.0');
    const { unmount } = render(WhatsNew);
    await tick();
    expect(screen.getByText('New in 1.3.0')).toBeInTheDocument();
    expect(localStorage.getItem('last_seen_version')).toBe('1.3.0');
    unmount();

    render(WhatsNew);
    await tick();
    expect(screen.queryByText('New in 1.3.0')).not.toBeInTheDocument();
  });

  it('also shows them for users coming from the old version checker', async () => {
    localStorage.setItem('app_version', '0.3.0');
    render(WhatsNew);
    await tick();
    expect(screen.getByText('New in 1.3.0')).toBeInTheDocument();
    expect(localStorage.getItem('app_version')).toBeNull();
  });

  it('never shows them on a first visit', async () => {
    render(WhatsNew);
    await tick();
    expect(screen.queryByText('New in 1.3.0')).not.toBeInTheDocument();
    expect(localStorage.getItem('last_seen_version')).toBe('1.3.0');
  });
});
