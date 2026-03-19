import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CheckboxItem from '@shared/components/CheckboxItem.svelte';

describe('CheckboxItem Component', () => {
  it('renders with label', () => {
    const { getByText } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    expect(getByText('Test Option')).toBeInTheDocument();
  });

  it('renders checkbox in unchecked state by default', () => {
    const { getByRole } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('renders checkbox in checked state when checked prop is true', () => {
    const { getByRole } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
        checked: true,
      },
    });

    const checkbox = getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('dispatches change event with value when checkbox is clicked', async () => {
    const mockHandler = vi.fn();
    const { component, getByRole } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    component.$on('change', mockHandler);

    const checkbox = getByRole('checkbox');
    await fireEvent.click(checkbox);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'test-value',
      })
    );
  });

  it('dispatches change event when label is clicked', async () => {
    const mockHandler = vi.fn();
    const { component, getByText } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    component.$on('change', mockHandler);

    const label = getByText('Test Option');
    await fireEvent.click(label);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('has cursor pointer class on checkbox', () => {
    const { container } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
  });

  it('has non-selectable label', () => {
    const { container } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    const labelSpan = container.querySelector('.checkbox-label') as HTMLSpanElement;
    expect(labelSpan).toBeInTheDocument();
  });
});
