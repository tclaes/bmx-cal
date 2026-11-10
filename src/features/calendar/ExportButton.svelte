<script lang="ts">
  import { generateICalContent, downloadICalFile } from '@shared/utils';
  import Button from '@ui/Button.svelte';
  import { visibleEvents } from './visible-events';
  import { t } from '../../i18n';

  function handleExportClick() {
    const content = generateICalContent($visibleEvents);
    downloadICalFile(content, 'bmx-events.ics');
  }
</script>

<Button variant="secondary" on:click={handleExportClick}>
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M14 10v2.667A1.333 1.333 0 0112.667 14H3.333A1.333 1.333 0 012 12.667V10M11.333 5.333L8 2m0 0L4.667 5.333M8 2v8"/>
  </svg>
  {$t.calendar.exportCalendar}
</Button>
