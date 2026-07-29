<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, Input, Select, Alert, LoadingSpinner, LocationPicker } from '@shared/components';
  import { authStore } from '@shared/stores';
  import TeamMemberManager from '../admin/TeamMemberManager.svelte';
  import { EventsService, TeamService } from '@shared/services';
  import type { TeamMemberWithEmail } from '@shared/services';
  import { supabase } from '@data/supabase';
  import { getInitialTeamExpandedState } from '@shared/utils';
  import type { EventWithDetails, EventType, Location, Team } from '@types';

  let allEvents: EventWithDetails[] = [];
  let locations: Location[] = [];
  let globalEventTypes: EventType[] = [];
  let teamEventType: EventType | null = null;
  let allTeams: Team[] = [];
  let selectedTeamId = '';
  let loading = false;
  let error = '';
  let successMessage = '';

  let members: TeamMemberWithEmail[] = [];
  let loadingMembers = false;
  let removingMemberId: string | null = null;
  let memberError = '';
  let memberSuccess = '';

  let showForm = false;
  let editingEvent: EventWithDetails | null = null;
  let deletingEventId: string | null = null;

  let teamMembers: Record<string, TeamMemberWithEmail[]> = {};
  let loadingMembersMap: Record<string, boolean> = {};

  $: user = $authStore.user;
  $: isAdmin = user?.role === 'admin';
  $: selectedTeam = allTeams.find(t => t.id === selectedTeamId) ?? null;

  $: eventsByTeam = allTeams.reduce((acc, team) => {
    acc[team.id] = allEvents.filter(e => e.team_id === team.id);
    return acc;
  }, {} as Record<string, EventWithDetails[]>);

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
      if (allTeams.length > 0 && !selectedTeamId) {
        selectedTeamId = allTeams[0].id;
      }
    }
  }

  async function loadData() {
    loading = true;
    error = '';
    try {
      await loadTeams();
      const [locs, allTypes, evts] = await Promise.all([
        EventsService.getLocations(),
        EventsService.getEventTypes(),
        EventsService.getAllEvents(),
      ]);
      locations = locs;
      globalEventTypes = allTypes.filter(t => t.team_id === null);
      allEvents = evts.filter(e => e.team_id !== null);

      if (!isAdmin && selectedTeamId) {
        teamEventType = await EventsService.getTeamEventType(selectedTeamId);
        await loadMembersForTeam(selectedTeamId);
      } else if (isAdmin) {
        for (const team of allTeams) {
          await loadMembersForTeam(team.id);
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  }

  async function loadMembersForTeam(teamId: string) {
    loadingMembersMap = { ...loadingMembersMap, [teamId]: true };
    try {
      teamMembers = { ...teamMembers, [teamId]: await TeamService.getTeamMembers(teamId) };
    } catch {
      teamMembers = { ...teamMembers, [teamId]: [] };
    } finally {
      loadingMembersMap = { ...loadingMembersMap, [teamId]: false };
    }
  }

  async function handleRemoveMember(member: TeamMemberWithEmail, team: Team) {
    if (!confirm(`Remove ${member.user_email} from ${team.name}?`)) return;
    removingMemberId = member.id;
    memberError = '';
    memberSuccess = '';
    try {
      await TeamService.removeTeamMember(member.id);
      memberSuccess = `${member.user_email} removed from ${team.name}`;
      await loadMembersForTeam(team.id);
    } catch (err) {
      memberError = err instanceof Error ? err.message : 'Failed to remove member';
    } finally {
      removingMemberId = null;
    }
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

  async function openCreateForm(teamId: string) {
    selectedTeamId = teamId;
    teamEventType = await EventsService.getTeamEventType(teamId);
    editingEvent = null;
    resetForm();
    showForm = true;
  }

  async function openEditForm(event: EventWithDetails) {
    selectedTeamId = event.team_id ?? '';
    teamEventType = selectedTeamId ? await EventsService.getTeamEventType(selectedTeamId) : null;
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
      const evts = await EventsService.getAllEvents();
      allEvents = evts.filter(e => e.team_id !== null);
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
      const evts = await EventsService.getAllEvents();
      allEvents = evts.filter(e => e.team_id !== null);
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
      {#if !isAdmin && selectedTeam}
        <span class="team-badge">{selectedTeam.name}</span>
      {/if}
    </div>
  </div>

  <div class="tm-content">
    {#if error}
      <Alert type="danger" message={error} />
    {/if}
    {#if memberError}
      <Alert type="danger" message={memberError} />
    {/if}
    {#if successMessage && !showForm}
      <Alert type="success" message={successMessage} />
    {/if}
    {#if memberSuccess && !showForm}
      <Alert type="success" message={memberSuccess} />
    {/if}

    {#if !showForm}
      {#if loading}
        <div class="loading-wrap"><LoadingSpinner size="lg" /></div>
      {:else if allTeams.length === 0}
        <p class="empty-state">No teams found.</p>
      {:else}
        {#each allTeams as team (team.id)}
          {@const teamEvts = eventsByTeam[team.id] ?? []}
          {@const teamMbrs = teamMembers[team.id] ?? []}

          <div class="team-group">
            <details class="team-details">
              <summary class="team-summary">
                <div class="team-summary-left">
                  <svg class="team-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="team-name">{team.name}</span>
                  <span class="event-count">{teamEvts.length} event{teamEvts.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="team-summary-action" on:click|stopPropagation role="none">
                  <Button variant="primary" size="sm" on:click={() => openCreateForm(team.id)}>
                    + Add Event
                  </Button>
                </div>
              </summary>

              <div class="team-group-body">
                {#if teamEvts.length === 0}
                  <p class="empty-state-inline">No events yet for this team.</p>
                {:else}
                  <div class="events-list">
                    {#each teamEvts as event (event.id)}
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

                <details class="members-details">
                  <summary class="members-summary">
                    <svg class="members-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 3.75L5 6.25l2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Members
                    <span class="member-pill">{teamMbrs.length}</span>
                  </summary>

                  <div class="members-section">
                    {#if loadingMembersMap[team.id]}
                      <div class="loading-wrap-sm"><LoadingSpinner size="sm" /></div>
                    {:else if teamMbrs.length === 0}
                      <p class="empty-state-inline">No members yet. An admin can assign users to this team.</p>
                    {:else}
                      <div class="members-list">
                        {#each teamMbrs as member (member.id)}
                          <div class="member-row">
                            <div class="member-info">
                              <span class="member-email">{member.user_email}</span>
                              <span class="member-since">Member since {formatDate(member.created_at)}</span>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={removingMemberId === member.id}
                              on:click={() => handleRemoveMember(member, team)}
                            >
                              {removingMemberId === member.id ? '...' : 'Remove'}
                            </Button>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </details>
              </div>
            </details>
          </div>
        {/each}
      {/if}

      {#if isAdmin}
        <div class="admin-card">
          <details class="admin-details">
            <summary class="admin-summary">
              <span class="admin-section-title">Team Members</span>
              <svg
                class="admin-chevron"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </summary>
            <div class="admin-section-body">
              <TeamMemberManager />
            </div>
          </details>
        </div>
      {/if}
    {:else}
      <Card padding="lg" shadow="md">
        <div class="section-header">
          <div class="form-header-left">
            <h2 class="section-title">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
            {#if selectedTeam}
              <span class="team-badge">{selectedTeam.name}</span>
            {/if}
          </div>
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
            ></textarea>
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
    max-width: 860px;
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
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .loading-wrap {
    display: flex;
    justify-content: center;
    padding: var(--spacing-2xl) 0;
  }

  .loading-wrap-sm {
    display: flex;
    justify-content: center;
    padding: var(--spacing-md) 0;
  }

  .empty-state {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-2xl) 0;
    font-size: var(--font-size-base);
    margin: 0;
  }

  .empty-state-inline {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    padding: var(--spacing-sm) 0 var(--spacing-xs);
    margin: 0;
  }

  /* Team group */
  .team-group {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 12px);
    overflow: hidden;
  }

  .team-details {
    display: flex;
    flex-direction: column;
  }

  .team-details > summary {
    list-style: none;
  }

  .team-details > summary::-webkit-details-marker {
    display: none;
  }

  .team-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    cursor: pointer;
    transition: background 0.15s ease;
    user-select: none;
  }

  .team-summary:hover {
    background: var(--color-bg-secondary);
  }

  .team-summary-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 0;
    flex: 1;
  }

  .team-summary-action {
    flex-shrink: 0;
  }

  .team-chevron {
    color: var(--color-text-muted);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .team-details[open] > .team-summary .team-chevron {
    transform: rotate(180deg);
  }

  .team-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .event-count {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 0.15rem 0.5rem;
    white-space: nowrap;
  }

  .team-group-body {
    border-top: 1px solid var(--color-border);
    padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  /* Events */
  .events-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .event-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
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
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .event-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  /* Members details */
  .members-details {
    margin-top: var(--spacing-xs);
  }

  .members-details > summary {
    list-style: none;
  }

  .members-details > summary::-webkit-details-marker {
    display: none;
  }

  .members-summary {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    padding: var(--spacing-xs) 0;
    transition: color 0.15s;
    user-select: none;
    width: fit-content;
  }

  .members-summary:hover {
    color: var(--color-text-primary);
  }

  .members-chevron {
    color: currentColor;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .members-details[open] > .members-summary .members-chevron {
    transform: rotate(180deg);
  }

  .member-pill {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    font-size: var(--font-size-xs);
    padding: 0.1rem 0.45rem;
    color: var(--color-text-muted);
  }

  .members-section {
    padding-top: var(--spacing-xs);
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .member-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    gap: var(--spacing-md);
  }

  .member-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .member-email {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .member-since {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  /* Admin section */
  .admin-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 12px);
    overflow: hidden;
  }

  .admin-details {
    display: flex;
    flex-direction: column;
  }

  .admin-details > summary {
    list-style: none;
  }

  .admin-details > summary::-webkit-details-marker {
    display: none;
  }

  .admin-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    cursor: pointer;
    transition: background-color 0.15s ease;
    user-select: none;
  }

  .admin-summary:hover {
    background: var(--color-bg-secondary);
  }

  .admin-section-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .admin-chevron {
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .admin-details[open] > .admin-summary .admin-chevron {
    transform: rotate(180deg);
  }

  .admin-section-body {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }

  /* Form */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .form-header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .section-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
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

    .team-summary {
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .team-summary-action {
      width: 100%;
    }

    .event-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .event-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .member-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
