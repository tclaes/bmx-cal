<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Input, Select, Alert, LoadingSpinner, LocationPicker } from '@shared/components';
  import { authStore } from '@shared/stores';
  import { EventsService } from '@shared/services';
  import { supabase } from '@data/supabase';
import type { EventWithDetails, EventType, Location, Team } from '@types';

  let events: EventWithDetails[] = [];
  let locations: Location[] = [];
  let globalEventTypes: EventType[] = [];
  let teamEventType: EventType | null = null;
  let allTeams: Team[] = [];
  let selectedTeamId = '';
  let loading = false;
  let error = '';
  let successMessage = '';

  let showForm = false;
  let editingEvent: EventWithDetails | null = null;
  let deletingEventId: string | null = null;


  $: user = $authStore.user;
  $: isAdmin = user?.role === 'admin';
  $: selectedTeam = allTeams.find(t => t.id === selectedTeamId) ?? null;

  let formData = {
    title: '',
    date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location_id: '',
    location: '',
    description: '',
    status: 'upcoming' as 'upcoming' | 'completed' | 'cancelled',
    related_event_type_id: '',
  };

  let saving = false;
  let formError = '';

  async function loadTeams() {
    if (isAdmin) {
      const { data } = await supabase.from('teams').select('*').order('name');
      allTeams = data ?? [];
    } else {
      allTeams = user?.teams ?? [];
    }
    if (allTeams.length > 0 && !selectedTeamId) {
      selectedTeamId = allTeams[0].id;
    }
  }

  async function loadData() {
    loading = true;
    error = '';
    try {
      await loadTeams();
      const [locs, allTypes] = await Promise.all([
        EventsService.getLocations(),
        EventsService.getEventTypes(),
      ]);
      locations = locs;
      globalEventTypes = allTypes.filter(t => t.team_id === null);
      if (selectedTeamId) {
        teamEventType = await EventsService.getTeamEventType(selectedTeamId);
      }
      await loadTeamEvents();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  }

  async function loadTeamEvents() {
    if (!selectedTeamId) {
      events = [];
      return;
    }
    const all = await EventsService.getAllEvents();
    events = all.filter(e => e.team_id === selectedTeamId);
  }

  async function handleTeamChange(e: Event) {
    selectedTeamId = (e.target as HTMLSelectElement).value;
    teamEventType = await EventsService.getTeamEventType(selectedTeamId);
    await loadTeamEvents();
  }

  function resetForm() {
    formData = {
      title: '',
      date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      location_id: '',
      location: '',
      description: '',
      status: 'upcoming',
      related_event_type_id: '',
    };
    formError = '';
  }

  function openCreateForm() {
    editingEvent = null;
    resetForm();
    showForm = true;
  }

  function openEditForm(event: EventWithDetails) {
    editingEvent = event;
    formData = {
      title: event.title,
      date: event.date,
      end_date: event.end_date ?? '',
      start_time: event.start_time ?? '',
      end_time: event.end_time ?? '',
      location_id: event.location_id ?? '',
      location: event.location,
      description: event.description ?? '',
      status: event.status,
      related_event_type_id: event.related_event_type_id ?? '',
    };
    formError = '';
    showForm = true;
  }

  function handleLocationChange(e: CustomEvent<{ locationId: string; locationLabel: string }>) {
    formData.location_id = e.detail.locationId;
    formData.location = e.detail.locationLabel;
  }

  function handleLocationsUpdated(e: CustomEvent<Location[]>) {
    locations = e.detail;
  }

  async function handleSave() {
    if (!selectedTeamId) return;
    if (!formData.location_id) {
      formError = 'Please select a location';
      return;
    }
    formError = '';
    saving = true;
    try {
      const payload = {
        title: formData.title,
        date: formData.date,
        end_date: formData.end_date || undefined,
        start_time: formData.start_time || undefined,
        end_time: formData.end_time || undefined,
        location: formData.location,
        location_id: formData.location_id,
        description: formData.description || undefined,
        event_type_id: teamEventType?.id,
        related_event_type_id: formData.related_event_type_id || undefined,
        team_id: selectedTeamId,
        status: formData.status,
      };

      if (editingEvent) {
        await EventsService.updateEvent(editingEvent.id, payload);
        successMessage = 'Event updated successfully';
      } else {
        await EventsService.createEvent(payload);
        successMessage = 'Event created successfully';
      }
      showForm = false;
      await loadTeamEvents();
    } catch (err) {
      formError = err instanceof Error ? err.message : 'Failed to save event';
    } finally {
      saving = false;
    }
  }

  async function handleDelete(event: EventWithDetails) {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    deletingEventId = event.id;
    error = '';
    successMessage = '';
    try {
      await EventsService.deleteEvent(event.id);
      successMessage = `"${event.title}" deleted`;
      await loadTeamEvents();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to delete event';
    } finally {
      deletingEventId = null;
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="tm-container">
  <div class="tm-header">
    <div class="tm-header-left">
      <h1 class="tm-title">Team Manager</h1>
      {#if selectedTeam}
        <span class="team-badge">{selectedTeam.name}</span>
      {/if}
    </div>
  </div>

  <div class="tm-content">
    {#if error}
      <Alert type="danger" message={error} />
    {/if}
    {#if successMessage && !showForm}
      <Alert type="success" message={successMessage} />
    {/if}

    {#if !showForm}
      <Card padding="lg" shadow="md">
        <div class="section-header">
          <h2 class="section-title">Events for {selectedTeam?.name ?? 'your team'}</h2>
          <div class="header-right">
            {#if allTeams.length > 1}
              <select class="team-select" value={selectedTeamId} on:change={handleTeamChange}>
                {#each allTeams as team (team.id)}
                  <option value={team.id}>{team.name}</option>
                {/each}
              </select>
            {/if}
            <Button variant="primary" on:click={openCreateForm}>+ Add Event</Button>
          </div>
        </div>

        {#if loading}
          <div class="loading-wrap">
            <LoadingSpinner size="lg" />
          </div>
        {:else if events.length === 0}
          <p class="empty-state">No events yet. Add your first event above.</p>
        {:else}
          <div class="events-list">
            {#each events as event (event.id)}
              <div class="event-row">
                <div class="event-info">
                  <span class="event-title">{event.title}</span>
                  <span class="event-meta">{formatDate(event.date)} &middot; {event.location}</span>
                </div>
                <div class="event-actions">
                  <Button variant="secondary" size="sm" on:click={() => openEditForm(event)}>Edit</Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deletingEventId === event.id}
                    on:click={() => handleDelete(event)}
                  >
                    {deletingEventId === event.id ? '...' : 'Delete'}
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card>
    {:else}
      <Card padding="lg" shadow="md">
        <div class="section-header">
          <h2 class="section-title">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
          {#if teamEventType}
            <span class="type-badge" style="background:{teamEventType.color_code}20; color:{teamEventType.color_code}; border-color:{teamEventType.color_code}40">
              {teamEventType.name}
            </span>
          {/if}
        </div>

        {#if formError}
          <Alert type="danger" message={formError} />
        {/if}

        <form on:submit|preventDefault={handleSave} class="event-form">
          <div class="form-row">
            <Input label="Title" bind:value={formData.title} required placeholder="Event title" />
          </div>
          <div class="form-row form-row--cols">
            <Input label="Date" type="date" bind:value={formData.date} required />
            <Input label="End Date" type="date" bind:value={formData.end_date} />
          </div>
          <div class="form-row form-row--cols">
            <Input label="Start Time" type="time" bind:value={formData.start_time} />
            <Input label="End Time" type="time" bind:value={formData.end_time} />
          </div>

          <div class="form-row">
            <LocationPicker
              {locations}
              selectedLocationId={formData.location_id}
              selectedLocationLabel={formData.location}
              required
              on:change={handleLocationChange}
              on:locationsUpdated={handleLocationsUpdated}
            />
          </div>

          <div class="form-row form-row--cols">
            <Select
              label="Status"
              bind:value={formData.status}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <Select
              label="For event type"
              bind:value={formData.related_event_type_id}
              placeholder="None"
              options={globalEventTypes.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>

          <div class="form-row">
            <label class="field-label" for="tm-description">Description</label>
            <textarea
              id="tm-description"
              bind:value={formData.description}
              rows="3"
              placeholder="Optional description"
            />
          </div>

          <div class="form-actions">
            <Button type="button" variant="ghost" on:click={() => { showForm = false; resetForm(); }} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Card>
    {/if}
  </div>
</div>

<style>
  .tm-container {
    min-height: 100vh;
    background-color: var(--color-bg-secondary);
    padding: var(--spacing-2xl) var(--spacing-md);
  }

  .tm-header {
    max-width: 800px;
    margin: 0 auto var(--spacing-xl);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tm-header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .tm-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .team-badge {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    background: var(--color-primary-100, #dbeafe);
    color: var(--color-primary-700, #1d4ed8);
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--color-primary-200, #bfdbfe);
  }

  .type-badge {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    border-radius: 20px;
    padding: 0.25rem 0.75rem;
    border: 1px solid;
  }

  .tm-content {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .team-select {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-sm);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .team-select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .section-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .loading-wrap {
    display: flex;
    justify-content: center;
    padding: var(--spacing-2xl) 0;
  }

  .empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-2xl) 0;
    font-size: var(--font-size-base);
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .event-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    gap: var(--spacing-md);
  }

  .event-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .event-title {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .event-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .event-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .form-row {
    display: flex;
    flex-direction: column;
  }

  .form-row--cols {
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

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
  }

  @media (max-width: 600px) {
    .form-row--cols {
      grid-template-columns: 1fr;
    }

    .event-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .event-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
