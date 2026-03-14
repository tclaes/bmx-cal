<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from '../../shared/components/Modal.svelte';
  import Button from '../../shared/components/Button.svelte';
  import Input from '../../shared/components/Input.svelte';
  import Alert from '../../shared/components/Alert.svelte';
  import { CalendarService } from '../../shared/services/calendar.service';
  import type { SavedCalendar } from '../../shared/services/calendar.service';

  export let open = false;
  export let selectedEventIds: string[] = [];

  const dispatch = createEventDispatcher<{ saved: SavedCalendar; close: void }>();

  let name = '';
  let saving = false;
  let error = '';

  $: if (!open) {
    name = '';
    error = '';
    saving = false;
  }

  async function handleSave() {
    error = '';
    if (!name.trim()) {
      error = 'Please enter a name for your calendar';
      return;
    }
    if (selectedEventIds.length === 0) {
      error = 'Please select at least one event before saving';
      return;
    }

    saving = true;
    try {
      const saved = await CalendarService.saveCalendar(name, selectedEventIds);
      dispatch('saved', saved);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save calendar';
    } finally {
      saving = false;
    }
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<Modal {open} title="Save calendar" on:close={handleClose}>
  <div class="save-modal-body">
    <p class="description">
      Give your calendar a name to save your current selection of
      <strong>{selectedEventIds.length} event{selectedEventIds.length === 1 ? '' : 's'}</strong>.
    </p>

    {#if error}
      <Alert type="danger" message={error} />
    {/if}

    <form on:submit|preventDefault={handleSave} class="form">
      <Input
        type="text"
        id="calendar-name"
        label="Calendar name"
        placeholder="e.g. My 2026 season"
        bind:value={name}
        required
      />

      <div class="meta">
        <span class="meta-label">Saved on</span>
        <span class="meta-value">
          {new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div class="actions">
        <Button type="button" variant="secondary" on:click={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save calendar'}
        </Button>
      </div>
    </form>
  </div>
</Modal>

<style>
  .save-modal-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .description {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    line-height: 1.5;
  }

  .description strong {
    color: var(--color-text-primary);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
  }

  .meta-label {
    color: var(--color-text-secondary);
  }

  .meta-value {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
  }

  .actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
    padding-top: var(--spacing-sm);
  }
</style>
