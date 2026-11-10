import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { run } from 'axe-core';
import type { AxeResults } from 'axe-core';
import '@testing-library/jest-dom';
import Badge from '@ui/Badge.svelte';
import Alert from '@ui/Alert.svelte';
import Modal from '@ui/Modal.svelte';
import LoadingSpinner from '@ui/LoadingSpinner.svelte';import ButtonWithText from './fixtures/ButtonWithText.svelte';
import Button from '@ui/Button.svelte';
import Card from '@ui/Card.svelte';
import CheckboxItem from '@ui/CheckboxItem.svelte';
import Input from '@ui/Input.svelte';
import Select from '@ui/Select.svelte';
import Dropdown from '@ui/Dropdown.svelte';
import FileUpload from '@ui/FileUpload.svelte';

function expectNoViolations(results: AxeResults) {
  const failures = results.violations
    .map((v) => `${v.id} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'}): ${v.help}`)
    .join('; ');
  expect(failures).toBe('');
}

async function axe(container: HTMLElement): Promise<AxeResults> {
  const wrapper = document.createElement('main');
  wrapper.appendChild(container);
  document.body.appendChild(wrapper);
  const results = await run(document.body) as AxeResults;
  wrapper.remove();
  return results;
}

describe('axe-core component accessibility', () => {
  it('Badge has no violations', async () => {
    const { container } = render(Badge, { props: { label: 'World Cup', color: '#f59e0b' } });
    expectNoViolations(await axe(container));
  });

  it('Badge uses WCAG-AA-safe default and variant colors', async () => {
    const variants = [
      { color: '#3b82f6' },
      { variant: 'success' },
      { variant: 'warning' },
      { variant: 'error' },
    ] as const;
    for (const props of variants) {
      const { container, unmount } = render(Badge, { props: { label: 'X', ...props } });
      expectNoViolations(await axe(container));
      unmount();
    }
  });

  it('Alert has no violations', async () => {
    const { container } = render(Alert, {
      props: { type: 'danger', message: 'Something went wrong', dismissible: true },
    });
    expectNoViolations(await axe(container));
  });

  it('Modal has no violations', async () => {
    const { container } = render(Modal, { props: { open: true, title: 'Test Modal' } });
    expectNoViolations(await axe(container));
  });

  it('LoadingSpinner has no violations', async () => {
    const { container } = render(LoadingSpinner);
    expectNoViolations(await axe(container));
  });

  it('Button has no violations', async () => {
    const { container } = render(ButtonWithText);
    expectNoViolations(await axe(container));
  });

  it('Card has no violations', async () => {
    const { container } = render(Card);
    expectNoViolations(await axe(container));
  });

  it('CheckboxItem has no violations', async () => {
    const { container } = render(CheckboxItem, {
      props: { label: 'My checkbox', value: 'my-checkbox', checked: false },
    });
    expectNoViolations(await axe(container));
  });

  it('Input has no violations', async () => {
    const { container } = render(Input, { props: { label: 'Email', id: 'email-input', value: '' } });
    expectNoViolations(await axe(container));
  });

  it('Select has no violations', async () => {
    const { container } = render(Select, {
      props: {
        label: 'Event type',
        id: 'event-type-select',
        value: '',
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
      },
    });
    expectNoViolations(await axe(container));
  });

  it('Dropdown has no violations', async () => {
    const { container } = render(Dropdown, { props: { label: 'Filter by type', id: 'type-dropdown' } });
    expectNoViolations(await axe(container));
  });

  it('FileUpload has no violations', async () => {
    const { container } = render(FileUpload, { props: { label: 'Upload file' } });
    expectNoViolations(await axe(container));
  });
});
