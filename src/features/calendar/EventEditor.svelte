<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Event, EventType } from '@types';
  import { Modal, Button, Input, Select } from '@shared/components';
  import { EventsService } from '@shared/services';

  export let event: Event | null = null;
  export let eventTypes: EventType[] = [];
  export let open = false;

  const dispatch = createEventDispatcher();

  let formData = {
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    event_type_id: '',
    status: 'upcoming' as 'upcoming' | 'completed' | 'cancelled'
  };

  let saving = false;
  let error = '';

  $: if (event && open) {
    formData = {
      title: event.title || '',
      date: event.date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location || '',
      description: event.description || '',
      event_type_id: event.event_type_id || '',
      status: event.status || 'upcoming'
    };
  }

  async function handleSave() {
    if (!event) return;

    error = '';
    saving = true;

    try {
      const updateData = {
        title: formData.title,
        date: formData.date,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        location: formData.location,
        description: formData.description,
        event_type_id: formData.event_type_id || null,
        status: formData.status
      };

      await EventsService.updateEvent(event.id, updateData);
      dispatch('saved');
      handleClose();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to save event';
    } finally {
      saving = false;
    }
  }

  function handleClose() {
    open = false;
    error = '';
    dispatch('close');
  }
</script>

<Modal {open} on:close={handleClose} title="Edit Event">
  <form on:submit|preventDefault={handleSave}>
    <div class="form-group">
      <Input
        label="Title"
        bind:value={formData.title}
        required
        placeholder="Event title"
      />
    </div>

    <div class="form-group">
      <Input
        label="Date"
        type="date"
        bind:value={formData.date}
        required
      />
    </div>

    <div class="form-group">
      <Input
        label="Start Time"
        type="time"
        bind:value={formData.start_time}
      />
    </div>

    <div class="form-group">
      <Input
        label="End Time"
        type="time"
        bind:value={formData.end_time}
      />
    </div>

    <div class="form-group">
      <Input
        label="Location"
        bind:value={formData.location}
        placeholder="Event location"
      />
    </div>

    <div class="form-group">
      <Select
        label="Event Type"
        bind:value={formData.event_type_id}
        options={eventTypes.map(t => ({ value: t.id, label: t.name }))}
        placeholder="Select event type"
      />
    </div>

    <div class="form-group">
      <Select
        label="Status"
        bind:value={formData.status}
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]}
      />
    </div>

    <div class="form-group">
      <label for="description">Description</label>
      <textarea
        id="description"
        bind:value={formData.description}
        placeholder="Event description"
        rows="4"
      />
    </div>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <div class="form-actions">
      <Button type="button" variant="secondary" on:click={handleClose} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  </form>
</Modal>

<style>
  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.875rem;
    resize: vertical;
  }

  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .error-message {
    padding: 0.75rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #dc2626;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
</style>
