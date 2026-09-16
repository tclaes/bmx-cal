<script lang="ts">
  import { onMount } from 'svelte';
  import { selectedEventIds, loadUserSelections, toggleEventSelection, clearAllSelections, selectedCount, selectEventsByType, deselectEventsByType } from '../../shared/stores';
  import { EventsService } from '../../shared/services/events.service';
  import { generateICalContent, downloadICalFile } from '../../shared/utils/ical-exporter';
  import Button from '../../shared/components/Button.svelte';
  import LoadingSpinner from '../../shared/components/LoadingSpinner.svelte';
  import { authStore } from '../../shared/stores/auth.store';
  import SaveCalendarModal from './SaveCalendarModal.svelte';
  import SavedCalendarsList from './SavedCalendarsList.svelte';
  import type { EventWithDetails, EventType } from '../../types';
  import { t, locale, interpolate } from '../../i18n';

  let events: EventWithDetails[] = [];
  let loading = true;
  let error = '';
  let exporting = false;
  let showSaveModal = false;
  let savedCalendarsRefresh = 0;

  $: isLoggedIn = !!$authStore.user;

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

  function isTypeFullySelected(ids: string[], selected: Set<string>): boolean {
    return ids.length > 0 && ids.every(id => selected.has(id));
  }

  function isTypePartiallySelected(ids: string[], selected: Set<string>): boolean {
    return ids.some(id => selected.has(id)) && !isTypeFullySelected(ids, selected);
  }

  async function handleTypeToggle(ids: string[]) {
    if (isTypeFullySelected(ids, $selectedEventIds)) {
      await deselectEventsByType(ids);
    } else {
      await selectEventsByType(ids);
    }
  }

  onMount(async () => {
    try {
      events = await EventsService.getAllEvents();
      await loadUserSelections();
    } catch (e) {
      error = e instanceof Error ? e.message : $t.myEvents.failedToLoad;
    } finally {
      loading = false;
    }
  });

  async function handleToggle(eventId: string) {
    try {
      await toggleEventSelection(eventId);
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to update selection';
    }
  }

  async function handleClearAll() {
    try {
      await clearAllSelections();
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to clear selections';
    }
  }

  const localeMap: Record<string, string> = { en: 'en-US', nl: 'nl-BE', fr: 'fr-BE' };

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(localeMap[$locale] ?? 'nl-BE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function handleSaveCalendar() {
    if ($selectedCount === 0) {
      error = $t.myEvents.selectAtLeastOneSave;
      return;
    }
    showSaveModal = true;
  }

  async function handleLoadCalendar(eventIds: string[]) {
    await clearAllSelections();
    for (const id of eventIds) {
      await toggleEventSelection(id);
    }
  }

  function exportToCalendar() {
    if ($selectedCount === 0) {
      error = $t.myEvents.selectAtLeastOne;
      return;
    }

    exporting = true;
    try {
      const selectedEvents = events
        .filter(e => $selectedEventIds.has(e.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const content = generateICalContent(selectedEvents);
      downloadICalFile(content, 'bmx-events.ics');
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : $t.myEvents.exportFailed;
    } finally {
      exporting = false;
    }
  }
</script>

<div class="my-events-page">
  <div class="header">
    <div>
      <h1>{$t.myEvents.title}</h1>
      <p class="subtitle">{$t.myEvents.subtitle}</p>
    </div>

    {#if $selectedCount > 0}
      <div class="header-actions">
        <span class="count">{interpolate($t.myEvents.selected, { count: $selectedCount })}</span>
        <Button variant="secondary" size="sm" on:click={handleClearAll}>
          {$t.myEvents.clearAll}
        </Button>
        {#if isLoggedIn}
          <Button variant="secondary" on:click={handleSaveCalendar}>
            {$t.myEvents.saveCalendar}
          </Button>
        {/if}
        <Button on:click={exportToCalendar} disabled={exporting}>
          {exporting ? $t.myEvents.exporting : $t.myEvents.exportToCalendar}
        </Button>
      </div>
    {/if}
  </div>

  {#if isLoggedIn}
    <SavedCalendarsList
      refreshTrigger={savedCalendarsRefresh}
      on:load={(e) => handleLoadCalendar(e.detail)}
    />
  {/if}

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
        <span class="type-selector-label">{$t.myEvents.selectByType}</span>
        <div class="type-buttons">
          {#each eventTypes as { type, ids } (type.id)}
            {@const fully = isTypeFullySelected(ids, $selectedEventIds)}
            {@const partial = isTypePartiallySelected(ids, $selectedEventIds)}
            <button
              class="type-btn"
              class:fully-selected={fully}
              class:partially-selected={partial}
              style="--type-color: {type.color_code}"
              on:click={() => handleTypeToggle(ids)}
              title="{fully ? $t.myEvents.deselectAll : $t.myEvents.selectAll} all {type.name} {$t.myEvents.events} ({ids.length})"
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
            <div class="event-meta">
              <span class="event-date">{formatDate(event.date)}</span>
              {#if event.location_details?.city}
                <span class="event-city">{event.location_details.city}</span>
              {/if}
            </div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<SaveCalendarModal
  open={showSaveModal}
  selectedEventIds={Array.from($selectedEventIds)}
  on:saved={() => { showSaveModal = false; savedCalendarsRefresh += 1; }}
  on:close={() => { showSaveModal = false; }}
/>

<style>
  .my-events-page {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-lg);
    flex-wrap: wrap;
  }

  h1 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
  }

  .subtitle {
    color: var(--color-text-secondary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
    flex-wrap: wrap;
  }

  .count {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius-md);
  }

  .loading-container {
    display: flex;
    justify-content: center;
    padding: var(--spacing-3xl) 0;
  }

  .error-container {
    background: var(--color-bg-primary);
    border: 2px solid var(--color-danger);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
  }

  .error {
    color: var(--color-danger);
    text-align: center;
    margin: 0;
  }

  .type-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm-plus);
    margin-bottom: var(--spacing-md);
    flex-wrap: wrap;
  }

  .type-selector-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .type-buttons {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }

  .type-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm-plus);
    padding: 0.6rem 0.9rem;
    min-height: 44px;
    border: 1px solid var(--color-border);
    border-radius: 22px;
    background: var(--color-bg-primary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
    line-height: 1;
  }

  .type-btn:hover {
    border-color: var(--type-color);
    color: var(--color-text-primary);
    background: var(--color-bg-secondary);
  }

  .type-btn.fully-selected {
    border-color: var(--type-color);
    background: color-mix(in srgb, var(--type-color) 85%, white);
    color: white;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
    padding: 0.65rem 1rem;
  }

  .type-btn.partially-selected {
    border-color: var(--type-color);
    background: color-mix(in srgb, var(--type-color) 6%, white);
    color: var(--color-text-primary);
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
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    background: var(--color-bg-secondary);
    border-radius: 10px;
    padding: 0 0.3rem;
    line-height: 1.4;
  }

  .type-btn.fully-selected .type-count {
    color: white;
    background: rgba(255, 255, 255, 0.25);
  }

  .type-check {
    color: var(--type-color);
    flex-shrink: 0;
  }

  .type-btn.fully-selected .type-check {
    color: white;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm-plus);
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    width: 100%;
  }

  .event-item:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-secondary);
  }

  .event-item.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .checkbox {
    flex-shrink: 0;
    color: var(--color-border);
    transition: color var(--transition-base);
  }

  .event-item:hover .checkbox {
    color: var(--color-primary);
  }

  .event-item.selected .checkbox {
    color: var(--color-primary);
  }

  .type-indicator {
    width: 3px;
    height: 24px;
    border-radius: var(--spacing-xxs);
    flex-shrink: 0;
  }

  .event-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .event-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .event-date {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .event-city {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .event-city::before {
    content: '•';
    margin-right: var(--spacing-sm);
    color: var(--color-border);
  }

  @media (max-width: 640px) {
    .header {
      flex-direction: column;
      gap: var(--spacing-md);
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
