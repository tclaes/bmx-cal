<script lang="ts">
  import { onMount } from 'svelte';
  import { eventsStore } from '../../shared/stores';
  import { selectedEventIds, loadUserSelections, toggleEventSelection, clearAllSelections, selectedCount } from '../../shared/stores';
  import { user } from '../../shared/stores/auth.store';
  import Button from '../../shared/components/Button.svelte';
  import Card from '../../shared/components/Card.svelte';
  import LoadingSpinner from '../../shared/components/LoadingSpinner.svelte';
  import type { EventWithDetails } from '../../types';

  let events: EventWithDetails[] = [];
  let loading = true;
  let error = '';
  let exporting = false;

  $: isLoggedIn = !!$user;
  $: sortedEvents = [...events].sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  onMount(async () => {
    try {
      await eventsStore.loadEvents();
      events = $eventsStore.events;

      if (isLoggedIn) {
        await loadUserSelections();
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      loading = false;
    }
  });

  async function handleToggle(eventId: string) {
    if (!isLoggedIn) {
      error = 'Please log in to select events';
      return;
    }

    try {
      await toggleEventSelection(eventId);
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update selection';
    }
  }

  async function handleClearAll() {
    if (!isLoggedIn) return;

    try {
      await clearAllSelections();
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to clear selections';
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-BE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function exportToGoogleCalendar() {
    if ($selectedCount === 0) {
      error = 'Please select at least one event';
      return;
    }

    exporting = true;
    const selectedEvents = events.filter(e => $selectedEventIds.has(e.id));

    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

    selectedEvents.forEach(event => {
      const params = new URLSearchParams({
        text: event.name,
        dates: formatGoogleCalendarDate(event.start_date, event.end_date),
        details: event.description || '',
        location: event.location?.name || ''
      });

      window.open(`${baseUrl}&${params.toString()}`, '_blank');
    });

    exporting = false;
  }

  function formatGoogleCalendarDate(startDate: string, endDate: string | null): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 3600000);

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    return `${formatDateTime(start)}/${formatDateTime(end)}`;
  }
</script>

<div class="my-events-page">
  <div class="header">
    <div>
      <h1>My Events</h1>
      <p class="subtitle">Select events you want to attend</p>
    </div>

    {#if isLoggedIn && $selectedCount > 0}
      <div class="header-actions">
        <span class="count">{$selectedCount} selected</span>
        <Button variant="secondary" size="small" on:click={handleClearAll}>
          Clear All
        </Button>
        <Button on:click={exportToGoogleCalendar} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export to Google Calendar'}
        </Button>
      </div>
    {/if}
  </div>

  {#if !isLoggedIn}
    <Card>
      <p class="login-notice">Please log in to select and export events to your calendar.</p>
    </Card>
  {:else if loading}
    <div class="loading-container">
      <LoadingSpinner />
    </div>
  {:else if error}
    <Card>
      <p class="error">{error}</p>
    </Card>
  {:else}
    <div class="events-list">
      {#each sortedEvents as event (event.id)}
        <button
          class="event-item"
          class:selected={$selectedEventIds.has(event.id)}
          on:click={() => handleToggle(event.id)}
        >
          <div class="checkbox">
            {#if $selectedEventIds.has(event.id)}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="4" fill="currentColor"/>
                <path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {:else}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="4" stroke="currentColor" stroke-width="2"/>
              </svg>
            {/if}
          </div>

          <div class="event-info">
            <h3 class="event-name">{event.name}</h3>
            <p class="event-date">{formatDate(event.start_date)}</p>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .my-events-page {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }

  .subtitle {
    color: var(--text-secondary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .count {
    font-weight: 600;
    color: var(--text-primary);
    padding: 0.5rem 1rem;
    background: var(--background-secondary);
    border-radius: 8px;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: 4rem 0;
  }

  .login-notice {
    text-align: center;
    color: var(--text-secondary);
    margin: 0;
    padding: 1rem 0;
  }

  .error {
    color: var(--error);
    text-align: center;
    margin: 0;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    width: 100%;
  }

  .event-item:hover {
    border-color: var(--primary);
    background: var(--background-secondary);
  }

  .event-item.selected {
    border-color: var(--primary);
    background: var(--primary-light, #f0f7ff);
  }

  .checkbox {
    flex-shrink: 0;
    color: var(--border-color);
    transition: color 0.2s ease;
  }

  .event-item:hover .checkbox {
    color: var(--primary);
  }

  .event-item.selected .checkbox {
    color: var(--primary);
  }

  .event-info {
    flex: 1;
    min-width: 0;
  }

  .event-name {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--text-primary);
  }

  .event-date {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  @media (max-width: 640px) {
    .header {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    .count {
      order: -1;
      width: 100%;
      text-align: center;
    }
  }
</style>
