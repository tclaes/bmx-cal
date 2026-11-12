<script lang="ts">
  import { onMount } from 'svelte';
  import { toUserMessage } from '@shared/utils';
  import { LoadingSpinner, Alert, RaceRow, Button } from '@ui';
  import { eventsStore, filtersStore, authStore, selectedEventIds, loadUserSelections, toggleEventSelection } from '@core/stores';
  import { EventsService } from '@core/services';
  import { t, interpolate } from '../../i18n';
  import { navigate } from '../../router';
  import CalendarHero from './CalendarHero.svelte';
  import { calendarSplit } from './visible-events';
  import { getRaceView } from '@shared/utils';

  $: ({ hero, rest } = $calendarSplit);
  $: total = rest.length;
  $: countLabel = total === 1 ? $t.calendar.raceCountOne : interpolate($t.calendar.raceCount, { count: total });

  let previousUserId: string | null | undefined = undefined;

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
      loadAll('Failed to reload events');
      loadUserSelections();
    }
    previousUserId = currentUserId;
  }

  function open(e: MouseEvent, href: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
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
  {:else if !hero && rest.length === 0}
    <div class="empty-state">
      <h3>{$t.calendar.noEventsTitle}</h3>
      <p>{$t.calendar.noEventsDescription}</p>
      <Button variant="secondary" on:click={() => filtersStore.reset()}>{$t.filters.resetFilters}</Button>
    </div>
  {:else}
    {#if hero}
      <CalendarHero
        event={hero}
        saved={$selectedEventIds.has(hero.id)}
        on:save={() => hero && toggleEventSelection(hero.id)}
        on:navigate={(e) => navigate(e.detail)}
      />
    {/if}

    {#if rest.length > 0}
      <div class="list-head">
        <h2 class="list-title">{hero ? $t.calendar.thenHeading : ''}</h2>
        <span class="count">{countLabel}</span>
      </div>

      <div class="timeline">
        {#each rest as event (event.id)}
          {@const view = getRaceView(event, $t)}
          <RaceRow
            title={event.title}
            href={view.href}
            day={view.day}
            month={view.month}
            meta={view.meta}
            type={event.event_type?.name}
            status={view.status}
            registrationUrl={event.registration_url}
            registerLabel={$t.calendar.registerAction}
            opensLabel={view.opensLabel}
            deadlineLabel={view.deadlineLabel}
            saved={$selectedEventIds.has(event.id)}
            saveLabel={$selectedEventIds.has(event.id) ? $t.calendar.saved : $t.calendar.save}
            livestreamUrl={view.ongoing ? event.livestream_url : null}
            livestreamLabel={$t.calendar.livestream}
            on:click={(e) => open(e, view.href)}
            on:save={() => toggleEventSelection(event.id)}
          />
        {/each}
      </div>
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

  .count {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
</style>
