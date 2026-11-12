<script lang="ts">
  import EventFilters from './EventFilters.svelte';
  import EventList from './EventList.svelte';
  import ExportButton from './ExportButton.svelte';
  import AccountCTA from './AccountCTA.svelte';
  import { authStore } from '@core/stores';
  import { t } from '../../i18n';

  $: isAuthenticated = $authStore.user !== null;
</script>

<div class="calendar-view">
  <h1 class="visually-hidden">{$t.calendar.title}</h1>

  <div class="calendar-layout">
    <aside class="calendar-sidebar" aria-label={$t.calendar.sidebar}>
      <EventFilters />
      <div class="export"><ExportButton /></div>
      {#if !isAuthenticated}
        <AccountCTA />
      {/if}
    </aside>

    <div class="calendar-main">
      <EventList />
    </div>
  </div>
</div>

<style>
  .calendar-view {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: var(--spacing-md);
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .calendar-layout {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  /* Mobile: filters sit above the list, collapsed behind their toggle */
  .calendar-sidebar {
    order: -1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .export { display: none; }

  .calendar-main { min-width: 0; }

  @media (width >= 1024px) {
    .calendar-view { padding: var(--spacing-xl) var(--spacing-md); }

    .calendar-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: var(--spacing-xl);
      align-items: start;
    }

    .calendar-sidebar {
      order: 0;
      grid-column: 2;
      grid-row: 1;
      position: sticky;
      top: calc(var(--spacing-xl) * 2 + 24px);
    }

    .calendar-main {
      grid-column: 1;
      grid-row: 1;
    }
    .export { display: block; }
  }

  @media (width <= 1023px) {
    .calendar-sidebar :global(.account-cta) { display: none; }
  }
</style>
