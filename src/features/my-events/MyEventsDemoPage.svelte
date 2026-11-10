<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../router';
  import { t, interpolate } from '../../i18n';
  import { RaceRow } from '@ui';
  import { formatDayNumber, formatMonthShort, formatWeekday } from '@shared/utils';

  // Sample races only illustrate the page; the year is irrelevant. Type names are the
  // database names so the labels match the real calendar.
  const sample = [
    { iso: '2099-04-12', n: 1, type: 'Belgian Cycling', selected: true },
    { iso: '2099-05-03', n: 2, type: 'European Cup', selected: true },
    { iso: '2099-05-17', n: 3, type: 'Cycling Vlaanderen', selected: false },
    { iso: '2099-06-07', n: 4, type: 'Belgian Cycling', selected: true },
    { iso: '2099-06-21', n: 5, type: 'World Cup', selected: false },
    { iso: '2099-07-05', n: 6, type: 'Cycling Vlaanderen', selected: true },
  ];

  let picked = new Set(sample.filter(e => e.selected).map(e => e.n));

  function toggle(n: number) {
    const next = new Set(picked);
    next.has(n) ? next.delete(n) : next.add(n);
    picked = next;
  }

  $: demoEvents = sample.map(e => {
    const tr = $t.myEventsDemo as Record<string, string>;
    const weekday = formatWeekday(e.iso);
    return {
      n: e.n,
      type: e.type,
      day: formatDayNumber(e.iso),
      month: formatMonthShort(e.iso),
      title: tr[`demoEvent${e.n}Title`],
      meta: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${tr[`demoEvent${e.n}Location`]}`,
      selected: picked.has(e.n),
    };
  });

  $: benefits = [
    $t.myEventsDemo.benefit1,
    $t.myEventsDemo.benefit2,
    $t.myEventsDemo.benefit3,
    $t.myEventsDemo.benefit4,
  ];

  $: selectedCount = picked.size;

  onMount(() => {
    document.title = $t.myEventsDemo.docTitle;
  });

  function goRegister() {
    navigate('/register');
  }

  function goLogin() {
    navigate('/login');
  }
</script>

<div class="demo-page">
  <section class="hero">
    <div class="hero-inner">
      <span class="eyebrow">{$t.myEventsDemo.eyebrow}</span>
      <h1>{$t.myEventsDemo.heading}</h1>
      <p class="lead">{$t.myEventsDemo.lead}</p>
      <div class="hero-actions">
        <button class="btn btn--primary" on:click={goRegister}>
          {$t.cta.createAccount}
        </button>
        <button class="btn btn--ghost" on:click={goLogin}>
          {$t.cta.signIn}
        </button>
      </div>
      <p class="reassure">{$t.myEventsDemo.reassure}</p>
    </div>
  </section>

  <section class="preview" aria-label={$t.myEventsDemo.previewLabel}>
    <div class="preview-label">
      <span class="dot" aria-hidden="true"></span>
      {$t.myEventsDemo.previewLabel}
    </div>

    <div class="preview-grid">
      <div class="preview-card">
        <header class="preview-card__header">
          <h2>{$t.myEventsDemo.selectYourEvents}</h2>
          <span class="counter">{interpolate($t.myEventsDemo.selectedCount, { count: selectedCount })}</span>
        </header>
        <div class="timeline">
          {#each demoEvents as event (event.n)}
            <RaceRow
              title={event.title}
              href="/register"
              day={event.day}
              month={event.month}
              meta={event.meta}
              type={event.type}
              saved={event.selected}
              saveLabel={event.selected ? $t.calendar.saved : $t.calendar.save}
              on:click={(e) => { e.preventDefault(); goRegister(); }}
              on:save={() => toggle(event.n)}
            />
          {/each}
        </div>
      </div>

      <div class="preview-card preview-card--cta">
        <h2>{$t.myEventsDemo.readyTitle}</h2>
        <ol class="steps">
          <li><span class="step-num">1</span>{$t.myEventsDemo.step1}</li>
          <li><span class="step-num">2</span>{$t.myEventsDemo.step2}</li>
          <li><span class="step-num">3</span>{$t.myEventsDemo.step3}</li>
        </ol>

        <ul class="benefits">
          {#each benefits as benefit}
            <li>{benefit}</li>
          {/each}
        </ul>

        <button class="btn btn--primary btn--full" on:click={goRegister}>
          {$t.myEventsDemo.createCalendarCta}
        </button>
        <button class="btn btn--link" on:click={goLogin}>
          {$t.myEventsDemo.signInPrompt}
        </button>
      </div>
    </div>
  </section>

  <section class="faq" aria-label={$t.myEventsDemo.faqTitle}>
    <h2>{$t.myEventsDemo.faqTitle}</h2>
    <p>{$t.myEventsDemo.faqBody}</p>
  </section>
</div>

<style>
  .demo-page {
    max-width: 1100px;
    margin-inline: auto;
    padding-block: var(--spacing-xl);
    padding-inline: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .hero {
    text-align: center;
    padding-block: var(--spacing-xl);
  }

  .hero-inner {
    max-width: 680px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
  }

  .eyebrow {
    display: inline-block;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-success);
    background-color: var(--color-success-light);
    padding-block: 2px;
    padding-inline: var(--spacing-sm);
    border-radius: var(--border-radius-full);
  }

  .hero h1 {
    font-family: var(--font-family-heading);
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
    margin: 0;
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  .hero-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: center;
    margin-block-start: var(--spacing-sm);
  }

  .reassure {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  .preview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .preview-label {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
    align-self: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .dot {
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    background-color: var(--color-success);
    animation: pulse 1.8s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.35; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  .preview-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--spacing-lg);
  }

  .preview-card {
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    box-shadow: var(--shadow-sm);
  }

  .preview-card--cta {
    background-color: var(--hero-bg);
    background-image: var(--hero-stripe);
    border-color: var(--color-border);
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .preview-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: var(--spacing-md);
  }

  .preview-card h2 {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--line-height-tight);
  }

  .counter {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    background-color: var(--color-primary-light);
    padding-block: 2px;
    padding-inline: var(--spacing-sm);
    border-radius: var(--border-radius-full);
  }

  .timeline {
    display: flex;
    flex-direction: column;
  }

  .steps {
    list-style: none;
    counter-reset: steps;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .steps li {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .step-num {
    inline-size: 24px;
    block-size: 24px;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary);
    color: var(--color-text-on-accent);
    border-radius: 50%;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
  }

  .benefits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .benefits li {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    padding-inline-start: var(--spacing-md);
    position: relative;
  }

  .benefits li::before {
    content: '';
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0.55em;
    inline-size: 6px;
    block-size: 6px;
    border-radius: 50%;
    background-color: var(--color-primary);
  }

  .btn {
    min-block-size: var(--touch-target-min);
    padding-block: var(--spacing-sm);
    padding-inline: var(--spacing-lg);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: background-color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
  }

  .btn--full {
    inline-size: 100%;
  }

  .btn--primary {
    background-color: var(--color-accent);
    color: var(--color-text-on-accent);
    border: 2px solid var(--color-accent);
  }

  .btn--primary:hover {
    background-color: var(--color-accent-hover);
    border-color: var(--color-accent-hover);
    transform: translateY(-1px);
  }

  .btn--ghost {
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
  }

  .btn--ghost:hover {
    background-color: var(--color-primary-light);
  }

  .btn--link {
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 0;
    cursor: pointer;
  }

  .faq {
    max-width: 720px;
    margin-inline: auto;
    text-align: center;
    padding-block-end: var(--spacing-xl);
  }

  .faq h2 {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
  }

  .faq p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  @media (max-width: 768px) {
    .preview-grid {
      grid-template-columns: 1fr;
    }

    .preview-card {
      padding: var(--spacing-md);
    }
  }
</style>
