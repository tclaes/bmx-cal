<script lang="ts">
  import { filtersStore, eventsStore } from '@core/stores';
  import { getRaceTypeKey, getRaceTypeCode } from '@shared/utils';
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

  function chipLabel(name: string): string {
    return getRaceTypeKey(name) === 'unknown' ? name : getRaceTypeCode(name);
  }

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
        <button
          type="button"
          class="chip chip-all"
          class:on={selected.length === 0}
          aria-pressed={selected.length === 0}
          on:click={() => filtersStore.setEventTypes([])}
        >{$t.filters.allChip}</button>
        {#each eventTypes as type (type.id)}
          {@const key = getRaceTypeKey(type.name)}
          <button
            type="button"
            class="chip"
            class:on={selected.includes(type.id)}
            aria-pressed={selected.includes(type.id)}
            title={type.name}
            on:click={() => filtersStore.toggleEventType(type.id)}
          >
            <span class="dot dot-{key}" aria-hidden="true"></span>{chipLabel(type.name)}
          </button>
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

  .group { display: flex; flex-direction: column; gap: var(--spacing-xs); }

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

  .field:focus-visible { outline: 2px solid var(--color-primary-hover); outline-offset: 1px; }

  .chips { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-block-size: var(--touch-target-min);
    padding-inline: var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background-color: transparent;
    color: var(--color-text-primary);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .chip.on {
    border-color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  .chip-all.on {
    background-color: var(--color-primary);
    color: var(--color-text-on-accent);
  }

  .dot {
    inline-size: 12px;
    block-size: 12px;
    border-radius: var(--border-radius-full);
    background-color: var(--race-unknown-ring);
  }

  .dot-cv { background-color: var(--race-cv-ring); }
  .dot-tc { background-color: var(--race-tc-ring); }
  .dot-cw { background-color: var(--race-cw-ring); }
  .dot-3nc { background-color: var(--race-3nc-ring); }
  .dot-ec { background-color: var(--race-ec-ring); }
  .dot-wc { background-color: var(--race-wc-ring); }

  .dates { flex-direction: row; gap: var(--spacing-sm); }
  .date { display: flex; flex-direction: column; gap: var(--spacing-xs); flex: 1; min-inline-size: 0; }

  .check {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    min-block-size: var(--touch-target-min);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .check input { inline-size: 22px; block-size: 22px; accent-color: var(--color-primary); }

  .reset {
    min-block-size: var(--touch-target-min);
    color: var(--color-primary-hover);
    text-decoration: underline;
    cursor: pointer;
    text-align: start;
  }

  @media (min-width: 1024px) {
    .toggle { display: none; }
    .filters, .filters.collapsed { display: flex; margin-block-start: 0; }
  }
</style>
