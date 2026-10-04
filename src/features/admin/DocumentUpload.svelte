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
  let step: 'edit' | 'confirm' = 'edit';
  let currentEventIndex = 0;

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

  let publicEventTypes: EventType[] = [];
  let selectedTeamId = fixedTeamId ?? '';

  $: user = $authStore.user;
  $: showTeamSelector = isAdmin && !fixedTeamId;
  $: teamOptions = [
    { value: '', label: 'Public (no team)' },
    ...teams.map(t => ({ value: t.id, label: t.name })),
  ];

  $: availableEventTypes = fixedTeamId
    ? allEventTypes.filter(et => et.team_id === fixedTeamId || et.team_id === null)
    : selectedTeamId
      ? allEventTypes.filter(et => et.team_id === selectedTeamId || et.team_id === null)
      : publicEventTypes;

  $: eventTypeOptions = [
    { value: '', label: '-- Select type --' },
    ...availableEventTypes.map(et => ({ value: et.id, label: et.name })),
  ];

  $: currentEvent = parsedEvents[currentEventIndex] ?? null;

  $: locationSelectOptions = allLocations.map(loc => ({ value: loc.id, label: loc.name }));

  async function handleFileSelected(event: CustomEvent<File>) {
    selectedFile = event.detail;
    error = '';
    success = '';
    parsedEvents = [];
    unknownLocations = new Map();
    locationResolutions = {};
    currentEventIndex = 0;
    step = 'edit';

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

  function matchEventType(rawType: string): string | undefined {
    const trimmed = rawType.toLowerCase().trim();
    if (!trimmed) return undefined;

    const exact = availableEventTypes.find(et => et.name.toLowerCase() === trimmed);
    if (exact) return exact.id;

    const partial = availableEventTypes.find(et => {
      const etName = et.name.toLowerCase();
      return trimmed.includes(etName) || etName.includes(trimmed);
    });
    if (partial) return partial.id;

    const words = trimmed.split(/\s+/).filter(w => w.length >= 3);
    const wordMatch = availableEventTypes.find(et => {
      const etWords = et.name.toLowerCase().split(/\s+/);
      return words.some(w => etWords.some(ew => ew.includes(w) || w.includes(ew)));
    });
    if (wordMatch) return wordMatch.id;

    return undefined;
  }

  function assignDefaultEventTypeIds() {
    for (const event of parsedEvents) {
      if (event.event_type) {
        const matched = matchEventType(event.event_type);
        if (matched) {
          event.event_type_id = matched;
          continue;
        }
      }
      if (event.event_type_id && availableEventTypes.some(et => et.id === event.event_type_id)) {
        continue;
      }
      event.event_type_id = availableEventTypes[0]?.id ?? '';
    }
  }

  function setEventTypeForCurrent(eventTypeId: string) {
    if (currentEvent) {
      parsedEvents[currentEventIndex] = { ...currentEvent, event_type_id: eventTypeId };
      parsedEvents = parsedEvents;
    }
  }

  function updateCurrentEvent(field: keyof ParsedEvent, value: string) {
    if (currentEvent) {
      parsedEvents[currentEventIndex] = { ...currentEvent, [field]: value };
      parsedEvents = parsedEvents;
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
        locationResolutions[locationText] = { action: 'skip', mapsConfirmed: false };
      }
    }

    unknownLocations = unknowns;
  }

  $: currentLocationText = currentEvent?.location?.trim() ?? '';
  $: currentLocationIsUnknown = currentLocationText !== '' && unknownLocations.has(currentLocationText);

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

  $: currentEventReady = currentEvent && (currentEvent.event_type_id || '') !== '' &&
    (!currentLocationIsUnknown ||
     locationResolutions[currentLocationText]?.action !== 'match' ||
     locationResolutions[currentLocationText]?.locationId);

  function setResolutionAction(locationText: string, action: 'match' | 'create' | 'skip') {
    const existing = locationResolutions[locationText];
    locationResolutions[locationText] = { ...existing, action, mapsConfirmed: action === 'create' ? false : (existing?.mapsConfirmed ?? false) };
    if (action === 'create') {
      generateMapsUrl(locationText);
    }
    locationResolutions = { ...locationResolutions };
  }

  function setMatchLocation(locationText: string, locationId: string) {
    locationResolutions[locationText] = { ...locationResolutions[locationText], action: 'match', locationId };
    locationResolutions = { ...locationResolutions };
  }

  function setCreateLocationField(locationText: string, field: 'newName' | 'city' | 'address' | 'country', value: string) {
    locationResolutions[locationText] = {
      ...locationResolutions[locationText],
      action: 'create',
      [field]: value,
      mapsConfirmed: false,
    };
    locationResolutions = { ...locationResolutions };
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
    locationResolutions = { ...locationResolutions };
  }

  function confirmMapsUrl(locationText: string) {
    const r = locationResolutions[locationText];
    if (!r) return;
    generateMapsUrl(locationText);
    locationResolutions[locationText] = { ...locationResolutions[locationText], mapsConfirmed: true };
    locationResolutions = { ...locationResolutions };
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
    locationResolutions = { ...locationResolutions };
  }

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

  function goToEvent(index: number) {
    if (index >= 0 && index < parsedEvents.length) {
      currentEventIndex = index;
    }
  }

  function nextEvent() {
    if (currentEventIndex < parsedEvents.length - 1) {
      currentEventIndex++;
    }
  }

  function prevEvent() {
    if (currentEventIndex > 0) {
      currentEventIndex--;
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

  function backToEdit() {
    step = 'edit';
  }

  function jumpToEvent(index: number) {
    currentEventIndex = index;
    step = 'edit';
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
      currentEventIndex = 0;
      step = 'edit';
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
    currentEventIndex = 0;
    step = 'edit';
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

  function isEventComplete(index: number): boolean {
    const event = parsedEvents[index];
    if (!event) return false;
    if (!event.event_type_id) return false;
    const locText = event.location?.trim();
    if (locText && unknownLocations.has(locText)) {
      const r = locationResolutions[locText];
      if (r?.action === 'match' && !r.locationId) return false;
    }
    return true;
  }

  $: completedCount = parsedEvents.filter((_, i) => isEventComplete(i)).length;
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
    {#if step === 'edit'}
      <div class="editor-container">
        <div class="editor-header">
          <div class="editor-header-left">
            <h3 class="editor-title">Event {currentEventIndex + 1} of {parsedEvents.length}</h3>
            <span class="progress-pill">{completedCount}/{parsedEvents.length} complete</span>
          </div>
          <Button variant="ghost" size="sm" on:click={handleCancel} disabled={importing}>
            Cancel
          </Button>
        </div>

        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: {((currentEventIndex + 1) / parsedEvents.length) * 100}%"></div>
        </div>

        {#if currentEvent}
          <div class="event-card" class:complete={isEventComplete(currentEventIndex)}>
            <div class="event-card-header">
              <div class="event-card-title-row">
                <Input
                  label="Title"
                  value={currentEvent.title}
                  on:input={(e) => updateCurrentEvent('title', e.currentTarget.value)}
                />
              </div>
              <div class="event-card-dates">
                <Input
                  label="Date"
                  type="date"
                  value={currentEvent.date}
                  on:input={(e) => updateCurrentEvent('date', e.currentTarget.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={currentEvent.end_date ?? ''}
                  on:input={(e) => updateCurrentEvent('end_date', e.currentTarget.value)}
                />
              </div>
              <div class="event-card-dates">
                <Input
                  label="Start Time"
                  type="time"
                  value={currentEvent.start_time ?? ''}
                  on:input={(e) => updateCurrentEvent('start_time', e.currentTarget.value)}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={currentEvent.end_time ?? ''}
                  on:input={(e) => updateCurrentEvent('end_time', e.currentTarget.value)}
                />
              </div>
            </div>

            <div class="event-card-body">
              <div class="field-group">
                <label class="field-label" for="event-type-select">Event type</label>
                <Select
                  id="event-type-select"
                  value={currentEvent.event_type_id ?? ''}
                  options={eventTypeOptions}
                  on:change={(e) => setEventTypeForCurrent(e.currentTarget.value)}
                />
              </div>

              <div class="field-group">
                <label class="field-label" for="event-location-input">Location</label>
                <Input
                  id="event-location-input"
                  value={currentEvent.location ?? ''}
                  placeholder="Location name"
                  on:input={(e) => updateCurrentEvent('location', e.currentTarget.value)}
                />
              </div>

              {#if currentLocationIsUnknown}
                <div class="location-resolution-inline">
                  <div class="resolution-notice">
                    <span class="resolution-notice-icon">!</span>
                    <span>This location was not found in the database. Choose how to handle it.</span>
                  </div>

                  <div class="resolution-tabs">
                    <button
                      class="resolution-tab"
                      class:active={locationResolutions[currentLocationText]?.action === 'match'}
                      on:click={() => setResolutionAction(currentLocationText, 'match')}
                    >
                      Match existing
                    </button>
                    <button
                      class="resolution-tab"
                      class:active={locationResolutions[currentLocationText]?.action === 'create'}
                      on:click={() => setResolutionAction(currentLocationText, 'create')}
                    >
                      Create new
                    </button>
                    <button
                      class="resolution-tab"
                      class:active={locationResolutions[currentLocationText]?.action === 'skip'}
                      on:click={() => setResolutionAction(currentLocationText, 'skip')}
                    >
                      Skip
                    </button>
                  </div>

                  {#if locationResolutions[currentLocationText]?.action === 'match'}
                    <Select
                      value={locationResolutions[currentLocationText]?.locationId ?? ''}
                      options={locationSelectOptions}
                      placeholder="Select a location"
                      on:change={(e) => setMatchLocation(currentLocationText, e.currentTarget.value)}
                    />
                  {:else if locationResolutions[currentLocationText]?.action === 'create'}
                    <div class="create-fields">
                      <Input
                        label="Location name"
                        value={locationResolutions[currentLocationText]?.newName ?? currentLocationText}
                        on:input={(e) => setCreateLocationField(currentLocationText, 'newName', e.currentTarget.value)}
                      />
                      <Input
                        label="City"
                        value={locationResolutions[currentLocationText]?.city ?? ''}
                        on:input={(e) => setCreateLocationField(currentLocationText, 'city', e.currentTarget.value)}
                      />
                      <Input
                        label="Address"
                        value={locationResolutions[currentLocationText]?.address ?? ''}
                        on:input={(e) => setCreateLocationField(currentLocationText, 'address', e.currentTarget.value)}
                      />
                      <Input
                        label="Country"
                        value={locationResolutions[currentLocationText]?.country ?? ''}
                        on:input={(e) => setCreateLocationField(currentLocationText, 'country', e.currentTarget.value)}
                      />
                    </div>
                    <div class="maps-preview">
                      <div class="maps-preview-label">Google Maps link:</div>
                      {#if locationResolutions[currentLocationText]?.mapsUrl}
                        <a
                          href={locationResolutions[currentLocationText]?.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="maps-link"
                        >
                          {locationResolutions[currentLocationText]?.mapsUrl}
                        </a>
                        {#if locationResolutions[currentLocationText]?.mapsConfirmed}
                          <span class="maps-confirmed">Confirmed</span>
                        {:else}
                          <div class="maps-confirm-actions">
                            <Button
                              variant="primary"
                              size="sm"
                              on:click={() => confirmMapsUrl(currentLocationText)}
                            >
                              Confirm link
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              on:click={() => regenerateMapsUrl(currentLocationText)}
                            >
                              Regenerate
                            </Button>
                          </div>
                        {/if}
                      {:else}
                        <Button
                          variant="ghost"
                          size="sm"
                          on:click={() => generateMapsUrl(currentLocationText)}
                        >
                          Generate Maps link
                        </Button>
                      {/if}
                    </div>
                  {:else if locationResolutions[currentLocationText]?.action === 'skip'}
                    <p class="resolution-skip-hint">This event will be imported without a linked location.</p>
                  {/if}
                </div>
              {/if}

              <div class="field-group">
                <label class="field-label" for="event-desc-input">Description</label>
                <textarea
                  id="event-desc-input"
                  class="event-desc"
                  value={currentEvent.description ?? ''}
                  placeholder="Optional description"
                  on:input={(e) => updateCurrentEvent('description', e.currentTarget.value)}
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>
        {/if}

        <div class="event-nav-dots">
          {#each parsedEvents as _, i}
            <button
              class="nav-dot"
              class:active={i === currentEventIndex}
              class:done={isEventComplete(i)}
              on:click={() => goToEvent(i)}
              aria-label="Go to event {i + 1}"
            >
              {i + 1}
            </button>
          {/each}
        </div>

        <div class="editor-actions">
          <Button
            variant="ghost"
            size="md"
            on:click={prevEvent}
            disabled={currentEventIndex === 0}
          >
            Previous
          </Button>
          {#if currentEventIndex < parsedEvents.length - 1}
            <Button
              variant="primary"
              size="md"
              on:click={nextEvent}
            >
              Next Event
            </Button>
          {:else}
            <Button
              variant="primary"
              size="md"
              on:click={proceedToConfirm}
              disabled={!canProceedToConfirm}
            >
              Review & Confirm
            </Button>
          {/if}
        </div>
      </div>
    {:else if step === 'confirm'}
      <div class="confirm-container">
        <h3 class="confirm-title">Confirm Import</h3>
        <p class="confirm-hint">
          Review the details below. Click any event to edit it, or click "Import Events" to finalize.
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
            <button class="confirm-event-row" on:click={() => jumpToEvent(i)}>
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
              <span class="confirm-edit-hint">Edit</span>
            </button>
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
          <Button variant="ghost" size="md" disabled={importing} on:click={backToEdit}>
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

  /* Event editor */
  .editor-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .editor-header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .editor-title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .progress-pill {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 20px;
    padding: 0.15rem 0.5rem;
    white-space: nowrap;
  }

  .progress-bar {
    height: 4px;
    background: var(--color-bg-primary);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }

  .event-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
  }

  .event-card.complete {
    border-color: var(--color-success);
  }

  .event-card-header {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding-bottom: var(--spacing-sm);
    border-bottom: 1px solid var(--color-border);
  }

  .event-card-dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  .event-card-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .field-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }

  .event-desc {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    font-family: inherit;
    font-size: var(--font-size-sm);
    resize: vertical;
    box-sizing: border-box;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .event-desc:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  /* Location resolution inline */
  .location-resolution-inline {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
  }

  .resolution-notice {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .resolution-notice-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-warning, #f59e0b);
    color: white;
    font-size: 12px;
    font-weight: bold;
    flex-shrink: 0;
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
    background-color: var(--color-bg-primary);
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

  .resolution-skip-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
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
    background-color: var(--color-bg-primary);
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

  /* Navigation dots */
  .event-nav-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    padding: var(--spacing-xs) 0;
  }

  .nav-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--color-border);
    background: var(--color-bg-primary);
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nav-dot:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .nav-dot.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .nav-dot.done {
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .nav-dot.done.active {
    background: var(--color-success);
    color: white;
  }

  .editor-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
    margin-top: var(--spacing-xs);
  }

  /* Confirm step */
  .confirm-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-secondary);
    border-radius: var(--border-radius-lg);
  }

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

  .confirm-events {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    max-height: 400px;
    overflow-y: auto;
  }

  .confirm-event-row {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-primary);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--spacing-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: border-color 0.15s ease;
    text-align: left;
    width: 100%;
  }

  .confirm-event-row:hover {
    border-color: var(--color-primary);
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

  .confirm-edit-hint {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
  }

  .preview-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }

  @media (max-width: 640px) {
    .create-fields,
    .event-card-dates {
      grid-template-columns: 1fr;
    }

    .confirm-event-row {
      flex-direction: column;
    }

    .confirm-event-details {
      text-align: left;
    }

    .editor-actions {
      flex-direction: column-reverse;
    }
  }
</style>
