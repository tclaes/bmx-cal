<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button, LoadingSpinner, Alert } from '@shared/components';
  import { authStore } from '@shared/stores';
  import { EventsService } from '@shared/services';
  import { groupEventsByYear, getDefaultOpenYears } from '@shared/utils';
  import type { EventWithType } from '@types';
  import DocumentUpload from './DocumentUpload.svelte';
  import TeamMemberManager from './TeamMemberManager.svelte';

  let events: EventWithType[] = [];
  let loading = false;
  let error = '';
  let deleteError = '';
  let deleteSuccess = '';
  let deletingEventId: string | null = null;
  let openYears: Set<number> = new Set();

  const currentYear = new Date().getFullYear();

  function toggleYear(year: number) {
    if (openYears.has(year)) {
      openYears.delete(year);
    } else {
      openYears.add(year);
    }
    openYears = new Set(openYears);
  }

  $: eventsByYear = groupEventsByYear(events);

  async function loadEvents() {
    loading = true;
    error = '';
    try {
      events = await EventsService.getUpcomingEvents();
      openYears = getDefaultOpenYears(groupEventsByYear(events), currentYear);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load events';
    } finally {
      loading = false;
    }
  }

  async function handleDeleteEvent(eventId: string, eventTitle: string) {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    deleteError = '';
    deleteSuccess = '';
    deletingEventId = eventId;

    try {
      await EventsService.deleteEvent(eventId);
      deleteSuccess = `Event "${eventTitle}" has been deleted successfully.`;
      await loadEvents();
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Failed to delete event';
    } finally {
      deletingEventId = null;
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onMount(() => {
    loadEvents();
  });
</script>

<div class="admin-dashboard">
  <div class="dashboard-header">
    <div class="header-content">
      <h1 class="dashboard-title">Admin Dashboard</h1>
      {#if $authStore.user}
        <p class="user-info">Logged in as {$authStore.user.email}</p>
      {/if}
    </div>
  </div>

  <div class="dashboard-content">
    <Card padding="lg" shadow="md">
      <DocumentUpload />
    </Card>

    <Card padding="lg" shadow="md">
      <TeamMemberManager />
    </Card>

    <Card padding="lg" shadow="md">
      <div class="events-section">
        <h2 class="section-title">Event Management</h2>

        {#if deleteSuccess}
          <Alert type="success" message={deleteSuccess} />
        {/if}

        {#if deleteError}
          <Alert type="error" message={deleteError} />
        {/if}

        {#if loading}
          <div class="loading-container">
            <LoadingSpinner size="lg" />
          </div>
        {:else if error}
          <Alert type="error" message={error} />
        {:else if events.length === 0}
          <p class="no-events">No upcoming events found.</p>
        {:else}
          <div class="years-list">
            {#each [...eventsByYear.entries()] as [year, yearEvents] (year)}
              <div class="year-group">
                <button
                  class="year-toggle"
                  on:click={() => toggleYear(year)}
                  aria-expanded={openYears.has(year)}
                >
                  <span class="year-label">{year}</span>
                  <span class="year-count">{yearEvents.length} event{yearEvents.length !== 1 ? 's' : ''}</span>
                  <svg
                    class="year-chevron"
                    class:open={openYears.has(year)}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>

                {#if openYears.has(year)}
                  <div class="events-list">
                    {#each yearEvents as event (event.id)}
                      <div class="event-item">
                        <div class="event-info">
                          <div class="event-header">
                            <h3 class="event-title">{event.title}</h3>
                            {#if event.event_type}
                              <span
                                class="event-badge"
                                style="background-color: {event.event_type.color_code}20; color: {event.event_type.color_code}; border-color: {event.event_type.color_code}40;"
                              >
                                {event.event_type.name}
                              </span>
                            {/if}
                          </div>
                          <div class="event-details">
                            <span class="event-date">{formatDate(event.date)}</span>
                            <span class="event-location">{event.location}</span>
                          </div>
                          {#if event.description}
                            <p class="event-description">{event.description}</p>
                          {/if}
                        </div>
                        <div class="event-actions">
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deletingEventId === event.id}
                            on:click={() => handleDeleteEvent(event.id, event.title)}
                          >
                            {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </Card>
  </div>
</div>

<style>
  .admin-dashboard {
    min-height: 100vh;
    padding: var(--spacing-xl) var(--spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .dashboard-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .user-info {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .events-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .section-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: var(--spacing-xl);
  }

  .no-events {
    text-align: center;
    color: var(--color-text-secondary);
    padding: var(--spacing-xl);
    margin: 0;
  }

  .years-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .year-group {
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    overflow: hidden;
  }

  .year-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--color-surface-secondary, #f8f9fa);
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
  }

  .year-toggle:hover {
    background: var(--color-surface-hover, #f0f1f2);
  }

  .year-label {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    flex: 1;
  }

  .year-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .year-chevron {
    color: var(--color-text-secondary);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  .year-chevron.open {
    transform: rotate(180deg);
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .event-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    transition: border-color 0.2s ease;
  }

  .event-item:hover {
    border-color: var(--color-border-hover);
  }

  .event-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .event-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .event-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .event-badge {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    border: 1px solid;
  }

  .event-details {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .event-date,
  .event-location {
    display: flex;
    align-items: center;
  }

  .event-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.5;
  }

  .event-actions {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .dashboard-title {
      font-size: var(--font-size-3xl);
    }

    .event-item {
      flex-direction: column;
    }

    .event-actions {
      width: 100%;
    }

    .event-actions :global(button) {
      width: 100%;
    }
  }
</style>
