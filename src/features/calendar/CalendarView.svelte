<script lang="ts">
  import EventFilters from './EventFilters.svelte';
  import EventList from './EventList.svelte';
  import ExportButton from './ExportButton.svelte';
</script>

<div class="calendar-view">
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

<style>
  .calendar-view {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-xl) var(--spacing-md);
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

  @media (max-width: 768px) {
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
