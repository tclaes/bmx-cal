<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toUserMessage } from '@shared/utils/error-message';
  import type { Location } from '@types';
  import { EventsService } from '@shared/services';
  import Input from './Input.svelte';
  import Button from './Button.svelte';
  import Alert from './Alert.svelte';

  export let locations: Location[] = [];
  export let selectedLocationId: string = '';
  export let selectedLocationLabel: string = '';
  export let required = false;

  const dispatch = createEventDispatcher<{
    change: { locationId: string; locationLabel: string };
    locationsUpdated: Location[];
  }>();

  let showAddLocation = false;
  let newLocationName = '';
  let newLocationCity = '';
  let newLocationAddress = '';
  let newLocationCountry = 'Belgium';
  let savingLocation = false;
  let locationError = '';

  function locationLabel(loc: Location) {
    return loc.city ? `${loc.name}, ${loc.city}` : loc.name;
  }

  function handleLocationSelect(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    if (val === '__new__') {
      showAddLocation = true;
      selectedLocationId = '';
      selectedLocationLabel = '';
      dispatch('change', { locationId: '', locationLabel: '' });
      return;
    }
    showAddLocation = false;
    const loc = locations.find(l => l.id === val);
    selectedLocationId = val;
    selectedLocationLabel = loc ? locationLabel(loc) : '';
    dispatch('change', { locationId: val, locationLabel: selectedLocationLabel });
  }

  async function handleSaveLocation() {
    if (!newLocationName.trim()) return;
    savingLocation = true;
    locationError = '';
    try {
      const created = await EventsService.createLocation({
        name: newLocationName.trim(),
        city: newLocationCity.trim() || undefined,
        address: newLocationAddress.trim() || undefined,
        country: newLocationCountry.trim() || undefined,
      });
      locations = [...locations, created].sort((a, b) => a.name.localeCompare(b.name));
      selectedLocationId = created.id;
      selectedLocationLabel = locationLabel(created);
      newLocationName = '';
      newLocationCity = '';
      newLocationAddress = '';
      newLocationCountry = 'Belgium';
      showAddLocation = false;
      dispatch('change', { locationId: created.id, locationLabel: selectedLocationLabel });
      dispatch('locationsUpdated', locations);
    } catch (err) {
      locationError = toUserMessage(err, 'Failed to create location');
    } finally {
      savingLocation = false;
    }
  }
</script>

<div class="location-picker">
  <label class="field-label" for="location-picker-select">
    Location{#if required}<span class="required">*</span>{/if}
  </label>
  <select
    id="location-picker-select"
    class="location-select"
    value={selectedLocationId || ''}
    on:change={handleLocationSelect}
    {required}
  >
    <option value="" disabled>Select a location...</option>
    {#each locations as loc (loc.id)}
      <option value={loc.id}>{locationLabel(loc)}</option>
    {/each}
    <option value="__new__">+ Add new location...</option>
  </select>

  {#if showAddLocation}
    <div class="add-location-panel">
      <p class="add-location-title">New Location</p>
      {#if locationError}
        <Alert type="danger" message={locationError} />
      {/if}
      <div class="form-row">
        <Input label="Name" bind:value={newLocationName} required placeholder="e.g. BMX Track Gent" />
      </div>
      <div class="form-row form-row--cols">
        <Input label="City" bind:value={newLocationCity} placeholder="e.g. Gent" />
        <Input label="Country" bind:value={newLocationCountry} placeholder="e.g. Belgium" />
      </div>
      <div class="form-row">
        <Input label="Address" bind:value={newLocationAddress} placeholder="Street and number (optional)" />
      </div>
      <div class="add-location-actions">
        <Button type="button" variant="ghost" size="sm" on:click={() => { showAddLocation = false; }} disabled={savingLocation}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" size="sm" on:click={handleSaveLocation} disabled={savingLocation || !newLocationName.trim()}>
          {savingLocation ? 'Saving...' : 'Save Location'}
        </Button>
      </div>
    </div>
  {/if}
</div>

<style>
  .location-picker {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .field-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .required {
    color: var(--color-error, #dc2626);
    margin-left: 2px;
  }

  .location-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-sm);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
    box-sizing: border-box;
  }

  .location-select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .add-location-panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .add-location-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-xs);
  }

  .form-row {
    display: flex;
    flex-direction: column;
  }

  .form-row--cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .add-location-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-xs);
  }
</style>
