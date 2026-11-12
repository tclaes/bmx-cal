<script lang="ts">
  import { getRaceTypeKey, getRaceTypeCode } from '@shared/utils';

  /** Event type name ("European Cup") or code ("EC"). */
  export let type: string | null | undefined = '';

  $: key = getRaceTypeKey(type);
  $: code = getRaceTypeCode(type);
</script>

<span class="type-label type-{key}" title={type ?? ''}>
  <span class="code">{code}</span>
  <span class="stripe" aria-hidden="true"></span>
</span>

<style>
  .type-label {
    display: inline-flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: var(--border-radius-sm);
    font-family: var(--font-family-heading);
    font-size: var(--font-size-sm);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.06em;
    line-height: var(--line-height-normal);
    text-align: center;
    text-transform: uppercase;
    background-color: var(--race-unknown-bg);
    color: var(--race-unknown-fg);
  }

  .code {
    padding: var(--spacing-xxs) var(--spacing-sm);
  }

  .stripe {
    block-size: 3px;
    background: var(--race-unknown-stripe);
  }

  .type-cv {
    background-color: var(--race-cv-bg);
    color: var(--race-cv-fg);
  }
  .type-cv .stripe { background: var(--race-cv-stripe); }

  .type-tc {
    background-color: var(--race-tc-bg);
    color: var(--race-tc-fg);
  }
  .type-tc .stripe { background: var(--race-tc-stripe); }

  .type-cw {
    background-color: var(--race-cw-bg);
    color: var(--race-cw-fg);
  }
  .type-cw .stripe { background: var(--race-cw-stripe); }

  .type-3nc {
    background-color: var(--race-3nc-bg);
    color: var(--race-3nc-fg);
  }
  .type-3nc .stripe { background: var(--race-3nc-stripe); }

  .type-ec {
    background-color: var(--race-ec-bg);
    color: var(--race-ec-fg);
  }
  .type-ec .stripe { background: var(--race-ec-stripe); }

  .type-wc {
    background-color: var(--race-wc-bg);
    color: var(--race-wc-fg);
  }
  .type-wc .stripe { background: var(--race-wc-stripe); }
</style>
