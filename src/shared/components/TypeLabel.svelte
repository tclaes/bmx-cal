<script lang="ts">
  import { getRaceTypeKey, getRaceTypeCode } from '../utils/race-type';

  /** Event type name ("European Cup") or code ("EC"). */
  export let type: string | null | undefined = '';

  $: key = getRaceTypeKey(type);
  $: code = getRaceTypeCode(type);
</script>

<span class="type-label type-{key}" title={type ?? ''}>{code}</span>

<style>
  .type-label {
    display: inline-block;
    padding: var(--spacing-xxs) var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-sm);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    line-height: var(--line-height-normal);
    text-transform: uppercase;
    background-color: var(--race-unknown-bg);
    color: var(--race-unknown-fg);
  }

  .type-cv { background-color: var(--race-cv-bg); color: var(--race-cv-fg); }
  .type-tc { background-color: var(--race-tc-bg); color: var(--race-tc-fg); }
  .type-cw { background-color: var(--race-cw-bg); color: var(--race-cw-fg); }
  .type-3nc { background-color: var(--race-3nc-bg); color: var(--race-3nc-fg); }
  .type-ec { background-color: var(--race-ec-bg); color: var(--race-ec-fg); }
  .type-wc { background-color: var(--race-wc-bg); color: var(--race-wc-fg); }
</style>
