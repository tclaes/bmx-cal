import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Dropdown from '@shared/components/Dropdown.svelte';

describe('Dropdown Component', () => {
  it('renders with label and placeholder', () => {
    const { getByText, getByRole } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        placeholder: 'Select items',
      },
    });

    expect(getByText('Test Label')).toBeInTheDocument();
    expect(getByRole('button')).toHaveTextContent('Select items');
  });

  it('displays selected count when items are selected', () => {
    const { getByRole } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        selectedCount: 3,
      },
    });

    expect(getByRole('button')).toHaveTextContent('3 selected');
  });

  it('toggles dropdown menu on button click', async () => {
    const mockHandler = vi.fn();
    const { component, getByRole, container } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        open: false,
      },
    });

    component.$on('toggle', mockHandler);

    const button = getByRole('button');

    expect(container.querySelector('.dropdown-menu')).not.toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(button);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('dispatches toggle event when button is clicked', async () => {
    const mockHandler = vi.fn();
    const { component, getByRole } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
      },
    });

    component.$on('toggle', mockHandler);

    const button = getByRole('button');
    await fireEvent.click(button);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('shows correct arrow direction based on open state', () => {
    const { container } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        open: false,
      },
    });

    expect(container.querySelector('.dropdown-arrow')).toHaveTextContent('▼');
  });

  it('shows up arrow when dropdown is open', () => {
    const { container } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        open: true,
      },
    });

    expect(container.querySelector('.dropdown-arrow')).toHaveTextContent('▲');
  });

  it('closes dropdown when clicking outside', async () => {
    const mockHandler = vi.fn();
    const { component, container } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        open: true,
      },
    });

    component.$on('toggle', mockHandler);

    await fireEvent.click(document.body);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('does not close dropdown when clicking inside', async () => {
    const mockHandler = vi.fn();
    const { component, getByRole } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        open: true,
      },
    });

    component.$on('toggle', mockHandler);

    const button = getByRole('button');
    await fireEvent.click(button);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('shows dropdown menu when open prop is true', () => {
    const { container } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
        open: true,
      },
    });

    expect(container.querySelector('.dropdown-menu')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const { getByRole } = render(Dropdown, {
      props: {
        label: 'Test Label',
        id: 'test-dropdown',
      },
    });

    const button = getByRole('button');

    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('id', 'test-dropdown-btn');
  });
});
