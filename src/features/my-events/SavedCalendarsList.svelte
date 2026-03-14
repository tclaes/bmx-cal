<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CalendarService } from '../../shared/services/calendar.service';
  import type { SavedCalendar } from '../../shared/services/calendar.service';
  import Button from '../../shared/components/Button.svelte';

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

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
    margin-bottom: 2rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    padding-bottom: 1.5rem;
  }

  .section-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-secondary, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1rem 0;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    background: white;
    transition: border-color 0.15s ease;
  }

  .item:hover {
    border-color: var(--color-primary, #2563eb);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .item-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-meta {
    font-size: 0.78rem;
    color: var(--color-text-secondary, #6b7280);
  }

  .item-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
</style>
