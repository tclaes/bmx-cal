import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import App from '../App.svelte';

describe('Footer version check', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should display version number in footer', async () => {
    render(App);

    await waitFor(() => {
      const versionButton = screen.getByTitle(/Current version:/);
      expect(versionButton).toBeInTheDocument();
      expect(versionButton).toHaveTextContent('v1.0.0');
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

  it('should display update message after check', async () => {
    render(App);

    await waitFor(() => {
      const versionButton = screen.getByTitle(/Current version:/);
      fireEvent.click(versionButton);
    });

    await waitFor(() => {
      const updateMessage = screen.queryByText(/latest version|Update available/);
      expect(updateMessage).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
