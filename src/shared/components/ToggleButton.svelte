<script lang="ts">
  export let expanded = false;
  export let label = '';
  export let badgeCount = 0;
  export let onToggle: () => void = () => {};
</script>

<button
  class="toggle-button"
  type="button"
  on:click={onToggle}
  aria-expanded={expanded}
>
  <span>{label}</span>
  {#if badgeCount > 0}
    <span class="badge">{badgeCount}</span>
  {/if}
  <span class="chevron" class:rotated={expanded} aria-hidden="true">&#9660;</span>
</button>

<style>
  .toggle-button {
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

  .toggle-button:hover {
    border-color: var(--color-primary);
  }

  .badge {
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

  .chevron {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  @media (max-width: 768px) {
    .toggle-button {
      display: flex;
    }
  }
</style>
