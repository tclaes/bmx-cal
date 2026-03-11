<script lang="ts">
  import { Select, Input } from '@shared/components';
  import { filtersStore } from '@shared/stores';
  import { eventsStore } from '@shared/stores';
  import type { EventType } from '@types';

  let eventTypes: EventType[] = [];
  let selectedType = '';
  let startDate = '';
  let endDate = '';

  $: eventTypes = $eventsStore.eventTypes;

  $: eventTypeOptions = eventTypes.map(et => ({
    value: et.id,
    label: et.name,
  }));

  function handleTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedType = target.value;
    filtersStore.setEventType(selectedType || null);
  }

  function handleStartDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    startDate = target.value;
    filtersStore.setDateRange(startDate || null, endDate || null);
  }

  function handleEndDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    endDate = target.value;
    filtersStore.setDateRange(startDate || null, endDate || null);
  }

  function resetFilters() {
    selectedType = '';
    startDate = '';
    endDate = '';
    filtersStore.reset();
  }
</script>

<div class="filters">
  <Select
    id="event-type-filter"
    label="Event Type"
    bind:value={selectedType}
    options={eventTypeOptions}
    placeholder="All Types"
    on:change={handleTypeChange}
  />

  <Input
    type="date"
    id="start-date-filter"
    label="Start Date"
    bind:value={startDate}
    on:change={handleStartDateChange}
  />

  <Input
    type="date"
    id="end-date-filter"
    label="End Date"
    bind:value={endDate}
    on:change={handleEndDateChange}
  />

  <button class="reset-button" on:click={resetFilters}>Reset Filters</button>
</div>

<style>
  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
  }

  .reset-button {
    align-self: end;
    padding: var(--spacing-sm) var(--spacing-lg);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    background-color: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
  }

  .reset-button:hover {
    background-color: var(--color-bg-primary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  @media (max-width: 768px) {
    .filters {
      grid-template-columns: 1fr;
    }
  }
</style>
