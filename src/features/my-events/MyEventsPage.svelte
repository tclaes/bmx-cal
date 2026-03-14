<script lang="ts">
  import { onMount } from 'svelte';
  import { selectedEventIds, loadUserSelections, toggleEventSelection, clearAllSelections, selectedCount, selectEventsByType, deselectEventsByType } from '../../shared/stores';
  import { EventsService } from '../../shared/services/events.service';
  import Button from '../../shared/components/Button.svelte';
  import LoadingSpinner from '../../shared/components/LoadingSpinner.svelte';
  import type { EventWithDetails, EventType } from '../../types';

  let events: EventWithDetails[] = [];
  let loading = true;
  let error = '';
  let exporting = false;

  $: sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  $: eventTypes = (() => {
    const map = new Map<string, { type: EventType; ids: string[] }>();
    for (const event of events) {
      if (event.event_type) {
        const key = event.event_type.id;
        if (!map.has(key)) {
          map.set(key, { type: event.event_type, ids: [] });
        }
        map.get(key)!.ids.push(event.id);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.type.name.localeCompare(b.type.name));
  })();

  function isTypeFullySelected(ids: string[]): boolean {
    return ids.length > 0 && ids.every(id => $selectedEventIds.has(id));
  }

  function isTypePartiallySelected(ids: string[]): boolean {
    return ids.some(id => $selectedEventIds.has(id)) && !isTypeFullySelected(ids);
  }

  function handleTypeToggle(ids: string[]) {
    if (isTypeFullySelected(ids)) {
      deselectEventsByType(ids);
    } else {
      selectEventsByType(ids);
    }
  }

  onMount(async () => {
    try {
      events = await EventsService.getAllEvents();
      loadUserSelections();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      loading = false;
    }
  });

  function handleToggle(eventId: string) {
    try {
      toggleEventSelection(eventId);
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update selection';
    }
  }

  function handleClearAll() {
    try {
      clearAllSelections();
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
        text: event.title,
        dates: formatGoogleCalendarDate(event.date, event.end_date),
        details: event.description || '',
        location: event.location?.name || ''
      });

      window.open(`${baseUrl}&${params.toString()}`, '_blank');
    });

    exporting = false;
  }

  function formatGoogleCalendarDate(startDate: string, endDate: string | null | undefined): string {
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

    {#if $selectedCount > 0}
      <div class="header-actions">
        <span class="count">{$selectedCount} selected</span>
        <Button variant="secondary" size="sm" on:click={handleClearAll}>
          Clear All
        </Button>
        <Button on:click={exportToGoogleCalendar} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export to Google Calendar'}
        </Button>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading-container">
      <LoadingSpinner />
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error">{error}</p>
    </div>
  {:else}
    {#if eventTypes.length > 0}
      <div class="type-selector">
        <span class="type-selector-label">Select by type:</span>
        <div class="type-buttons">
          {#each eventTypes as { type, ids } (type.id)}
            {@const fully = isTypeFullySelected(ids)}
            {@const partial = isTypePartiallySelected(ids)}
            <button
              class="type-btn"
              class:fully-selected={fully}
              class:partially-selected={partial}
              style="--type-color: {type.color_code}"
              on:click={() => handleTypeToggle(ids)}
              title="{fully ? 'Deselect' : 'Select'} all {type.name} events ({ids.length})"
            >
              <span class="type-dot"></span>
              <span class="type-name">{type.name}</span>
              <span class="type-count">{ids.length}</span>
              {#if fully}
                <svg class="type-check" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              {:else if partial}
                <svg class="type-check" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="events-list">
      {#each sortedEvents as event (event.id)}
        <button
          class="event-item"
          class:selected={$selectedEventIds.has(event.id)}
          on:click={() => handleToggle(event.id)}
        >
          <div class="checkbox">
            {#if $selectedEventIds.has(event.id)}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="4" fill="currentColor"/>
                <path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            {:else}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <rect width="20" height="20" rx="4" stroke="currentColor" stroke-width="2"/>
              </svg>
            {/if}
          </div>

          {#if event.event_type}
            <span
              class="type-indicator"
              style="background: {event.event_type.color_code}"
              title={event.event_type.name}
            ></span>
          {/if}

          <div class="event-info">
            <span class="event-name">{event.title}</span>
            <span class="event-date">{formatDate(event.date)}</span>
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
    margin-bottom: 1.5rem;
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

  .error-container {
    background: white;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
  }

  .error {
    color: var(--error);
    text-align: center;
    margin: 0;
  }

  .type-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .type-selector-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .type-buttons {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .type-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background: white;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all 0.15s ease;
    line-height: 1;
  }

  .type-btn:hover {
    border-color: var(--type-color);
    color: var(--text-primary);
    background: var(--background-secondary);
  }

  .type-btn.fully-selected {
    border-color: var(--type-color);
    background: color-mix(in srgb, var(--type-color) 12%, white);
    color: var(--text-primary);
  }

  .type-btn.partially-selected {
    border-color: var(--type-color);
    background: color-mix(in srgb, var(--type-color) 6%, white);
    color: var(--text-primary);
  }

  .type-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--type-color);
    flex-shrink: 0;
  }

  .type-name {
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .type-count {
    font-size: 0.72rem;
    color: var(--text-secondary);
    background: var(--background-secondary);
    border-radius: 10px;
    padding: 0 0.3rem;
    line-height: 1.4;
  }

  .type-check {
    color: var(--type-color);
    flex-shrink: 0;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: white;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
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

  .type-indicator {
    width: 3px;
    height: 24px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .event-info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .event-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-date {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
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

    .type-selector {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
