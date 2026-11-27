<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { RaceRow } from '@ui';
  import { getRaceView, isPlainLeftClick } from '@shared/utils';
  import type { EventWithDetails } from '@types';
  import { t } from '../../i18n';

  /** One calendar race as a timeline row; shared by the upcoming and previous-races lists. */
  export let event: EventWithDetails;
  export let saved: boolean;
  export let headingLevel: 3 | 4 = 3;

  const dispatch = createEventDispatcher<{ save: void; navigate: string }>();

  $: view = getRaceView(event, $t);

  function handleClick(e: MouseEvent) {
    if (!isPlainLeftClick(e)) return;
    e.preventDefault();
    dispatch('navigate', view.href);
  }
</script>

<RaceRow
  {event}
  {view}
  {saved}
  {headingLevel}
  saveLabel={saved ? $t.calendar.saved : $t.calendar.save}
  registerLabel={$t.calendar.registerAction}
  livestreamLabel={$t.calendar.livestream}
  on:click={handleClick}
  on:save={() => dispatch('save')}
/>
