<script lang="ts">
  import { eventsStore } from '@shared/stores';
  import { filtersStore } from '@shared/stores/filters.store';
  import { generateICalContent, downloadICalFile } from '@shared/utils';
  import Button from '@shared/components/Button.svelte';
  import type { EventWithDetails } from '@types';

  $: filteredEvents = getFilteredEvents($eventsStore.events, $filtersStore);

  function getFilteredEvents(events: EventWithDetails[], filters: any): EventWithDetails[] {
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
    const content = generateICalContent(filteredEvents);
    downloadICalFile(content, 'bmx-events.ics');
  }
</script>

<Button variant="outline" on:click={handleExportClick}>
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M11.333 5.333L8 2m0 0L4.667 5.333M8 2v8"/>
  </svg>
  Export Calendar
</Button>

