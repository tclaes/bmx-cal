<script lang="ts">
  import { FileUpload, Button, Alert, LoadingSpinner, Select, Input } from '@shared/components';
  import { toUserMessage } from '@shared/utils/error-message';
  import { importStore, authStore } from '@shared/stores';
  import { ImportService, EventsService } from '@shared/services';
  import { parseFile, getSupportedFileTypes } from '@shared/utils';
  import type { ParsedEvent, Location, EventType, Team } from '@types';

  export let isAdmin = false;
  export let teams: Team[] = [];
  export let fixedTeamId: string | null = null;

  let selectedFile: File | null = null;
  let parsedEvents: ParsedEvent[] = [];
  let error = '';
  let success = '';
  let parsing = false;
  let importing = false;
  let step: 'preview' | 'confirm' = 'preview';

  let allLocations: Location[] = [];
  let allEventTypes: EventType[] = [];
  let unknownLocations: Map<string, string | null> = new Map();
  let locationResolutions: Record<string, {
    action: 'match' | 'create' | 'skip';
    locationId?: string;
    newName?: string;
    city?: string;
    address?: string;
    country?: string;
    mapsUrl?: string;
    mapsConfirmed?: boolean;
  }> = {};
  let creatingLocations = false;

  let eventTypesByTeam: EventType[] = [];
  let publicEventTypes: EventType[] = [];
  let selectedTeamId = fixedTeamId ?? '';

  $: user = $authStore.user;
  $: showTeamSelector = isAdmin && !fixedTeamId;
  $: teamOptions = [
    { value: '', label: 'Public (no team)' },
    ...teams.map(t => ({ value: t.id, label: t.name })),
  ];

  $: availableEventTypes = fixedTeamId
    ? allEventTypes.filter(et => et.team_id === fixedTeamId)
    : selectedTeamId
      ? allEventTypes.filter(et => et.team_id === selectedTeamId)
      : publicEventTypes;

  $: eventTypeOptions = [
    { value: '', label: '-- Select type --' },
    ...availableEventTypes.map(et => ({ value: et.id, label: et.name })),
  ];

  async function handleFileSelected(event: CustomEvent<File>) {
    selectedFile = event.detail;
    error = '';
    success = '';
    parsedEvents = [];
    unknownLocations = new Map();
    locationResolutions = {};
    step = 'preview';

    try {
      parsing = true;
      await loadEventTypes();
      parsedEvents = await parseFile(selectedFile);
      if (parsedEvents.length === 0) {
        error = 'No events found in the file.';
        selectedFile = null;
        return;
      }
      assignDefaultEventTypeIds();
      await detectUnknownLocations();
      success = `Successfully parsed ${parsedEvents.length} events from ${selectedFile.name}`;
    } catch (err) {
      error = toUserMessage(err, 'Failed to parse file');
      selectedFile = null;
    } finally {
      parsing = false;
    }
  }

  async function loadEventTypes() {
    allEventTypes = await EventsService.getEventTypes();
    publicEventTypes = allEventTypes.filter(et => !et.team_id);
  }

  function assignDefaultEventTypeIds() {
    const eventTypeMap = new Map(allEventTypes.map(et => [et.name.toLowerCase(), et.id]));
    for (const event of parsedEvents) {
      if (event.event_type) {
        const matched = eventTypeMap.get(event.event_type.toLowerCase().trim());
        if (matched) {
          event.event_type_id = matched;
          continue;
        }
      }
      const raceType = availableEventTypes.find(et => et.name.toLowerCase() === 'race');
      event.event_type_id = raceType?.id ?? availableEventTypes[0]?.id ?? '';
    }
  }

  function setEventType(index: number, eventTypeId: string) {
    parsedEvents[index].event_type_id = eventTypeId;
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
        locationResolutions[locationText] = { action: 'skip', mapsConfirmed: false };
      }
    }

    unknownLocations = unknowns;
  }

  $: hasUnresolvedLocations = unknownLocations.size > 0 &&
    Array.from(unknownLocations.keys()).some(loc =>
      locationResolutions[loc]?.action === 'match' && !locationResolutions[loc]?.locationId
    );

  $: hasUnconfirmedMaps = Array.from(unknownLocations.keys()).some(loc => {
    const r = locationResolutions[loc];
    return r?.action === 'create' && !r?.mapsConfirmed;
  });

  $: allEventTypesAssigned = parsedEvents.length > 0 && parsedEvents.every(e => e.event_type_id);

  $: canProceedToConfirm = parsedEvents.length > 0 && !hasUnresolvedLocations && !importing && !parsing && allEventTypesAssigned;
  $: canImport = step === 'confirm' && !hasUnconfirmedMaps && !importing;

  function setResolutionAction(locationText: string, action: 'match' | 'create' | 'skip') {
    const existing = locationResolutions[locationText];
    locationResolutions[locationText] = { ...existing, action, mapsConfirmed: action === 'create' ? false : (existing?.mapsConfirmed ?? false) };
    if (action === 'create') {
      generateMapsUrl(locationText);
    }
  }

  function setMatchLocation(locationText: string, locationId: string) {
    locationResolutions[locationText] = { ...locationResolutions[locationText], action: 'match', locationId };
  }

  function setCreateLocationField(locationText: string, field: 'newName' | 'city' | 'address' | 'country', value: string) {
    locationResolutions[locationText] = {
      ...locationResolutions[locationText],
      action: 'create',
      [field]: value,
      mapsConfirmed: false,
    };
  }

  function generateMapsUrl(locationText: string) {
    const r = locationResolutions[locationText];
    const parts = [
      r?.newName?.trim() || locationText,
      r?.address?.trim(),
      r?.city?.trim(),
      r?.country?.trim(),
    ].filter(Boolean);
    const query = parts.join(', ');
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    locationResolutions[locationText] = { ...r, mapsUrl: url, mapsConfirmed: false };
  }

  function confirmMapsUrl(locationText: string) {
    const r = locationResolutions[locationText];
    if (!r) return;
    generateMapsUrl(locationText);
    locationResolutions[locationText] = { ...locationResolutions[locationText], mapsConfirmed: true };
  }

  function regenerateMapsUrl(locationText: string) {
    const r = locationResolutions[locationText];
    if (!r) return;
    const parts = [
      r?.newName?.trim() || locationText,
      r?.address?.trim(),
      r?.city?.trim(),
      r?.country?.trim(),
    ].filter(Boolean);
    const query = parts.join(', ');
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    locationResolutions[locationText] = { ...r, mapsUrl: url, mapsConfirmed: false };
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
            maps_url: resolution.mapsUrl || undefined,
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

  function proceedToConfirm() {
    step = 'confirm';
    for (const locText of Array.from(unknownLocations.keys())) {
      const r = locationResolutions[locText];
      if (r?.action === 'create' && !r?.mapsUrl) {
        generateMapsUrl(locText);
      }
    }
  }

  function backToPreview() {
    step = 'preview';
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
      step = 'preview';
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
    step = 'preview';
  }

  function getEventTypeName(eventTypeId: string | undefined): string {
    if (!eventTypeId) return 'Not set';
    const et = allEventTypes.find(e => e.id === eventTypeId);
    return et?.name ?? 'Unknown';
  }

  function getLocationResolutionSummary(locText: string): string {
    const r = locationResolutions[locText];
    if (!r) return 'Skipped';
    if (r.action === 'skip') return 'Skipped (no link)';
    if (r.action === 'match') {
      const loc = allLocations.find(l => l.id === r.locationId);
      return loc ? `Matched: ${loc.name}` : 'Matched';
    }
    if (r.action === 'create') {
      return `New: ${r.newName?.trim() || locText}`;
    }
    return '';
  }
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
    {#if step === 'preview'}
      <div class="preview-container">
        <h3 class="preview-title">Preview: {parsedEvents.length} events found</h3>

        <div class="preview-list">
          {#each parsedEvents as event, i}
            <div class="preview-item">
              <div class="preview-item-header">
                <strong>{event.title}</strong>
                <span class="preview-date">{event.date}{#if event.location} at {event.location}{/if}</span>
              </div>
              <div class="preview-item-type">
                <label for={`event-type-${i}`} class="event-type-label">Event type</label>
                <Select
                  id={`event-type-${i}`}
                  value={event.event_type_id ?? ''}
                  options={eventTypeOptions}
                  on:change={(e) => setEventType(i, e.currentTarget.value)}
                />
              </div>
            </div>
          {/each}
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
                    <div class="maps-preview">
                      <div class="maps-preview-label">Google Maps link:</div>
                      {#if locationResolutions[locText]?.mapsUrl}
                        <a
                          href={locationResolutions[locText]?.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="maps-link"
                        >
                          {locationResolutions[locText]?.mapsUrl}
                        </a>
                        {#if locationResolutions[locText]?.mapsConfirmed}
                          <span class="maps-confirmed">Confirmed</span>
                        {:else}
                          <div class="maps-confirm-actions">
                            <Button
                              variant="primary"
                              size="sm"
                              on:click={() => confirmMapsUrl(locText)}
                            >
                              Confirm link
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              on:click={() => regenerateMapsUrl(locText)}
                            >
                              Regenerate
                            </Button>
                          </div>
                        {/if}
                      {:else}
                        <Button
                          variant="ghost"
                          size="sm"
                          on:click={() => generateMapsUrl(locText)}
                        >
                          Generate Maps link
                        </Button>
                      {/if}
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
            disabled={!canProceedToConfirm}
            on:click={proceedToConfirm}
          >
            Review & Confirm
          </Button>
          <Button variant="ghost" size="md" disabled={importing} on:click={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    {:else if step === 'confirm'}
      <div class="confirm-container">
        <h3 class="confirm-title">Confirm Import</h3>
        <p class="confirm-hint">
          Review the details below. Click "Import Events" to finalize.
        </p>

        <div class="confirm-summary">
          <div class="confirm-summary-row">
            <span class="confirm-label">File:</span>
            <span>{selectedFile?.name}</span>
          </div>
          <div class="confirm-summary-row">
            <span class="confirm-label">Events:</span>
            <span>{parsedEvents.length}</span>
          </div>
          <div class="confirm-summary-row">
            <span class="confirm-label">Team:</span>
            <span>{fixedTeamId ? teams.find(t => t.id === fixedTeamId)?.name ?? 'Team' : selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name ?? 'Team' : 'Public (no team)'}</span>
          </div>
        </div>

        <div class="confirm-events">
          {#each parsedEvents as event, i}
            <div class="confirm-event-row">
              <div class="confirm-event-main">
                <strong>{event.title}</strong>
                <span class="confirm-event-date">{event.date}{#if event.end_date} – {event.end_date}{/if}</span>
              </div>
              <div class="confirm-event-details">
                <span class="confirm-detail">
                  <span class="confirm-detail-label">Type:</span> {getEventTypeName(event.event_type_id)}
                </span>
                <span class="confirm-detail">
                  <span class="confirm-detail-label">Location:</span> {event.location || 'TBD'}
                  {#if event.location && unknownLocations.has(event.location.trim())}
                    ({getLocationResolutionSummary(event.location.trim())})
                  {/if}
                </span>
              </div>
            </div>
          {/each}
        </div>

        {#if hasUnconfirmedMaps}
          <Alert type="warning" message="Some Google Maps links need confirmation before importing." />
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
          <Button variant="ghost" size="md" disabled={importing} on:click={backToPreview}>
            Back
          </Button>
        </div>
      </div>
    {/if}
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

  .preview-container,
  .confirm-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
  }

  .preview-title,
  .confirm-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .confirm-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .preview-list,
  .confirm-events {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-height: 400px;
    overflow-y: auto;
  }

  .preview-item {
    padding: var(--spacing-sm);
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .preview-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .preview-date {
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    white-space: nowrap;
  }

  .preview-item-type {
    max-width: 280px;
  }

  .event-type-label {
    display: block;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xxs);
  }

  .preview-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }

  .confirm-summary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-md);
  }

  .confirm-summary-row {
    display: flex;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
  }

  .confirm-label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    min-width: 80px;
  }

  .confirm-event-row {
    padding: var(--spacing-sm);
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .confirm-event-main {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
  }

  .confirm-event-date {
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
  }

  .confirm-event-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xxs);
    text-align: right;
    font-size: var(--font-size-xs);
  }

  .confirm-detail-label {
    color: var(--color-text-muted);
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

  .maps-preview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-sm);
  }

  .maps-preview-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
  }

  .maps-link {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    word-break: break-all;
    text-decoration: underline;
  }

  .maps-confirmed {
    font-size: var(--font-size-xs);
    color: var(--color-success);
    font-weight: var(--font-weight-medium);
  }

  .maps-confirm-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  @media (max-width: 640px) {
    .create-fields {
      grid-template-columns: 1fr;
    }

    .confirm-event-row {
      flex-direction: column;
    }

    .confirm-event-details {
      text-align: left;
    }
  }
</style>
