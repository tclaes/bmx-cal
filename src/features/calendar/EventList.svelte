<script lang="ts">
  import { onMount } from 'svelte';
  import { toUserMessage } from '@shared/utils';
  import { LoadingSpinner, Alert, Button } from '@ui';
  import { eventsStore, filtersStore, authStore, selectedEventIds, loadUserSelections, toggleEventSelection } from '@core/stores';
  import { EventsService } from '@core/services';
  import { t, interpolate } from '../../i18n';
  import { navigate } from '../../router';
  import CalendarHero from './CalendarHero.svelte';
  import CalendarRaceRow from './CalendarRaceRow.svelte';
  import { calendarSplit } from './visible-events';

  $: ({ hero, upcoming, pastByYear } = $calendarSplit);
  $: isEmpty = !hero && upcoming.length === 0 && pastByYear.length === 0;

  // Reactive so every count re-renders when the language changes.
  $: countLabel = (count: number): string =>
    count === 1 ? $t.calendar.raceCountOne : interpolate($t.calendar.raceCount, { count });

  let previousUserId: string | null | undefined = undefined;
  // A save the account rejects is shown above the list; the list itself stays visible.
  let saveError = '';

  // The message belongs to the race whose save failed: only a later successful save of that
  // same race clears it, so saving another race never hides a failure that still stands.
  let failedEventId: string | null = null;

  // A result only counts for the account the save started for: after a sign-in or sign-out
  // the message is reset, and a late result from the previous account is ignored.
  // Each race remembers its latest save: an older save of the same race that finishes late
  // (possible after the store's queue timeout) never overrides the newer one's result.
  const latestSave = new Map<string, number>();
  let saveCounter = 0;

  async function save(eventId: string) {
    const attempt = ++saveCounter;
    latestSave.set(eventId, attempt);
    const owner = $authStore.user?.id ?? null;
    const counts = () => owner === ($authStore.user?.id ?? null) && latestSave.get(eventId) === attempt;
    try {
      await toggleEventSelection(eventId);
      if (counts() && eventId === failedEventId) {
        saveError = '';
        failedEventId = null;
      }
    } catch {
      if (!counts()) return;
      saveError = $t.calendar.selectionUpdateFailed;
      failedEventId = eventId;
    }
  }

  async function loadAll(failMessage: string) {
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
      eventsStore.setError(toUserMessage(error, failMessage));
    } finally {
      eventsStore.setLoading(false);
    }
  }

  $: {
    const currentUserId = $authStore.user?.id ?? null;
    if (previousUserId !== undefined && previousUserId !== currentUserId) {
      saveError = '';
      failedEventId = null;
      loadAll('Failed to reload events');
      loadUserSelections();
    }
    previousUserId = currentUserId;
  }

  onMount(() => {
    loadUserSelections();
    loadAll('Failed to load events');
  });
</script>

<div class="event-list">
  {#if $eventsStore.loading}
    <div class="loading-container">
      <LoadingSpinner size="lg" />
    </div>
  {:else if $eventsStore.error}
    <Alert type="danger" message={$eventsStore.error} />
  {:else if isEmpty}
    <div class="empty-state">
      <h3>{$t.calendar.noEventsTitle}</h3>
      <p>{$t.calendar.noEventsDescription}</p>
      <Button variant="secondary" on:click={() => filtersStore.reset()}>{$t.filters.resetFilters}</Button>
    </div>
  {:else}
    {#if saveError}
      <Alert type="danger" message={saveError} />
    {/if}
    {#if hero}
      <CalendarHero
        event={hero}
        saved={$selectedEventIds.has(hero.id)}
        on:save={() => hero && save(hero.id)}
        on:navigate={(e) => navigate(e.detail)}
      />
    {/if}

    {#if upcoming.length > 0}
      <div class="list-head">
        <h2 class="list-title">{$t.calendar.thenHeading}</h2>
        <span class="count">{countLabel(upcoming.length)}</span>
      </div>

      <div class="timeline">
        {#each upcoming as event (event.id)}
          <CalendarRaceRow
            {event}
            saved={$selectedEventIds.has(event.id)}
            on:navigate={(e) => navigate(e.detail)}
            on:save={() => save(event.id)}
          />
        {/each}
      </div>
    {/if}

    {#if pastByYear.length > 0}
      <section class="previous" aria-labelledby="previous-races-heading">
        <h2 class="list-title previous-title" id="previous-races-heading">{$t.calendar.previousHeading}</h2>
        {#each pastByYear as group (group.year)}
          <div class="list-head">
            <h3 class="list-title">{group.year}</h3>
            <span class="count">{countLabel(group.events.length)}</span>
          </div>
          <div class="timeline">
            {#each group.events as event (event.id)}
              <CalendarRaceRow
                {event}
                headingLevel={4}
                saved={$selectedEventIds.has(event.id)}
                on:navigate={(e) => navigate(e.detail)}
                on:save={() => save(event.id)}
              />
            {/each}
          </div>
        {/each}
      </section>
    {/if}
  {/if}
</div>

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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    text-align: center;
    padding: var(--spacing-2xl);
    color: var(--color-text-secondary);
  }

  .empty-state h3 {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    color: var(--color-text-primary);
  }

  .empty-state p { margin: 0 0 var(--spacing-sm); }

  .list-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-block: var(--spacing-xl) var(--spacing-sm);
  }

  .list-title {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .previous {
    margin-block-start: var(--spacing-2xl);
  }

  .previous-title {
    color: var(--color-text-primary);
  }

  .count {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
</style>
