<script lang="ts">
  import type { RegistrationState } from '../utils/registration-status';

  /** Derived from getRegistrationStatus(); this component never computes dates. */
  export let state: RegistrationState;
  export let label = '';
</script>

<span class="start-light start-light-{state}" role="img" aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
  <span class="lamp"></span>
  <span class="lamp"></span>
  <span class="lamp"></span>
</span>

<style>
  .start-light {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-full);
    background-color: var(--color-bg-tertiary);
  }

  .lamp {
    width: 10px;
    height: 10px;
    border-radius: var(--border-radius-full);
    background-color: var(--color-border);
  }

  /* open / register: all lamps green */
  .start-light-open .lamp,
  .start-light-register .lamp {
    background-color: var(--color-start-green);
  }

  /* opens soon: first lamps orange, still waiting */
  .start-light-soon .lamp:nth-child(-n + 2) {
    background-color: var(--color-accent);
  }

  /* closed: all lamps off (default) */
</style>
