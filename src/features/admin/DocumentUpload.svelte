<script lang="ts">
  import { FileUpload, Button, Alert, LoadingSpinner, Select, Input } from '@shared/components';
  import { toUserMessage } from '@shared/utils/error-message';
  import { importStore, authStore } from '@shared/stores';
  import { ImportService, EventsService } from '@shared/services';
  import { parseFile, getSupportedFileTypes } from '@shared/utils';
  import { supabase } from '@data/supabase';
  import type { ParsedEvent, Location, Team } from '@types';

  export let isAdmin = false;
  export let teams: Team[] = [];
  export let fixedTeamId: string | null = null;

  let selectedFile: File | null = null;
  let parsedEvents: ParsedEvent[] = [];
  let error = '';
  let success = '';
  let parsing = false;
  let importing = false;

  let allLocations: Location[] = [];
  let unknownLocations: Map<string, string | null> = new Map();
  let locationResolutions: Record<string, { action: 'match' | 'create' | 'skip'; locationId?: string; newName?: string; city?: string; address?: string; country?: string }> = {};
  let creatingLocations = false;

  let selectedTeamId = fixedTeamId ?? '';

  $: user = $authStore.user;
  $: showTeamSelector = isAdmin && !fixedTeamId;
  $: teamOptions = [
    { value: '', label: 'Public (no team)' },
    ...teams.map(t => ({ value: t.id, label: t.name })),
  ];

  async function handleFileSelected(event: CustomEvent<File>) {
    selectedFile = event.detail;
    error = '';
    success = '';
    parsedEvents = [];
    unknownLocations = new Map();
    locationResolutions = {};

    try {
      parsing = true;
      parsedEvents = await parseFile(selectedFile);
      if (parsedEvents.length === 0) {
        error = 'No events found in the file.';
        selectedFile = null;
        return;
      }
      await detectUnknownLocations();
      success = `Successfully parsed ${parsedEvents.length} events from ${selectedFile.name}`;
    } catch (err) {
      error = toUserMessage(err, 'Failed to parse file');
      selectedFile = null;
    } finally {
      parsing = false;
    }
  }

  async function detectUnknownLocations() {
    allLocations = await EventsService.getLocations();
    const locationMap = new Map(allLocations.map(loc => [loc.name.toLowerCase().trim(), loc.id]));
    const seen = new Set<string>();
    const unknowns = new Map<string, string | null>();

    for (const event of parsedEvents) {
      const locationText = event.location?.trim();
      if (!locationText || seen.has(locationText.toLowerCase())) continue;
      seen.add(locationText.toLowerCase());

      const locationLower = locationText.toLowerCase();
      let matched = locationMap.get(locationLower);

      if (!matched) {
        for (const [locName, locId] of locationMap.entries()) {
          if (locationLower.includes(locName) || locName.includes(locationLower)) {
            matched = locId;
            break;
          }
        }
      }

      if (!matched) {
        unknowns.set(locationText, null);
        locationResolutions[locationText] = { action: 'skip' };
      }
    }

    unknownLocations = unknowns;
  }

  $: hasUnresolvedLocations = unknownLocations.size > 0 &&
    Array.from(unknownLocations.keys()).some(loc =>
      locationResolutions[loc]?.action === 'match' && !locationResolutions[loc]?.locationId
    );

  function setResolutionAction(locationText: string, action: 'match' | 'create' | 'skip') {
    locationResolutions[locationText] = { ...locationResolutions[locationText], action };
  }

  function setMatchLocation(locationText: string, locationId: string) {
    locationResolutions[locationText] = { ...locationResolutions[locationText], action: 'match', locationId };
  }

  function setCreateLocationField(locationText: string, field: 'newName' | 'city' | 'address' | 'country', value: string) {
    locationResolutions[locationText] = { ...locationResolutions[locationText], action: 'create', [field]: value };
  }

  $: locationSelectOptions = allLocations.map(loc => ({ value: loc.id, label: loc.name }));

  async function resolveLocations(): Promise<void> {
    creatingLocations = true;
    try {
      for (const [locationText, resolution] of Object.entries(locationResolutions)) {
        if (resolution.action === 'create') {
          const newLoc = await EventsService.createLocation({
            name: resolution.newName?.trim() || locationText,
            city: resolution.city?.trim() || undefined,
            address: resolution.address?.trim() || undefined,
            country: resolution.country?.trim() || undefined,
          });
          for (const event of parsedEvents) {
            if (event.location?.trim().toLowerCase() === locationText.toLowerCase()) {
              event.location_id = newLoc.id;
            }
          }
          allLocations = [...allLocations, newLoc];
        } else if (resolution.action === 'match' && resolution.locationId) {
          for (const event of parsedEvents) {
            if (event.location?.trim().toLowerCase() === locationText.toLowerCase()) {
              event.location_id = resolution.locationId;
            }
          }
        }
      }
    } catch (err) {
      throw new Error(toUserMessage(err, 'Failed to create location'));
    } finally {
      creatingLocations = false;
    }
  }

  async function handleImport() {
    if (!selectedFile || parsedEvents.length === 0) return;

    const userId = user?.id || '';

    try {
      importing = true;
      importStore.setUploading(true);
      error = '';
      success = '';

      if (unknownLocations.size > 0) {
        await resolveLocations();
      }

      const teamId = fixedTeamId || selectedTeamId || undefined;

      const result = await ImportService.importEvents(
        parsedEvents,
        selectedFile.name,
        userId,
        teamId
      );

      if (result.success) {
        success = `Successfully imported ${result.imported} events!`;
      } else {
        success = `Imported ${result.imported} events with ${result.errors.length} errors.`;
        if (result.errors.length > 0) {
          error = result.errors.map(e => `Row ${e.row}: ${e.error}`).join('\n');
        }
      }

      selectedFile = null;
      parsedEvents = [];
      unknownLocations = new Map();
      locationResolutions = {};
    } catch (err) {
      error = toUserMessage(err, 'Failed to import events');
    } finally {
      importing = false;
      importStore.setUploading(false);
    }
  }

  function handleCancel() {
    selectedFile = null;
    parsedEvents = [];
    error = '';
    success = '';
    unknownLocations = new Map();
    locationResolutions = {};
  }

  $: canImport = parsedEvents.length > 0 && !hasUnresolvedLocations && !importing && !parsing;
