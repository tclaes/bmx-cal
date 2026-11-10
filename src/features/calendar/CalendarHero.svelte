<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { TypeLabel, StartLight } from '@ui';
  import type { EventWithDetails } from '@types';
  import { t } from '../../i18n';
  import { getRaceView } from '@shared/utils';

  export let event: EventWithDetails;
  export let saved = false;

  const dispatch = createEventDispatcher<{ save: void; navigate: string }>();

  $: view = getRaceView(event, $t);
  $: canRegister =
    !!event.registration_url && !!view.status && (view.status.state === 'open' || view.status.state === 'register');

  function mapsUrl(): string {
    return (
      event.location_details?.maps_url ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    );
  }

  function handleClick(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    dispatch('navigate', view.href);
  }
</script>

<section class="hero" aria-labelledby="hero-title">
  <header class="top">
    <p class="label">{$t.calendar.heroLabel}</p>
    {#if view.status}
      <div class="light">
        <span class="light-text">{view.status.label}</span>
        <StartLight state={view.status.state} label={view.status.label} />
      </div>
    {/if}
  </header>

  <div class="main">
    <div class="date">
      <span class="day">{view.day}</span>
      <span class="date-text">
        <span class="month">{view.monthLong}</span>
        <span class="weekday">{view.weekday}</span>
      </span>
    </div>

    <div class="info">
      <h2 id="hero-title" class="title">
        <a href={view.href} on:click={handleClick}>{event.title}</a>
      </h2>
      <p class="where">
        {#if view.locationLabel}
          <svg class="pin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <a class="map" href={mapsUrl()} target="_blank" rel="noopener noreferrer" title={$t.calendar.viewOnMaps}>{view.locationLabel}</a>
        {/if}
        {#if event.event_type}
          <TypeLabel type={event.event_type.name} />
          <span class="type-name">{event.event_type.name}</span>
        {/if}
      </p>
    </div>
  </div>

  <div class="actions">
    {#if canRegister}
      <a class="register" href={event.registration_url} target="_blank" rel="noopener noreferrer">{$t.calendar.registerAction}</a>
    {:else if view.status?.state === 'soon' && view.opensLabel}
      <span class="opens">{view.opensLabel}</span>
    {/if}
    <button
      type="button"
      class="save"
      class:saved
      aria-pressed={saved}
      aria-label={saved ? $t.calendar.saved : $t.calendar.save}
      on:click={() => dispatch('save')}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round">
        <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" />
      </svg>
    </button>
  </div>

  {#if view.deadlineLabel && canRegister}
    <p class="deadline">{view.deadlineLabel}</p>
  {/if}
</section>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    padding: var(--spacing-lg);
    border-radius: var(--hero-radius);
    background-color: var(--hero-bg);
    background-image: var(--hero-stripe);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .label {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--color-primary-hover);
  }

  .light {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .light-text {
    display: none;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .date {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-md);
    font-family: var(--font-family-heading);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    line-height: 0.9;
  }

  .day {
    font-size: 88px;
    color: var(--color-text-primary);
  }

  .date-text {
    display: flex;
    flex-direction: column;
    padding-block-end: var(--spacing-xs);
  }

  .month {
    font-size: var(--font-size-3xl);
    color: var(--color-accent);
  }

  .weekday {
    font-family: var(--font-family);
    font-style: normal;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-normal);
    text-transform: none;
    color: var(--color-text-secondary);
  }

  .title {
    margin: 0;
    font-family: var(--font-family-heading);
    font-size: var(--font-size-4xl);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    line-height: var(--line-height-tight);
    overflow-wrap: break-word;
  }

  .title a {
    color: var(--color-text-primary);
    text-decoration: none;
  }

  .title a:hover { color: var(--color-primary-hover); }

  .where {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-sm);
    margin: var(--spacing-sm) 0 0;
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
  }

  .pin { color: var(--color-primary); }

  .map {
    color: var(--color-text-primary);
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
    min-block-size: var(--touch-target-min);
  }

  .actions {
    display: flex;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .register,
  .opens {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-block-size: calc(var(--touch-target-min) + 8px);
    border-radius: var(--border-radius-lg);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
  }

  .register {
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
  }

  .register:hover { background-color: var(--color-accent-hover); }

  .opens {
    border: 1px dashed var(--color-border);
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
  }

  .save {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: calc(var(--touch-target-min) + 8px);
    min-block-size: calc(var(--touch-target-min) + 8px);
    margin-inline-start: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .save:hover,
  .save.saved { color: var(--color-accent); border-color: var(--color-accent); }

  .deadline {
    margin: 0;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
  }

  @media (min-width: 768px) {
    .hero { padding: var(--spacing-xl); }
    .light-text { display: inline; }
    .main { flex-direction: row; align-items: flex-end; gap: var(--spacing-xl); }
    .day { font-size: 128px; }
    .title { font-size: 48px; }
    .register, .opens { flex: 0 0 auto; padding-inline: var(--spacing-xl); }
    .save { margin-inline-start: 0; }
  }
</style>
