<script lang="ts">
  import type { RegistrationState } from '@shared/utils/registration-state';

  /** Derived from getRegistrationStatus(); this component never computes dates. */
  export let state: RegistrationState;
  export let label = '';
</script>

<span class="start-light start-light-{state}" role="img" aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
  <span class="lamp lamp-red"></span>
  <span class="lamp lamp-amber"></span>
  <span class="lamp lamp-amber"></span>
  <span class="lamp lamp-green"></span>
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
    inline-size: 10px;
    block-size: 10px;
    border-radius: var(--border-radius-full);
    background-color: var(--color-border);
  }

  /* open / register: green lamp lit */
  .start-light-open .lamp-green,
  .start-light-register .lamp-green {
    background-color: var(--color-start-green);
  }

  /* opens soon: amber lamps lit */
  .start-light-soon .lamp-amber {
    background-color: var(--color-accent);
  }

  /* closed: red lamp lit */
  .start-light-closed .lamp-red {
    background-color: var(--color-danger);
  }
</style>
