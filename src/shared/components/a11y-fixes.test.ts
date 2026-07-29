import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';
import Modal from './Modal.svelte';
import Alert from './Alert.svelte';
import FileUpload from './FileUpload.svelte';
import LoadingSpinner from './LoadingSpinner.svelte';
import Badge from './Badge.svelte';

describe('Modal Accessibility', () => {
  let originalActiveElement: Element | null;

  beforeEach(() => {
    originalActiveElement = document.activeElement;
  });

  afterEach(() => {
    if (originalActiveElement instanceof HTMLElement) {
      originalActiveElement.focus();
    }
  });

  it('should have proper ARIA attributes when open', () => {
    const { container } = render(Modal, {
      props: { open: true, title: 'Test Modal' }
    });

    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('should have accessible close button', () => {
    render(Modal, {
      props: { open: true, title: 'Test Modal' }
    });

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
  });

  it('should trap focus within modal', async () => {
    const { component } = render(Modal, {
      props: { open: true, title: 'Test Modal' }
    });

    const dialog = screen.getByRole('dialog');
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    await fireEvent.keyDown(dialog, { key: 'Tab' });

    // Focus should remain within the dialog after Tab
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('should close on Escape key', async () => {
    const handleClose = vi.fn();
    render(Modal, {
      props: { open: true, title: 'Test Modal', $$events: { close: handleClose } }
    });

    const dialog = screen.getByRole('dialog');
    await fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalled();
  });

  it('should meet minimum touch target size', () => {
    const { container } = render(Modal, {
      props: { open: true, title: 'Test Modal' }
    });

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    const styles = window.getComputedStyle(closeButton);

    const width = parseFloat(styles.width);
    const height = parseFloat(styles.height);

    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});

describe('Alert Accessibility', () => {
  it('should have proper ARIA live region for info alerts', () => {
    const { container } = render(Alert, {
      props: { type: 'info', message: 'Information message' }
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('should have assertive aria-live for danger alerts', () => {
    const { container } = render(Alert, {
      props: { type: 'danger', message: 'Error message' }
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('should have accessible dismiss button', () => {
    const handleDismiss = vi.fn();
    render(Alert, {
      props: {
        type: 'info',
        message: 'Test message',
        dismissible: true,
        onDismiss: handleDismiss
      }
    });

    const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss alert');
  });

  it('should dismiss when button is clicked', async () => {
    const handleDismiss = vi.fn();
    render(Alert, {
      props: {
        type: 'info',
        message: 'Test message',
        dismissible: true,
        onDismiss: handleDismiss
      }
    });

    const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
    await fireEvent.click(dismissButton);

    expect(handleDismiss).toHaveBeenCalled();
  });

  it('should meet minimum touch target size for dismiss button', () => {
    const handleDismiss = vi.fn();
    render(Alert, {
      props: {
        type: 'info',
        message: 'Test message',
        dismissible: true,
        onDismiss: handleDismiss
      }
    });

    const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
    const styles = window.getComputedStyle(dismissButton);

    const width = parseFloat(styles.width);
    const height = parseFloat(styles.height);

    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });
});

describe('FileUpload Accessibility', () => {
  it('should have accessible button role with proper label', () => {
    render(FileUpload, {
      props: { label: 'Upload Document' }
    });

    const uploadButton = screen.getByRole('button', { name: /upload document/i });
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveAttribute('aria-label');
  });

  it('should handle Enter key press', async () => {
    render(FileUpload, {
      props: { label: 'Upload File' }
    });

    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    uploadButton.focus();
    await fireEvent.keyDown(uploadButton, { key: 'Enter' });

    expect(document.activeElement).toBe(uploadButton);
  });

  it('should handle Space key press', async () => {
    render(FileUpload, {
      props: { label: 'Upload File' }
    });

    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    uploadButton.focus();
    await fireEvent.keyDown(uploadButton, { key: ' ' });

    expect(document.activeElement).toBe(uploadButton);
  });

  it('should hide decorative SVG from screen readers', () => {
    const { container } = render(FileUpload, {
      props: { label: 'Upload File' }
    });

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('should be keyboard accessible', () => {
    render(FileUpload, {
      props: { label: 'Upload File' }
    });

    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    expect(uploadButton).toHaveAttribute('tabindex', '0');
  });

  it('should be disabled when disabled prop is true', () => {
    render(FileUpload, {
      props: { label: 'Upload File', disabled: true }
    });

    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    expect(uploadButton).toHaveAttribute('tabindex', '-1');
  });
});

describe('LoadingSpinner Accessibility', () => {
  it('should have status role', () => {
    const { container } = render(LoadingSpinner);

    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should have aria-live region', () => {
    const { container } = render(LoadingSpinner);

    const spinner = container.querySelector('[aria-live="polite"]');
    expect(spinner).toBeInTheDocument();
  });

  it('should have screen reader text', () => {
    const { container } = render(LoadingSpinner);

    const srText = container.querySelector('.sr-only');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveTextContent('Loading...');
  });

  it('should support custom label', () => {
    const { container } = render(LoadingSpinner, {
      props: { label: 'Loading events...' }
    });

    const srText = container.querySelector('.sr-only');
    expect(srText).toHaveTextContent('Loading events...');
  });

  it('should visually hide screen reader text', () => {
    const { container } = render(LoadingSpinner);

    const srText = container.querySelector('.sr-only') as HTMLElement;
    const styles = window.getComputedStyle(srText);

    expect(styles.position).toBe('absolute');
    expect(styles.width).toBe('1px');
    expect(styles.height).toBe('1px');
  });
});

describe('Badge Accessibility', () => {
  it('should render with default color', () => {
    const { container } = render(Badge, {
      props: { label: 'Test Badge' }
    });

    const badge = container.querySelector('.badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Test Badge');
  });

  it('should use accessible text color based on background', () => {
    const { container } = render(Badge, {
      props: { label: 'Dark Badge', color: '#000000' }
    });

    const badge = container.querySelector('.badge') as HTMLElement;
    const styles = window.getComputedStyle(badge);

    expect(badge.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should use white text on darkened background', () => {
    const { container } = render(Badge, {
      props: { label: 'Light Badge', color: '#ffffff' }
    });

    const badge = container.querySelector('.badge') as HTMLElement;

    expect(badge.style.color).toBe('rgb(255, 255, 255)');
    expect(badge.style.backgroundColor).not.toBe('rgb(255, 255, 255)');
  });

  it('should calculate text color for custom colors', () => {
    const { container } = render(Badge, {
      props: { label: 'Blue Badge', color: '#3b82f6' }
    });

    const badge = container.querySelector('.badge') as HTMLElement;

    expect(badge.style.color).toBeTruthy();
    expect(['rgb(255, 255, 255)', 'rgb(0, 0, 0)']).toContain(badge.style.color);
  });
});
