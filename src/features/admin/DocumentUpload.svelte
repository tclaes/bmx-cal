<script lang="ts">
  import { FileUpload, Button, Alert, LoadingSpinner } from '@shared/components';
  import { toUserMessage } from '@shared/utils/error-message';
  import { importStore, authStore } from '@shared/stores';
  import { ImportService } from '@shared/services';
  import { parseFile, getSupportedFileTypes } from '@shared/utils';
  import type { ParsedEvent } from '@types';

  let selectedFile: File | null = null;
  let parsedEvents: ParsedEvent[] = [];
  let error = '';
  let success = '';
  let parsing = false;
  let importing = false;

  async function handleFileSelected(event: CustomEvent<File>) {
    selectedFile = event.detail;
    error = '';
    success = '';
    parsedEvents = [];

    try {
      parsing = true;
      parsedEvents = await parseFile(selectedFile);
      success = `Successfully parsed ${parsedEvents.length} events from ${selectedFile.name}`;
    } catch (err) {
      error = toUserMessage(err, 'Failed to parse file');
      selectedFile = null;
    } finally {
      parsing = false;
    }
  }

  async function handleImport() {
    if (!selectedFile || parsedEvents.length === 0) return;

    const userId = $authStore.user?.id || '';

    try {
      importing = true;
      importStore.setUploading(true);
      error = '';
      success = '';

      const result = await ImportService.importEvents(
        parsedEvents,
        selectedFile.name,
        userId
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
    } catch (err) {
      console.error('Import error:', err);
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
  }
</script>

<div class="document-upload">
  <p class="section-description">
    Upload a CSV, Excel, iCalendar, or PDF file to bulk import events. Supported formats: CSV, XLSX, XLS, ICS, PDF
  </p>

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

      <div class="preview-actions">
        <Button variant="primary" size="md" disabled={importing} on:click={handleImport}>
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

  .preview-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }
</style>
