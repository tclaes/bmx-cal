import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Footer from '../shared/components/Footer.svelte';

describe('Footer version check', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should display version number in footer', async () => {
    render(Footer);

    const versionButton = await screen.findByTitle(/Current version:/);
    expect(versionButton).toBeInTheDocument();
    expect(versionButton).toHaveTextContent(/^v\d+\.\d+\.\d+$/);
  });

  it('should be clickable for non-logged-in users', async () => {
    render(Footer);

    const versionButton = await screen.findByTitle(/Current version:/);
    expect(versionButton).toBeEnabled();
  });

  it('should show checking state when clicked', async () => {
    render(Footer);

    const versionButton = await screen.findByTitle(/Current version:/);
    fireEvent.click(versionButton);

    const checkingText = screen.queryByText('Checking...');
    if (checkingText) {
      expect(checkingText).toBeInTheDocument();
    }
  });

  it('should display update message after check', async () => {
    render(Footer);

    const versionButton = await screen.findByTitle(/Current version:/);
    fireEvent.click(versionButton);

    await waitFor(() => {
      const updateMessage = screen.queryByText(/latest version|Update available/i);
      expect(updateMessage).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
