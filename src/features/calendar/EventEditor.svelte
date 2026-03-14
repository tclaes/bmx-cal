<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { Event, EventType, Location } from '@types';
  import { Modal, Button, Input, Select, LocationPicker } from '@shared/components';
  import { EventsService } from '@shared/services';

  export let event: Event | null = null;
  export let eventTypes: EventType[] = [];
  export let open = false;

  const dispatch = createEventDispatcher();

  let locations: Location[] = [];
  let formData = {
    title: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    location_id: '',
    description: '',
    event_type_id: '',
    status: 'upcoming' as 'upcoming' | 'completed' | 'cancelled',
    registration_url: '',
    registration_opens: '',
    registration_deadline: '',
    registration_status: ''
  };

  let saving = false;
  let error = '';
  let currentEventId: string | null = null;

  onMount(async () => {
    try {
      locations = await EventsService.getLocations();
    } catch {}
  });

  $: if (event && open && event.id !== currentEventId) {
    formData = {
      title: event.title || '',
      date: event.date || '',
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location || '',
      location_id: (event as any).location_id || '',
      description: event.description || '',
      event_type_id: event.event_type_id || '',
      status: event.status || 'upcoming',
      registration_url: event.registration_url || '',
      registration_opens: event.registration_opens || '',
      registration_deadline: event.registration_deadline || '',
      registration_status: event.registration_status || ''
    };
    currentEventId = event.id;
  }

  $: if (!open) {
    currentEventId = null;
  }

  function handleLocationChange(e: CustomEvent<{ locationId: string; locationLabel: string }>) {
    formData.location_id = e.detail.locationId;
    formData.location = e.detail.locationLabel;
  }

  function handleLocationsUpdated(e: CustomEvent<Location[]>) {
    locations = e.detail;
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
        location_id: formData.location_id || null,
        description: formData.description,
        event_type_id: formData.event_type_id || null,
        status: formData.status,
        registration_url: formData.registration_url || null,
        registration_opens: formData.registration_opens || null,
        registration_deadline: formData.registration_deadline || null,
        registration_status: formData.registration_status || null
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

    <div class="form-group form-group--cols">
      <Input
        label="Start Time"
        type="time"
        bind:value={formData.start_time}
      />
      <Input
        label="End Time"
        type="time"
        bind:value={formData.end_time}
      />
    </div>

    <div class="form-group">
      <LocationPicker
        {locations}
        selectedLocationId={formData.location_id}
        selectedLocationLabel={formData.location}
        on:change={handleLocationChange}
        on:locationsUpdated={handleLocationsUpdated}
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
      <label class="field-label" for="editor-description">Description</label>
      <textarea
        id="editor-description"
        bind:value={formData.description}
        placeholder="Event description"
        rows="4"
      />
    </div>

    <div class="form-group">
      <Input
        label="Registration URL"
        bind:value={formData.registration_url}
        placeholder="https://registration.jstiming.com/..."
        type="url"
      />
    </div>

    <div class="form-group form-group--cols">
      <Input
        label="Registration Opens"
        type="date"
        bind:value={formData.registration_opens}
      />
      <Input
        label="Registration Deadline"
        type="date"
        bind:value={formData.registration_deadline}
      />
    </div>

    <div class="form-group">
      <Select
        label="Registration Status"
        bind:value={formData.registration_status}
        options={[
          { value: '', label: 'Not Set' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' }
        ]}
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

  .form-group--cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .field-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    font-family: inherit;
    font-size: var(--font-size-sm);
    resize: vertical;
    box-sizing: border-box;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .error-message {
    padding: 0.75rem;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #dc2626;
    font-size: var(--font-size-sm);
    margin-bottom: 1rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  @media (max-width: 480px) {
    .form-group--cols {
      grid-template-columns: 1fr;
    }
  }
</style>
