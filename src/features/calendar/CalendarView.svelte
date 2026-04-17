<script lang="ts">
  import EventFilters from './EventFilters.svelte';
  import EventList from './EventList.svelte';
  import ExportButton from './ExportButton.svelte';
  import AdBanner from '@shared/components/AdBanner.svelte';
  import AccountCTA from '@shared/components/AccountCTA.svelte';
  import { authStore } from '@shared/stores';

  $: isAuthenticated = $authStore.user !== null;
</script>

<div class="calendar-view">
  <div class="calendar-layout">
    <div class="calendar-main">
      {#if !isAuthenticated}
        <div class="ad-top">
          <AdBanner slot="1234567890" format="auto" />
        </div>
      {/if}

      <div class="calendar-header">
        <div class="header-content">
          <div>
            <h1 class="calendar-title">BMX Events Calendar</h1>
            <p class="calendar-subtitle">Upcoming BMX events, competitions, and shows</p>
          </div>
          <ExportButton />
        </div>
      </div>

      <EventFilters />

      <div class="calendar-content">
        <EventList />
      </div>
    </div>

    {#if !isAuthenticated}
      <aside class="calendar-sidebar" aria-label="Sidebar">
        <AccountCTA />
        <div class="sidebar-ad">
          <AdBanner slot="0987654321" format="vertical" />
        </div>
      </aside>
    {/if}
  </div>
</div>

<style>
  .calendar-view {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .calendar-layout {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: var(--spacing-xl);
    align-items: start;
  }

  .calendar-main {
    min-width: 0;
  }

  .ad-top {
    display: none;
    margin-bottom: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-sm);
    min-height: 100px;
  }

  .calendar-header {
    margin-bottom: var(--spacing-xl);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }

  .calendar-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  .calendar-subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .calendar-content {
    margin-top: var(--spacing-xl);
  }

  .calendar-sidebar {
    position: sticky;
    top: calc(60px + var(--spacing-lg));
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .sidebar-ad {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-sm);
    min-height: 250px;
  }

  @media (max-width: 1024px) {
    .calendar-layout {
      grid-template-columns: 1fr 260px;
    }
  }

  @media (max-width: 768px) {
    .calendar-layout {
      grid-template-columns: 1fr;
    }

    .calendar-sidebar {
      display: none;
    }

    .ad-top {
      display: block;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
    }

    .calendar-title {
      font-size: var(--font-size-3xl);
    }

    .calendar-subtitle {
      font-size: var(--font-size-base);
    }
  }
</style>
