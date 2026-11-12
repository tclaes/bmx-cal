<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CalendarService } from '@core/services';
  import type { SavedCalendar } from '@core/services';
  import Button from '@ui/Button.svelte';
  import { formatDate } from '@shared/utils';

  export let refreshTrigger = 0;

  const dispatch = createEventDispatcher<{ load: string[] }>();

  let calendars: SavedCalendar[] = [];
  let loading = true;
  let deletingId: string | null = null;

  $: if (refreshTrigger >= 0) loadCalendars();

  async function loadCalendars() {
    loading = true;
    try {
      calendars = await CalendarService.getUserCalendars();
    } catch {
      calendars = [];
    } finally {
      loading = false;
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved calendar?')) return;
    deletingId = id;
    try {
      await CalendarService.deleteCalendar(id);
      calendars = calendars.filter(c => c.id !== id);
    } finally {
      deletingId = null;
    }
  }

  async function handleLoad(id: string) {
    const eventIds = await CalendarService.getCalendarEventIds(id);
    dispatch('load', eventIds);
  }
</script>

{#if !loading && calendars.length > 0}
<div class="saved-list">
  <h3 class="section-title">Saved calendars</h3>

  <ul class="list">
    {#each calendars as cal (cal.id)}
      <li class="item">
        <div class="item-info">
          <span class="item-name">{cal.name}</span>
          <span class="item-meta">
            {cal.event_count ?? 0} event{(cal.event_count ?? 0) === 1 ? '' : 's'}
            &middot;
            saved {formatDate(cal.created_at)}
          </span>
        </div>
        <div class="item-actions">
          <Button variant="secondary" size="sm" on:click={() => handleLoad(cal.id)}>
            Load
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={deletingId === cal.id}
            on:click={() => handleDelete(cal.id)}
          >
            {deletingId === cal.id ? '...' : 'Delete'}
          </Button>
        </div>
      </li>
    {/each}
  </ul>
</div>
{/if}

<style>
  .saved-list {
    margin-block-end: var(--spacing-xl);
    border-block-end: 1px solid var(--color-border);
    padding-block-end: var(--spacing-lg);
  }

  .section-title {
    margin: 0 0 var(--spacing-md);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: var(--color-bg-secondary);
    transition: border-color var(--transition-base);
  }

  .item:hover {
    border-color: var(--color-primary);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
    min-inline-size: 0;
  }

  .item-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .item-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-shrink: 0;
  }
</style>
