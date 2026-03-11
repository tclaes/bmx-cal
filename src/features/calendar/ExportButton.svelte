<script lang="ts">
  import { eventsStore } from '@shared/stores';
  import { filtersStore } from '@shared/stores/filters.store';
  import { generateICalContent, downloadICalFile } from '@shared/utils';
  import Button from '@shared/components/Button.svelte';
  import type { EventWithType } from '@types';

  let showMenu = false;

  $: filteredEvents = getFilteredEvents($eventsStore.events, $filtersStore);

  function getFilteredEvents(events: EventWithType[], filters: any): EventWithType[] {
    return events.filter(event => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filters.eventType && event.event_type_id !== filters.eventType) {
        return false;
      }

      if (filters.status && event.status !== filters.status) {
        return false;
      }

      return true;
    });
  }

  function handleExportClick() {
    showMenu = !showMenu;
  }

  function handleDownloadICal() {
    const content = generateICalContent(filteredEvents);
    downloadICalFile(content, 'bmx-events.ics');
    showMenu = false;
  }

  function handleAddToGoogleCalendar() {
    const content = generateICalContent(filteredEvents);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bmx-events.ics';
    link.click();
    URL.revokeObjectURL(url);
    showMenu = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown')) {
      showMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="export-dropdown">
  <Button variant="outline" on:click={handleExportClick}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M11.333 5.333L8 2m0 0L4.667 5.333M8 2v8"/>
    </svg>
    Export Calendar
  </Button>

  {#if showMenu}
    <div class="dropdown-menu">
      <button class="dropdown-item" on:click={handleDownloadICal}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M8 10.667V2M8 10.667l-3.333-3.334M8 10.667l3.333-3.334"/>
        </svg>
        Download .ics file
      </button>
      <button class="dropdown-item" on:click={handleAddToGoogleCalendar}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM6.4 11.733V9.6H4.267v2.133H6.4zm0-3.2V6.4H4.267v2.133H6.4zm0-3.2V3.2H4.267v2.133H6.4zm2.133 6.4V9.6H6.4v2.133h2.133zm0-3.2V6.4H6.4v2.133h2.133zm0-3.2V3.2H6.4v2.133h2.133zm3.2 6.4V9.6H8.533v2.133h3.2zm0-3.2V6.4H8.533v2.133h3.2zm0-3.2V3.2H8.533v2.133h3.2z"/>
        </svg>
        Import to Google Calendar
      </button>
    </div>
  {/if}
</div>

<style>
  .export-dropdown {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + var(--spacing-xs));
    right: 0;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    min-width: 220px;
    z-index: 50;
    overflow: hidden;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background-color: var(--color-bg-secondary);
  }

  .dropdown-item svg {
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .dropdown-menu {
      right: auto;
      left: 0;
    }
  }
</style>
