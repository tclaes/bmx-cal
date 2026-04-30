<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../router';
  import { t, interpolate } from '../../i18n';

  $: demoEvents = [
    { date: 'Apr 12', title: $t.myEventsDemo.demoEvent1Title, location: $t.myEventsDemo.demoEvent1Location, type: $t.myEventsDemo.demoEvent1Type, selected: true },
    { date: 'May 03', title: $t.myEventsDemo.demoEvent2Title, location: $t.myEventsDemo.demoEvent2Location, type: $t.myEventsDemo.demoEvent2Type, selected: true },
    { date: 'May 17', title: $t.myEventsDemo.demoEvent3Title, location: $t.myEventsDemo.demoEvent3Location, type: $t.myEventsDemo.demoEvent3Type, selected: false },
    { date: 'Jun 07', title: $t.myEventsDemo.demoEvent4Title, location: $t.myEventsDemo.demoEvent4Location, type: $t.myEventsDemo.demoEvent4Type, selected: true },
    { date: 'Jun 21', title: $t.myEventsDemo.demoEvent5Title, location: $t.myEventsDemo.demoEvent5Location, type: $t.myEventsDemo.demoEvent5Type, selected: false },
    { date: 'Jul 05', title: $t.myEventsDemo.demoEvent6Title, location: $t.myEventsDemo.demoEvent6Location, type: $t.myEventsDemo.demoEvent6Type, selected: true },
  ];

  $: benefits = [
    $t.myEventsDemo.benefit1,
    $t.myEventsDemo.benefit2,
    $t.myEventsDemo.benefit3,
    $t.myEventsDemo.benefit4,
  ];

  $: selectedCount = demoEvents.filter(e => e.selected).length;

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
        <ul class="event-list">
          {#each demoEvents as event}
            <li class="event" class:event--selected={event.selected}>
              <span class="check" aria-hidden="true">
                {#if event.selected}
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4" /></svg>
                {/if}
              </span>
              <span class="event-date">{event.date}</span>
              <span class="event-main">
                <span class="event-title">{event.title}</span>
                <span class="event-meta">{event.location} &middot; {event.type}</span>
              </span>
            </li>
          {/each}
        </ul>
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
    background: linear-gradient(145deg, #f0f7ff 0%, #e8f2ff 100%);
    border-color: var(--color-primary-light);
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

  .event-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .event {
    display: grid;
    grid-template-columns: 24px 60px 1fr;
    gap: var(--spacing-sm);
    align-items: center;
    padding-block: var(--spacing-sm);
    padding-inline: var(--spacing-sm);
    border-radius: var(--border-radius-md);
    border: 1px solid transparent;
    transition: background-color var(--transition-fast), border-color var(--transition-fast);
  }

  .event--selected {
    background-color: var(--color-primary-light);
    border-color: var(--color-primary-light);
  }

  .check {
    inline-size: 20px;
    block-size: 20px;
    border-radius: var(--border-radius-sm);
    border: 2px solid var(--color-border);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .event--selected .check {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .event-date {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .event-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-inline-size: 0;
  }

  .event-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .event-meta {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
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
    color: white;
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
    background-color: var(--color-primary);
    color: white;
    border: 2px solid var(--color-primary);
  }

  .btn--primary:hover {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
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

    .event {
      grid-template-columns: 20px 50px 1fr;
    }
  }
</style>
