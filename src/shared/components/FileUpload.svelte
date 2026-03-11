<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let accept = '';
  export let label = 'Choose File';
  export let disabled = false;

  const dispatch = createEventDispatcher<{ fileSelected: File }>();

  let isDragging = false;
  let fileInput: HTMLInputElement;

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      dispatch('fileSelected', input.files[0]);
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    if (disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      dispatch('fileSelected', files[0]);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (!disabled) {
      isDragging = true;
    }
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleClick() {
    if (!disabled) {
      fileInput.click();
    }
  }
</script>

<div
  class="file-upload"
  class:dragging={isDragging}
  class:disabled
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:click={handleClick}
>
  <input
    type="file"
    {accept}
    {disabled}
    bind:this={fileInput}
    on:change={handleFileSelect}
    class="file-input"
  />
  <div class="upload-content">
    <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    <p class="upload-text">{label}</p>
    <p class="upload-hint">Click or drag and drop to upload</p>
  </div>
</div>

<style>
  .file-upload {
    border: 2px dashed var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-base);
  }

  .file-upload:hover:not(.disabled) {
    border-color: var(--color-primary);
    background-color: var(--color-bg-secondary);
  }

  .file-upload.dragging {
    border-color: var(--color-primary);
    background-color: var(--color-primary-light);
  }

  .file-upload.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .file-input {
    display: none;
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .upload-icon {
    color: var(--color-primary);
  }

  .upload-text {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .upload-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
</style>