</script>

<div class="document-upload">
  <p class="section-description">
    Upload a CSV, Excel, iCalendar, PDF, or image file to bulk import events. Supported formats: CSV, XLSX, XLS, ICS, PDF, JPG, PNG, WebP
  </p>

  {#if showTeamSelector}
    <div class="team-selector">
      <Select
        label="Assign to team"
        bind:value={selectedTeamId}
        options={teamOptions}
        placeholder="Public (no team)"
      />
    </div>
  {/if}

  {#if error}
    <Alert type="danger" message={error} />
  {/if}

  {#if success}
    <Alert type="success" message={success} />
  {/if}

  {#if parsing}
    <div class="parsing-container">
      <LoadingSpinner size="lg" />
      <p>Parsing file...</p>
    </div>
  {:else if parsedEvents.length > 0}
    <div class="preview-container">
      <h3 class="preview-title">Preview: {parsedEvents.length} events found</h3>
      <div class="preview-list">
        {#each parsedEvents.slice(0, 5) as event}
          <div class="preview-item">
            <strong>{event.title}</strong> - {event.date}{#if event.location} at {event.location}{/if}
            {#if event.event_type} <span class="event-type">({event.event_type})</span>{/if}
          </div>
        {/each}
        {#if parsedEvents.length > 5}
          <p class="preview-more">...and {parsedEvents.length - 5} more events</p>
        {/if}
      </div>

      {#if unknownLocations.size > 0}
        <div class="location-resolution">
          <h4 class="resolution-title">Resolve unknown locations</h4>
          <p class="resolution-hint">
            These locations were not found in the database. Match them to existing locations, create new ones, or skip.
          </p>

          {#each Array.from(unknownLocations.keys()) as locText (locText)}
            <div class="resolution-item">
              <div class="resolution-location-name">{locText}</div>
              <div class="resolution-actions">
                <div class="resolution-tabs">
                  <button
                    class="resolution-tab"
                    class:active={locationResolutions[locText]?.action === 'match'}
                    on:click={() => setResolutionAction(locText, 'match')}
                  >
                    Match existing
                  </button>
                  <button
                    class="resolution-tab"
                    class:active={locationResolutions[locText]?.action === 'create'}
                    on:click={() => setResolutionAction(locText, 'create')}
                  >
                    Create new
                  </button>
                  <button
                    class="resolution-tab"
                    class:active={locationResolutions[locText]?.action === 'skip'}
                    on:click={() => setResolutionAction(locText, 'skip')}
                  >
                    Skip
                  </button>
                </div>

                {#if locationResolutions[locText]?.action === 'match'}
                  <Select
                    value={locationResolutions[locText]?.locationId ?? ''}
                    options={locationSelectOptions}
                    placeholder="Select a location"
                    on:change={(e) => setMatchLocation(locText, e.currentTarget.value)}
                  />
                {:else if locationResolutions[locText]?.action === 'create'}
                  <div class="create-fields">
                    <Input
                      label="Location name"
                      value={locationResolutions[locText]?.newName ?? locText}
                      on:input={(e) => setCreateLocationField(locText, 'newName', e.currentTarget.value)}
                    />
                    <Input
                      label="City"
                      value={locationResolutions[locText]?.city ?? ''}
                      on:input={(e) => setCreateLocationField(locText, 'city', e.currentTarget.value)}
                    />
                    <Input
                      label="Address"
                      value={locationResolutions[locText]?.address ?? ''}
                      on:input={(e) => setCreateLocationField(locText, 'address', e.currentTarget.value)}
                    />
                    <Input
                      label="Country"
                      value={locationResolutions[locText]?.country ?? ''}
                      on:input={(e) => setCreateLocationField(locText, 'country', e.currentTarget.value)}
                    />
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <div class="preview-actions">
        <Button
          variant="primary"
          size="md"
          disabled={!canImport}
          on:click={handleImport}
        >
          {importing ? 'Importing...' : 'Import Events'}
        </Button>
        <Button variant="ghost" size="md" disabled={importing} on:click={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  {:else}
    <FileUpload
      accept={getSupportedFileTypes()}
      label="Upload Event Calendar"
      on:fileSelected={handleFileSelected}
      disabled={parsing || importing}
    />
  {/if}
</div>

<style>
  .document-upload {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .section-description {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    padding-top: var(--spacing-md);
  }

  .team-selector {
    max-width: 320px;
  }

  .parsing-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-2xl);
  }

  .preview-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
  }

  .preview-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .preview-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .preview-item {
    padding: var(--spacing-sm);
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
  }

  .preview-more {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-style: italic;
    margin: 0;
  }

  .event-type {
    color: var(--color-text-muted);
  }

  .preview-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }

  .location-resolution {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
  }

  .resolution-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .resolution-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .resolution-item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
  }

  .resolution-location-name {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .resolution-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .resolution-tabs {
    display: flex;
    gap: var(--spacing-xs);
  }

  .resolution-tab {
    padding: var(--spacing-xxs) var(--spacing-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    background-color: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .resolution-tab:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .resolution-tab.active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .create-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  @media (max-width: 640px) {
    .create-fields {
      grid-template-columns: 1fr;
    }
  }
</style>
