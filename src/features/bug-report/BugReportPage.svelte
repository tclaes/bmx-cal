<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { authStore } from '@shared/stores';
  import { bugReportService } from './bug-report.service';

  let description = '';
  let screenshotFile: File | null = null;
  let reporterEmail = '';
  let loading = false;
  let error = '';
  let success = false;

  $: user = $authStore.user;

  function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !file.type.startsWith('image/')) {
      error = 'Only image files are allowed for screenshots.';
      screenshotFile = null;
      input.value = '';
      return;
    }
    screenshotFile = file;
  }

  async function handleSubmit() {
    error = '';

    if (!description.trim()) {
      error = 'Please describe the bug before submitting.';
      return;
    }

    if (!user && !reporterEmail.trim()) {
      error = 'Please provide your email so we can follow up if needed.';
      return;
    }

    loading = true;
    try {
      await bugReportService.submitReport({
        description: description.trim(),
        screenshotFile,
        reporterEmail: user?.email ?? (reporterEmail.trim() || null),
        userId: user?.id ?? null,
      });
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to submit report. Please try again.';
    } finally {
      loading = false;
    }
  }

  function handleReset() {
    description = '';
    screenshotFile = null;
    reporterEmail = '';
    error = '';
    success = false;
  }
</script>

<div class="page-wrapper">
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">Report a Bug</h1>
      <p class="page-subtitle">
        Found something broken? Let us know and we'll get it fixed.
      </p>
    </div>

    <Card padding="lg" shadow="md">
      {#if success}
        <div class="success-state">
          <div class="success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="success-title">Report submitted</h2>
          <p class="success-desc">Thank you for helping improve the app. We'll look into it shortly.</p>
          <Button variant="primary" on:click={handleReset}>Submit another report</Button>
        </div>
      {:else}
        {#if error}
          <Alert type="danger" message={error} />
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="bug-form">
          <div class="field">
            <label class="field-label" for="description">
              Description <span class="required" aria-hidden="true">*</span>
            </label>
            <textarea
              id="description"
              class="textarea"
              rows="5"
              placeholder="Describe what happened, what you expected, and how to reproduce it..."
              bind:value={description}
              disabled={loading}
            ></textarea>
          </div>

          {#if !user}
            <div class="field">
              <Input
                type="email"
                id="reporter-email"
                label="Your email"
                placeholder="you@example.com"
                bind:value={reporterEmail}
                disabled={loading}
              />
              <p class="field-hint">So we can follow up if needed.</p>
            </div>
          {/if}

          <div class="field">
            <label class="field-label" for="screenshot">
              Screenshot <span class="optional">(optional)</span>
            </label>
            <div class="file-input-wrapper">
              <input
                id="screenshot"
                type="file"
                accept="image/*"
                class="file-input"
                on:change={handleFileChange}
                disabled={loading}
              />
              <div class="file-input-display">
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="file-input-text">
                  {screenshotFile ? screenshotFile.name : 'Click to upload a screenshot'}
                </span>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit report'}
            </Button>
          </div>
        </form>
      {/if}
    </Card>
  </div>
</div>

<style>
  .page-wrapper {
    min-height: calc(100vh - 120px);
    background-color: var(--color-bg-secondary);
    padding: var(--spacing-2xl) var(--spacing-lg);
  }

  .page-container {
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .page-header {
    text-align: center;
  }

  .page-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .bug-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .field-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .required {
    color: var(--color-error, #dc2626);
  }

  .optional {
    font-weight: var(--font-weight-normal);
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
  }

  .textarea {
    width: 100%;
    padding: 0.625rem 0.75rem;
    font-size: var(--font-size-sm);
    font-family: inherit;
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    resize: vertical;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
  }

  .textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .field-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: 0;
  }

  .file-input-wrapper {
    position: relative;
    cursor: pointer;
  }

  .file-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
  }

  .file-input:disabled {
    cursor: not-allowed;
  }

  .file-input-display {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm, 4px);
    background-color: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    transition: border-color 0.15s ease, background-color 0.15s ease;
  }

  .file-input-wrapper:hover .file-input-display {
    border-color: var(--color-primary);
    background-color: var(--color-bg-primary);
  }

  .upload-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }

  .file-input-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border);
  }

  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-2xl) var(--spacing-lg);
    text-align: center;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    color: var(--color-success, #16a34a);
  }

  .success-icon svg {
    width: 100%;
    height: 100%;
  }

  .success-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .success-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  @media (max-width: 640px) {
    .page-wrapper {
      padding: var(--spacing-lg) var(--spacing-md);
    }
  }
</style>
