<script lang="ts">
  import { Input, Dropdown, CheckboxItem } from '@shared/components';
  import { filtersStore } from '@shared/stores';
  import { eventsStore } from '@shared/stores';
  import type { EventType } from '@types';
  import { t } from '../../i18n';

  let eventTypes: EventType[] = [];
  let selectedTypes: string[] = [];
  let startDate = '';
  let endDate = '';
  let searchQuery = '';
  let dropdownOpen = false;
  let filtersExpanded = false;

  $: eventTypes = $eventsStore.eventTypes;
  $: selectedTypes = $filtersStore.selectedEventTypes;
  $: showPastEvents = $filtersStore.showPastEvents;
  $: searchQuery = $filtersStore.searchQuery;

  function handleTypeToggle(typeId: string) {
    filtersStore.toggleEventType(typeId);
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

  function handleSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    filtersStore.setSearchQuery(searchQuery);
  }

  function resetFilters() {
    selectedTypes = [];
    startDate = '';
    endDate = '';
    searchQuery = '';
    filtersStore.reset();
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
  }
</script>

<div class="filters-wrapper">
  <button
    class="filters-toggle"
    type="button"
    on:click={() => (filtersExpanded = !filtersExpanded)}
    aria-expanded={filtersExpanded}
  >
    <span>{$t.filters.title}</span>
    {#if selectedTypes.length > 0 || startDate || endDate || searchQuery || $filtersStore.showPastEvents}
      <span class="filter-badge">{selectedTypes.length + (startDate ? 1 : 0) + (endDate ? 1 : 0) + (searchQuery ? 1 : 0) + ($filtersStore.showPastEvents ? 1 : 0)}</span>
    {/if}
    <span class="toggle-chevron" class:rotated={filtersExpanded}>▼</span>
  </button>

<div class="filters" class:collapsed={!filtersExpanded}>
  <Input
    type="text"
    id="search-filter"
    label={$t.filters.searchLocation}
    placeholder={$t.filters.searchPlaceholder}
    value={searchQuery}
    on:input={handleSearchChange}
  />

  <Dropdown
    id="event-type-dropdown"
    label={$t.filters.eventTypes}
    placeholder={$t.filters.allTypes}
    selectedCount={selectedTypes.length}
    open={dropdownOpen}
    on:toggle={toggleDropdown}
  >
    {#each eventTypes as eventType}
      <CheckboxItem
        label={eventType.name}
        value={eventType.id}
        checked={selectedTypes.includes(eventType.id)}
        on:change={(e) => handleTypeToggle(e.detail)}
      />
    {/each}
  </Dropdown>

  <Input
    type="date"
    id="start-date-filter"
    label={$t.filters.startDate}
    bind:value={startDate}
    on:change={handleStartDateChange}
  />

  <Input
    type="date"
    id="end-date-filter"
    label={$t.filters.endDate}
    bind:value={endDate}
    on:change={handleEndDateChange}
  />

  <div class="past-events-toggle">
    <label class="toggle-label" for="show-past-events-btn">{$t.filters.showPastEvents}</label>
    <button
      id="show-past-events-btn"
      class="toggle-btn"
      class:active={showPastEvents}
      on:click={() => filtersStore.toggleShowPastEvents()}
      type="button"
      aria-pressed={showPastEvents}
      aria-label={$t.filters.showPastEvents}
    >
      <span class="toggle-track">
        <span class="toggle-thumb" />
      </span>
    </button>
  </div>

  <button class="reset-button" on:click={resetFilters}>{$t.filters.resetFilters}</button>
</div>
</div>

<style>
  .filters-wrapper {
    position: relative;
  }

  .filters-toggle {
    display: none;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    cursor: pointer;
    transition: all var(--transition-base);
    gap: var(--spacing-sm);
  }

  .filters-toggle:hover {
    border-color: var(--color-primary);
  }

  .filter-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: white;
    background-color: var(--color-primary);
    border-radius: 10px;
    margin-left: auto;
  }

  .toggle-chevron {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .toggle-chevron.rotated {
    transform: rotate(180deg);
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
  }

  .past-events-toggle {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .toggle-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .toggle-btn {
    min-width: 44px;
    min-height: 44px;
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding-block: var(--spacing-sm-plus);
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .toggle-track {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: var(--color-border);
    border-radius: 12px;
    transition: background-color 0.2s;
    display: block;
  }

  .toggle-btn.active .toggle-track {
    background-color: var(--color-primary);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
    display: block;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .toggle-btn.active .toggle-thumb {
    transform: translateX(20px);
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
    .filters-toggle {
      display: flex;
    }

    .filters {
      grid-template-columns: 1fr;
      margin-top: var(--spacing-sm);
      overflow: hidden;
      max-height: 1000px;
      transition: max-height 0.3s ease, opacity 0.2s ease, padding 0.2s ease;
      opacity: 1;
    }

    .filters.collapsed {
      max-height: 0;
      opacity: 0;
      padding-top: 0;
      padding-bottom: 0;
      pointer-events: none;
    }
  }
</style>
