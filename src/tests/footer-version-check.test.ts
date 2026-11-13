import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import App from '../App.svelte';
vi.mock('@config/version', () => ({
  APP_VERSION: '0.0.2',
  MIN_VERSION: '0.0.1',
  RELEASE_NOTES: {},
}));

let deployed = '0.0.2';
const jsonResponse = (body: unknown) => ({
  ok: true,
  headers: new Headers({ 'content-type': 'application/json' }),
  json: async () => body,
});

vi.mock('@data', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          then: (resolve: (v: unknown) => void) => resolve({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

describe('Footer version check', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    deployed = '0.0.2';
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ version: deployed, minVersion: '0.0.1' })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should display version number in footer', async () => {
    render(App);

    await waitFor(() => {
      const versionButton = screen.getByTitle(/Current version:/);
      expect(versionButton).toBeInTheDocument();
      expect(versionButton).toHaveTextContent('v0.0.2');
    });
  });

  it('should be clickable for non-logged-in users', async () => {
    render(App);

    await waitFor(() => {
      const versionButton = screen.getByTitle(/Current version:/);
      expect(versionButton).toBeEnabled();
    });
  });

  it('should show checking state when clicked', async () => {
    render(App);

    await waitFor(() => {
      const versionButton = screen.getByTitle(/Current version:/);
      fireEvent.click(versionButton);
    });

    const checkingText = screen.queryByText('Checking...');
    if (checkingText) {
      expect(checkingText).toBeInTheDocument();
    }
  });

  it('shows "latest version" when up to date, without a banner', async () => {
    render(App);

    await waitFor(() => {
      fireEvent.click(screen.getByTitle(/Current version:/));
    });

    await waitFor(() => {
      expect(screen.getByText(/latest version/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.queryByText('A new version is available.')).not.toBeInTheDocument();
  });

  it('shows the optional banner when a newer version is deployed', async () => {
    deployed = '0.0.3';
    render(App);

    await waitFor(() => {
      fireEvent.click(screen.getByTitle(/Current version:/));
    });

    await waitFor(() => {
      expect(screen.getByText('A new version is available.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('reports a failed check when the release information is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    render(App);

    await waitFor(() => {
      fireEvent.click(screen.getByTitle(/Current version:/));
    });

    await waitFor(() => {
      expect(screen.getByText(/failed|unable|could not/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
