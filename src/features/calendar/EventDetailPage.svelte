<script lang="ts">
  import { onMount } from 'svelte';
  import { TypeLabel, StartLight, LoadingSpinner, Alert, Button } from '@ui';
  import { eventsStore, authStore, selectedEventIds, loadUserSelections, toggleEventSelection } from '@core/stores';
  import { EventsService } from '@core/services';
  import { canEditEvent, toUserMessage, formatDate, formatLongDate } from '@shared/utils';
  import type { EventWithDetails } from '@types';
  import { routeParams, navigate } from '../../router';
  import { t } from '../../i18n';
  import EventEditor from './EventEditor.svelte';
  import { getRaceView } from './race-view';

  let event: EventWithDetails | null = null;
  let loading = true;
  let error = '';
  let editing = false;
  let requestedId = '';

  $: id = $routeParams.id as string | undefined;
  $: if (id && id !== requestedId) {
    requestedId = id;
    load(id);
  }

  async function load(eventId: string) {
    error = '';
    const cached = $eventsStore.events.find(e => e.id === eventId);
    if (cached) {
      event = cached;
      loading = false;
      return;
    }
    loading = true;
    try {
      event = await EventsService.getEventById(eventId);
    } catch (err) {
      event = null;
      error = toUserMessage(err, 'Failed to load event');
    } finally {
      loading = false;
    }
  }

  async function handleSaved() {
    if (!event) return;
    try {
      event = await EventsService.getEventById(event.id);
      eventsStore.setEvents(await EventsService.getAllEvents());
    } catch (err) {
      error = toUserMessage(err, 'Failed to reload event');
    }
  }

  function back(e: MouseEvent) {
    e.preventDefault();
    navigate('/');
  }

  function mapsUrl(ev: EventWithDetails): string {
    return (
      ev.location_details?.maps_url ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`
    );
  }

  function time(v: string | null): string {
    return v ? v.substring(0, 5) : '';
  }

  $: view = event ? getRaceView(event, $t) : null;
  $: canRegister =
    !!event?.registration_url && !!view?.status && (view.status.state === 'open' || view.status.state === 'register');
  $: saved = event ? $selectedEventIds.has(event.id) : false;
  $: canEdit = event ? canEditEvent(event, $authStore.user) : false;
  $: dateText = event
    ? event.end_date && event.end_date !== event.date
      ? `${formatDate(event.date, { day: 'numeric', month: 'short' })} – ${formatLongDate(event.end_date)}`
      : formatLongDate(event.date)
    : '';
  $: timeText = event?.start_time ? `${time(event.start_time)}${event.end_time ? ` – ${time(event.end_time)}` : ''}` : '';
  $: if (typeof document !== 'undefined') {
    document.title = event ? `${event.title} - BMX Calendar` : document.title;
  }

  onMount(() => {
    loadUserSelections();
  });
</script>

<div class="detail">
  <a class="back" href="/" on:click={back}>← {$t.calendar.backToCalendar}</a>

  {#if loading}
    <div class="center"><LoadingSpinner size="lg" /></div>
  {:else if error}
    <Alert type="danger" message={error} />
  {:else if !event || !view}
    <div class="not-found">
      <h1>{$t.calendar.notFoundTitle}</h1>
      <p>{$t.calendar.notFoundDescription}</p>
      <a class="register" href="/" on:click={back}>{$t.calendar.backToCalendar}</a>
    </div>
  {:else}
    <article class="card">
      <header class="head">
        {#if event.event_type}<TypeLabel type={event.event_type.name} />{/if}
        {#if view.ongoing}<span class="ongoing">{$t.calendar.ongoing}</span>{/if}
      </header>

      <h1 class="title">{event.title}</h1>

      <dl class="facts">
        <div><dt>{$t.calendar.dateLabel}</dt><dd>{dateText}</dd></div>
        {#if timeText}<div><dt>{$t.calendar.timeLabel}</dt><dd>{timeText}</dd></div>{/if}
        {#if view.locationLabel}
          <div>
            <dt>{$t.calendar.locationLabel}</dt>
            <dd><a href={mapsUrl(event)} target="_blank" rel="noopener noreferrer" title={$t.calendar.viewOnMaps}>{view.locationLabel}</a></dd>
          </div>
        {/if}
      </dl>

      {#if event.description}
        <p class="description">{event.description}</p>
      {/if}

      {#if view.status}
        <section class="registration" aria-labelledby="reg-heading">
          <h2 id="reg-heading">{$t.calendar.registrationHeading}</h2>
          <div class="status">
            <StartLight state={view.status.state} label={view.status.label} />
            <span>{view.status.label}</span>
          </div>
          {#if event.registration_opens}
            <p class="line">{$t.calendar.registrationOpens.replace('{date}', formatLongDate(event.registration_opens))}</p>
          {/if}
          {#if event.registration_deadline}
            <p class="line">{$t.calendar.registrationDeadline.replace('{date}', formatLongDate(event.registration_deadline))}</p>
          {/if}
          {#if canRegister}
            <a class="register" href={event.registration_url} target="_blank" rel="noopener noreferrer">{$t.calendar.registerAction}</a>
          {/if}
        </section>
      {/if}

      <div class="actions">
        {#if view.ongoing && event.livestream_url}
          <a class="secondary" href={event.livestream_url} target="_blank" rel="noopener noreferrer">{$t.calendar.watchLivestream}</a>
        {/if}
        <button type="button" class="secondary" aria-pressed={saved} on:click={() => event && toggleEventSelection(event.id)}>
          {saved ? $t.calendar.saved : $t.calendar.save}
        </button>
        {#if canEdit}
          <Button variant="secondary" on:click={() => (editing = true)}>{$t.calendar.editEvent}</Button>
        {/if}
      </div>
    </article>

    {#if canEdit}
      <EventEditor
        {event}
        eventTypes={$eventsStore.eventTypes}
        bind:open={editing}
        on:saved={handleSaved}
        on:close={() => (editing = false)}
      />
    {/if}
  {/if}
</div>

<style>
  .detail {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--spacing-md);
  }

  .back {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--touch-target-min);
    color: var(--color-primary-hover);
    text-decoration: none;
  }

  .center { display: flex; justify-content: center; padding: var(--spacing-2xl); }

  .card, .not-found {
    margin-block-start: var(--spacing-sm);
    padding: var(--spacing-lg);
    border-radius: var(--hero-radius);
    background-color: var(--hero-bg);
    background-image: var(--hero-stripe);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .head { display: flex; align-items: center; gap: var(--spacing-sm); }

  .ongoing {
    padding: 2px var(--spacing-sm);
    border-radius: var(--border-radius-full);
    background-color: var(--color-success-light);
    color: var(--color-success);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
  }

  .title, .not-found h1 {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-4xl);
    font-style: italic;
    text-transform: uppercase;
    line-height: var(--line-height-tight);
    color: var(--color-text-primary);
    overflow-wrap: break-word;
  }

  .facts { display: flex; flex-direction: column; gap: var(--spacing-sm); margin: 0; }
  .facts div { display: flex; flex-direction: column; }

  dt {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-sm);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  dd { margin: 0; font-size: var(--font-size-lg); color: var(--color-text-primary); }
  dd a { color: var(--color-text-primary); text-decoration: underline; }

  .description { margin: 0; color: var(--color-text-secondary); line-height: var(--line-height-normal); white-space: pre-line; }

  .registration { display: flex; flex-direction: column; gap: var(--spacing-sm); padding-block-start: var(--spacing-md); border-block-start: 1px solid var(--color-border); }
  .registration h2 { margin: 0; font-family: var(--font-family-heading); font-size: var(--font-size-xl); text-transform: uppercase; color: var(--color-text-primary); }
  .status { display: flex; align-items: center; gap: var(--spacing-sm); color: var(--color-text-secondary); }
  .line { margin: 0; color: var(--color-text-secondary); }

  .register {
    display: flex;
    align-items: center;
    justify-content: center;
    min-block-size: calc(var(--touch-target-min) + 8px);
    border-radius: var(--border-radius-lg);
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .register:hover { background-color: var(--color-accent-hover); }

  .actions { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }

  .secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    cursor: pointer;
  }

  .secondary[aria-pressed='true'] { color: var(--color-accent); border-color: var(--color-accent); }
  .secondary:hover { border-color: var(--color-primary); }
</style>
