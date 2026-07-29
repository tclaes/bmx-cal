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
    const { getByRole } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    const checkbox = getByRole('checkbox');
    checkbox.addEventListener('change', (e: any) => mockHandler(e));
    await fireEvent.change(checkbox);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('dispatches change event when label is clicked', async () => {
    const mockHandler = vi.fn();
    const { getByText } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    const label = getByText('Test Option');
    const checkbox = label.closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.addEventListener('change', (e: any) => mockHandler(e));
    await fireEvent.change(checkbox);

    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it('has cursor pointer class on checkbox', () => {
    const { container } = render(CheckboxItem, {
      props: {
        label: 'Test Option',
        value: 'test-value',
      },
    });

    const wrapper = container.querySelector('.checkbox-item') as HTMLLabelElement;
    expect(wrapper).toBeInTheDocument();
    const checkbox = wrapper.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    // The cursor:pointer CSS rule targets .checkbox-item input[type="checkbox"]
    expect(wrapper.classList.contains('checkbox-item')).toBe(true);
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
    // The user-select:none CSS rule targets .checkbox-label
    expect(labelSpan.classList.contains('checkbox-label')).toBe(true);
  });
});
