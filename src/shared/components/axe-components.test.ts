import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { axe } from 'vitest-axe';

import Modal from './Modal.svelte';
import Alert from './Alert.svelte';
import Button from './Button.svelte';
import Input from './Input.svelte';
import Select from './Select.svelte';
import Dropdown from './Dropdown.svelte';
import CheckboxItem from './CheckboxItem.svelte';
import Badge from './Badge.svelte';
import FileUpload from './FileUpload.svelte';
import LoadingSpinner from './LoadingSpinner.svelte';
import Card from './Card.svelte';

describe('axe: Modal', () => {
  it('has no violations when open', async () => {
    const { container } = render(Modal, { props: { open: true, title: 'Test Modal' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when closed', async () => {
    const { container } = render(Modal, { props: { open: false, title: 'Test Modal' } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Alert', () => {
  it('has no violations for info type', async () => {
    const { container } = render(Alert, { props: { type: 'info', message: 'Info message' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations for danger type', async () => {
    const { container } = render(Alert, { props: { type: 'danger', message: 'Error message' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when dismissible', async () => {
    const { container } = render(Alert, {
      props: { type: 'info', message: 'Dismissible message', dismissible: true, onDismiss: () => {} }
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Button', () => {
  it('has no violations', async () => {
    const { container } = render(Button);
    container.querySelector('button')!.textContent = 'Click me';
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when disabled', async () => {
    const { container } = render(Button, { props: { disabled: true } });
    container.querySelector('button')!.textContent = 'Click me';
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Input', () => {
  it('has no violations with label', async () => {
    const { container } = render(Input, { props: { id: 'test-input', label: 'Your name', value: '' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with error state', async () => {
    const { container } = render(Input, {
      props: { id: 'test-input', label: 'Your name', value: '', error: 'This field is required' }
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Select', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('has no violations with label', async () => {
    const { container } = render(Select, { props: { id: 'test-select', label: 'Choose option', options } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with error state', async () => {
    const { container } = render(Select, {
      props: { id: 'test-select', label: 'Choose option', options, error: 'Please select an option' }
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Dropdown', () => {
  it('has no violations when closed', async () => {
    const { container } = render(Dropdown, { props: { id: 'test-dropdown', label: 'Filter', open: false } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when open', async () => {
    const { container } = render(Dropdown, { props: { id: 'test-dropdown', label: 'Filter', open: true } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: CheckboxItem', () => {
  it('has no violations when unchecked', async () => {
    const { container } = render(CheckboxItem, { props: { label: 'Accept terms', checked: false } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when checked', async () => {
    const { container } = render(CheckboxItem, { props: { label: 'Accept terms', checked: true } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Badge', () => {
  it('has no violations with default color', async () => {
    const { container } = render(Badge, { props: { label: 'Active' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with custom color', async () => {
    const { container } = render(Badge, { props: { label: 'Custom', color: '#1d4ed8' } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: FileUpload', () => {
  it('has no violations', async () => {
    const { container } = render(FileUpload, { props: { label: 'Upload document' } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when disabled', async () => {
    const { container } = render(FileUpload, { props: { label: 'Upload document', disabled: true } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: LoadingSpinner', () => {
  it('has no violations', async () => {
    const { container } = render(LoadingSpinner);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations with custom label', async () => {
    const { container } = render(LoadingSpinner, { props: { label: 'Loading events...' } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('axe: Card', () => {
  it('has no violations', async () => {
    const { container } = render(Card);
    expect(await axe(container)).toHaveNoViolations();
  });
});
