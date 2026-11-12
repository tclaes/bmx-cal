<script lang="ts">
  import { filtersStore, eventsStore } from '@core/stores';
  import { TypeChip } from '@ui';
  import { t } from '../../i18n';

  let expanded = false;

  $: eventTypes = $eventsStore.eventTypes;
  $: selected = $filtersStore.selectedEventTypes;
  $: activeCount =
    selected.length +
    ($filtersStore.startDate ? 1 : 0) +
    ($filtersStore.endDate ? 1 : 0) +
    ($filtersStore.searchQuery ? 1 : 0) +
    ($filtersStore.showPastEvents ? 1 : 0);

  function setDates(start: string, end: string) {
    filtersStore.setDateRange(start || null, end || null);
  }
</script>

<section class="filters-wrapper" aria-label={$t.filters.title}>
  <button
    class="toggle"
    type="button"
    aria-expanded={expanded}
    aria-controls="calendar-filters"
    on:click={() => (expanded = !expanded)}
  >
    <span>{expanded ? $t.filters.hideFilters : $t.filters.showFilters}</span>
    {#if activeCount > 0}<span class="badge">{activeCount}</span>{/if}
  </button>

  <div id="calendar-filters" class="filters" class:collapsed={!expanded}>
    <div class="group">
      <label class="group-label" for="filter-search">{$t.filters.search}</label>
      <input
        id="filter-search"
        class="field"
        type="search"
        placeholder={$t.filters.searchPlaceholder}
        value={$filtersStore.searchQuery}
        on:input={(e) => filtersStore.setSearchQuery(e.currentTarget.value)}
      />
    </div>

    <div class="group" role="group" aria-labelledby="filter-type">
      <span class="group-label" id="filter-type">{$t.filters.typeFilter}</span>
      <div class="chips">
        <TypeChip
          label={$t.filters.allChip}
          state={selected.length === 0 ? 'on' : 'off'}
          on:click={() => filtersStore.setEventTypes([])}
        />
        {#each eventTypes as type (type.id)}
          <TypeChip
            type={type.name}
            state={selected.includes(type.id) ? 'on' : 'off'}
            on:click={() => filtersStore.toggleEventType(type.id)}
          />
        {/each}
      </div>
    </div>

    <div class="group dates">
      <label class="date">
        <span class="group-label">{$t.filters.startDate}</span>
        <input class="field" type="date" value={$filtersStore.startDate ?? ''} on:change={(e) => setDates(e.currentTarget.value, $filtersStore.endDate ?? '')} />
      </label>
      <label class="date">
        <span class="group-label">{$t.filters.endDate}</span>
        <input class="field" type="date" value={$filtersStore.endDate ?? ''} on:change={(e) => setDates($filtersStore.startDate ?? '', e.currentTarget.value)} />
      </label>
    </div>

    <label class="check">
      <input type="checkbox" checked={$filtersStore.showPastEvents} on:change={() => filtersStore.toggleShowPastEvents()} />
      <span>{$t.filters.showPastEvents}</span>
    </label>

    {#if activeCount > 0}
      <button type="button" class="reset" on:click={() => filtersStore.reset()}>{$t.filters.resetFilters}</button>
    {/if}
  </div>
</section>

<style>
  .filters-wrapper {
    padding: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    background-color: var(--color-bg-tertiary);
  }

  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    inline-size: 100%;
    min-block-size: var(--touch-target-min);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .badge {
    min-inline-size: 24px;
    padding-inline: var(--spacing-xs);
    border-radius: var(--border-radius-full);
    background-color: var(--color-primary);
    color: var(--color-text-on-accent);
    font-size: var(--font-size-sm);
    text-align: center;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-block-start: var(--spacing-md);
  }

  .filters.collapsed { display: none; }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .group-label {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .field {
    inline-size: 100%;
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    font: inherit;
  }

  .field:focus-visible {
    outline: 2px solid var(--color-primary-hover);
    outline-offset: 1px;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .dates {
    flex-direction: row;
    gap: var(--spacing-sm);
  }

  .date {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;
    min-inline-size: 0;
  }

  .check {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-block-size: var(--touch-target-min);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .check input {
    inline-size: 22px;
    block-size: 22px;
    accent-color: var(--color-primary);
  }

  .reset {
    min-block-size: var(--touch-target-min);
    color: var(--color-primary-hover);
    text-decoration: underline;
    cursor: pointer;
    text-align: start;
  }

  @media (width >= 1024px) {
    .toggle { display: none; }

    .filters, .filters.collapsed {
      display: flex;
      margin-block-start: 0;
    }
  }
</style>
