<script lang="ts">
  import { onMount } from 'svelte';
  import EventCard from './EventCard.svelte';
  import EventEditor from './EventEditor.svelte';
  import { LoadingSpinner, Alert } from '@shared/components';
  import { eventsStore, filtersStore } from '@shared/stores';
  import { EventsService } from '@shared/services';
  import type { EventWithType, Event } from '@types';

  let filteredEvents: EventWithType[] = [];
  let editingEvent: Event | null = null;
  let showEditor = false;

  $: {
    const filters = $filtersStore;
    const events = $eventsStore.events;

    filteredEvents = events.filter(event => {
      if (filters.selectedEventType && event.event_type_id !== filters.selectedEventType) {
        return false;
      }

      if (filters.startDate && event.date < filters.startDate) {
        return false;
      }

      if (filters.endDate && event.date > filters.endDate) {
        return false;
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          event.title.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }

  function handleEdit(event: CustomEvent<EventWithType>) {
    console.log('Edit event received:', event.detail);
    editingEvent = event.detail;
    showEditor = true;
    console.log('Editor opened:', { editingEvent, showEditor });
  }

  async function handleSaved() {
    try {
      eventsStore.setLoading(true);
      const events = await EventsService.getUpcomingEvents();
      eventsStore.setEvents(events);
    } catch (error) {
      eventsStore.setError(error instanceof Error ? error.message : 'Failed to reload events');
    } finally {
      eventsStore.setLoading(false);
    }
  }

  function handleClose() {
    showEditor = false;
    editingEvent = null;
  }

  onMount(async () => {
    try {
      eventsStore.setLoading(true);
      const [events, eventTypes] = await Promise.all([
        EventsService.getUpcomingEvents(),
        EventsService.getEventTypes(),
      ]);
      eventsStore.setEvents(events);
      eventsStore.setEventTypes(eventTypes);
    } catch (error) {
      eventsStore.setError(error instanceof Error ? error.message : 'Failed to load events');
    } finally {
      eventsStore.setLoading(false);
    }
  });
</script>

<div class="event-list">
  {#if $eventsStore.loading}
    <div class="loading-container">
      <LoadingSpinner size="lg" />
    </div>
  {:else if $eventsStore.error}
    <Alert type="danger" message={$eventsStore.error} />
  {:else if filteredEvents.length === 0}
    <div class="empty-state">
      <h3>No events found</h3>
      <p>There are no upcoming events matching your criteria.</p>
    </div>
  {:else}
    <div class="events-grid">
      {#each filteredEvents as event (event.id)}
        <EventCard {event} on:edit={handleEdit} />
      {/each}
    </div>
  {/if}
</div>

<EventEditor
  event={editingEvent}
  eventTypes={$eventsStore.eventTypes}
  bind:open={showEditor}
  on:saved={handleSaved}
  on:close={handleClose}
/>

<style>
  .event-list {
    width: 100%;
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .empty-state {
    text-align: center;
    padding: var(--spacing-2xl);
    color: var(--color-text-secondary);
  }

  .empty-state h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
  }

  .empty-state p {
    font-size: var(--font-size-base);
  }

  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--spacing-lg);
  }

  @media (max-width: 768px) {
    .events-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
