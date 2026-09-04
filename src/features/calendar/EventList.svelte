<script lang="ts">
  import { onMount } from 'svelte';
  import { toUserMessage } from '@shared/utils/error-message';
  import EventCard from './EventCard.svelte';
  import EventEditor from './EventEditor.svelte';
  import { LoadingSpinner, Alert } from '@shared/components';
  import { eventsStore, filtersStore, authStore } from '@shared/stores';
  import { EventsService } from '@shared/services';
  import { canEditEvent } from '@shared/utils/permissions';
  import { searchEvents } from '@shared/utils/event-search';
  import type { EventWithDetails, Event } from '@types';
  import { t } from '../../i18n';

  let filteredEvents: EventWithDetails[] = [];
  let editingEvent: Event | null = null;
  let showEditor = false;

  $: {
    const filters = $filtersStore;
    const events = $eventsStore.events;
    const today = new Date().toISOString().split('T')[0];

    let result = events;

    if (!filters.showPastEvents) {
      result = result.filter(event => {
        const eventEnd = event.end_date || event.date;
        return eventEnd >= today;
      });
    }

    if (filters.selectedEventTypes.length > 0) {
      result = result.filter(event =>
        filters.selectedEventTypes.includes(event.event_type_id)
      );
    }

    if (filters.startDate) {
      result = result.filter(event => event.date >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter(event => event.date <= filters.endDate!);
    }

    if (filters.searchQuery) {
      result = searchEvents(result, filters.searchQuery);
    }

    filteredEvents = result;
  }

  let previousUserId: string | null | undefined = undefined;

  $: {
    const currentUserId = $authStore.user?.id ?? null;
    if (previousUserId !== undefined && previousUserId !== currentUserId) {
      (async () => {
        try {
          eventsStore.setLoading(true);
          const [events, eventTypes, locations] = await Promise.all([
            EventsService.getAllEvents(),
            EventsService.getEventTypes(),
            EventsService.getLocations(),
          ]);
          eventsStore.setEvents(events);
          eventsStore.setEventTypes(eventTypes);
          eventsStore.setLocations(locations);
        } catch (error) {
          eventsStore.setError(toUserMessage(error, 'Failed to reload events'));
        } finally {
          eventsStore.setLoading(false);
        }
      })();
    }
    previousUserId = currentUserId;
  }

  function handleEdit(event: CustomEvent<EventWithDetails>) {
    console.log('Edit event received:', event.detail);
    editingEvent = event.detail;
    showEditor = true;
    console.log('Editor opened:', { editingEvent, showEditor });
  }

  async function handleSaved() {
    try {
      eventsStore.setLoading(true);
      const events = await EventsService.getAllEvents();
      eventsStore.setEvents(events);
    } catch (error) {
      eventsStore.setError(toUserMessage(error, 'Failed to reload events'));
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
      const [events, eventTypes, locations] = await Promise.all([
        EventsService.getAllEvents(),
        EventsService.getEventTypes(),
        EventsService.getLocations(),
      ]);
      eventsStore.setEvents(events);
      eventsStore.setEventTypes(eventTypes);
      eventsStore.setLocations(locations);
    } catch (error) {
      eventsStore.setError(toUserMessage(error, 'Failed to load events'));
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
      <h3>{$t.calendar.noEventsTitle}</h3>
      <p>{$t.calendar.noEventsDescription}</p>
    </div>
  {:else}
    <div class="events-grid">
      {#each filteredEvents as event (event.id)}
        <EventCard {event} canEdit={canEditEvent(event, $authStore.user)} on:edit={handleEdit} />
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
