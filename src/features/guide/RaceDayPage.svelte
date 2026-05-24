<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

  onMount(() => {
    document.title = $t.raceDay.docTitle;
  });
</script>

<article class="raceday-page">
  <div class="container">
    <header class="raceday-header">
      <span class="eyebrow">{$t.raceDay.eyebrow}</span>
      <h1>{$t.raceDay.heading}</h1>
      <p class="lead">{$t.raceDay.lead}</p>
    </header>

    <nav class="toc" aria-label={$t.raceDay.tocLabel}>
      <h2 class="toc-title">{$t.raceDay.tocTitle}</h2>
      <ol>
        <li><a href="#before-race-day">{$t.raceDay.beforeTitle}</a></li>
        <li><a href="#arrival-warmup">{$t.raceDay.arrivalTitle}</a></li>
        <li><a href="#race-format">{$t.raceDay.formatTitle}</a></li>
        <li><a href="#nutrition">{$t.raceDay.nutritionTitle}</a></li>
        <li><a href="#post-race">{$t.raceDay.postRaceTitle}</a></li>
        <li><a href="#parents-tips">{$t.raceDay.parentsTitle}</a></li>
        <li><a href="#weather">{$t.raceDay.weatherTitle}</a></li>
      </ol>
    </nav>

    <section id="before-race-day">
      <h2>{$t.raceDay.beforeTitle}</h2>
      <p>{$t.raceDay.beforeIntro}</p>

      <h3>{$t.raceDay.nightBeforeHeading}</h3>
      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nightBefore1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nightBefore2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nightBefore3}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nightBefore4}</span>
        </li>
      </ul>

      <h3>{$t.raceDay.bikeCheckHeading}</h3>
      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.bikeCheck1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.bikeCheck2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.bikeCheck3}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.bikeCheck4}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.bikeCheck5}</span>
        </li>
      </ul>

      <h3>{$t.raceDay.packingHeading}</h3>
      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing3}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing4}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing5}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing6}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.packing7}</span>
        </li>
      </ul>
    </section>

    <section id="arrival-warmup">
      <h2>{$t.raceDay.arrivalTitle}</h2>
      <p>{$t.raceDay.arrivalIntro}</p>

      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-number">1</div>
          <div class="timeline-content">
            <h4>{$t.raceDay.timelineArriveHeading}</h4>
            <p>{$t.raceDay.timelineArriveDesc}</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-number">2</div>
          <div class="timeline-content">
            <h4>{$t.raceDay.timelineSignInHeading}</h4>
            <p>{$t.raceDay.timelineSignInDesc}</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-number">3</div>
          <div class="timeline-content">
            <h4>{$t.raceDay.timelinePracticeHeading}</h4>
            <p>{$t.raceDay.timelinePracticeDesc}</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-number">4</div>
          <div class="timeline-content">
            <h4>{$t.raceDay.timelineWarmupHeading}</h4>
            <p>{$t.raceDay.timelineWarmupDesc}</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-number">5</div>
          <div class="timeline-content">
            <h4>{$t.raceDay.timelineStagingHeading}</h4>
            <p>{$t.raceDay.timelineStagingDesc}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="race-format">
      <h2>{$t.raceDay.formatTitle}</h2>
      <p>{$t.raceDay.formatIntro}</p>

      <div class="format-grid">
        <div class="format-card">
          <h4>{$t.raceDay.motosHeading}</h4>
          <p>{$t.raceDay.motosDesc}</p>
        </div>
        <div class="format-card">
          <h4>{$t.raceDay.semisHeading}</h4>
          <p>{$t.raceDay.semisDesc}</p>
        </div>
        <div class="format-card">
          <h4>{$t.raceDay.finalsHeading}</h4>
          <p>{$t.raceDay.finalsDesc}</p>
        </div>
      </div>

      <p>{$t.raceDay.formatGateNote}</p>
      <p>{$t.raceDay.formatPointsNote}</p>
    </section>

    <section id="nutrition">
      <h2>{$t.raceDay.nutritionTitle}</h2>
      <p>{$t.raceDay.nutritionIntro}</p>

      <h3>{$t.raceDay.nutritionBeforeHeading}</h3>
      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nutritionBefore1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nutritionBefore2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nutritionBefore3}</span>
        </li>
      </ul>

      <h3>{$t.raceDay.nutritionDuringHeading}</h3>
      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nutritionDuring1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nutritionDuring2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.nutritionDuring3}</span>
        </li>
      </ul>

      <h3>{$t.raceDay.hydrationHeading}</h3>
      <p>{$t.raceDay.hydrationDesc}</p>
    </section>

    <section id="post-race">
      <h2>{$t.raceDay.postRaceTitle}</h2>
      <p>{$t.raceDay.postRaceIntro}</p>

      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.postRace1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.postRace2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.postRace3}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.postRace4}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.postRace5}</span>
        </li>
      </ul>
    </section>

    <section id="parents-tips">
      <h2>{$t.raceDay.parentsTitle}</h2>
      <p>{$t.raceDay.parentsIntro}</p>

      <ul class="checklist">
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.parentsTip1}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.parentsTip2}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.parentsTip3}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.parentsTip4}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.parentsTip5}</span>
        </li>
        <li>
          <span class="checklist-icon" aria-hidden="true">&#9745;</span>
          <span>{$t.raceDay.parentsTip6}</span>
        </li>
      </ul>
    </section>

    <section id="weather">
      <h2>{$t.raceDay.weatherTitle}</h2>
      <p>{$t.raceDay.weatherIntro}</p>

      <div class="weather-grid">
        <div class="weather-card">
          <h4>{$t.raceDay.weatherRainHeading}</h4>
          <p>{$t.raceDay.weatherRainDesc}</p>
        </div>
        <div class="weather-card">
          <h4>{$t.raceDay.weatherColdHeading}</h4>
          <p>{$t.raceDay.weatherColdDesc}</p>
        </div>
        <div class="weather-card">
          <h4>{$t.raceDay.weatherHeatHeading}</h4>
          <p>{$t.raceDay.weatherHeatDesc}</p>
        </div>
        <div class="weather-card">
          <h4>{$t.raceDay.weatherWindHeading}</h4>
          <p>{$t.raceDay.weatherWindDesc}</p>
        </div>
      </div>

      <p>{$t.raceDay.weatherTip}</p>
    </section>

    <section class="cta-section">
      <h2>{$t.raceDay.ctaTitle}</h2>
      <p>{$t.raceDay.ctaBody}</p>
      <div class="cta-actions">
        <button class="btn-primary" on:click={() => navigate('/')}>{$t.raceDay.ctaCalendar}</button>
        <button class="btn-secondary" on:click={() => navigate('/guide')}>{$t.raceDay.ctaGuide}</button>
      </div>
    </section>
  </div>
</article>

<style>
  .raceday-page {
    padding-block: var(--spacing-2xl);
    padding-inline: var(--spacing-lg);
    min-height: 60vh;
  }

  .container {
    max-width: 800px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  /* Header */
  .raceday-header {
    text-align: center;
    padding-block-end: var(--spacing-lg);
    border-block-end: 1px solid var(--color-border);
  }

  .eyebrow {
    display: inline-block;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    background-color: var(--color-primary-light);
    padding-block: 2px;
    padding-inline: var(--spacing-sm);
    border-radius: var(--border-radius-full);
    margin-block-end: var(--spacing-sm);
  }

  .raceday-header h1 {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
    margin: 0 0 var(--spacing-md);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    max-width: 640px;
    margin-inline: auto;
  }

  /* Table of Contents */
  .toc {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
  }

  .toc-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-md);
  }

  .toc ol {
    list-style: decimal;
    padding-inline-start: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .toc a {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
    font-size: var(--font-size-sm);
  }

  .toc a:hover {
    color: var(--color-primary-dark, #1d4ed8);
  }

  /* Section headings */
  section h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  section h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    margin-block-start: var(--spacing-lg);
    margin-block-end: var(--spacing-sm);
    line-height: var(--line-height-tight);
  }

  section h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-xs);
  }

  section p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-block-end: var(--spacing-md);
  }

  /* Checklist */
  .checklist {
    list-style: none;
    padding-inline-start: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-block-end: var(--spacing-md);
  }

  .checklist li {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .checklist-icon {
    flex-shrink: 0;
    color: var(--color-primary);
    font-size: var(--font-size-lg);
    line-height: 1.4;
  }

  /* Timeline */
  .timeline {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-inline-start: var(--spacing-sm);
    margin-block: var(--spacing-lg);
  }

  .timeline-item {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
    position: relative;
  }

  .timeline-item:not(:last-child)::after {
    content: '';
    position: absolute;
    inset-inline-start: 17px;
    inset-block-start: 36px;
    width: 2px;
    height: calc(100% + var(--spacing-md));
    background-color: var(--color-primary-light);
  }

  .timeline-number {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    border-radius: var(--border-radius-full);
    background-color: var(--color-primary);
    color: white;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .timeline-content {
    padding-block-start: var(--spacing-xs);
    flex: 1;
  }

  .timeline-content h4 {
    margin-block-end: var(--spacing-xs);
  }

  .timeline-content p {
    margin-block-end: 0;
    font-size: var(--font-size-sm);
  }

  /* Format grid */
  .format-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-md);
    margin-block: var(--spacing-lg);
  }

  .format-card {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
  }

  .format-card h4 {
    color: var(--color-primary);
    margin-block-end: var(--spacing-xs);
  }

  .format-card p {
    font-size: var(--font-size-sm);
    margin-block-end: 0;
  }

  /* Weather grid */
  .weather-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--spacing-md);
    margin-block: var(--spacing-lg);
  }

  .weather-card {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    padding: var(--spacing-md);
  }

  .weather-card h4 {
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-xs);
  }

  .weather-card p {
    font-size: var(--font-size-sm);
    margin-block-end: 0;
  }

  /* CTA section */
  .cta-section {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
    text-align: center;
  }

  .cta-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
    margin-block-start: var(--spacing-lg);
  }

  .btn-primary {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--color-primary);
    color: white;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--border-radius-md);
    border: none;
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-secondary {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: transparent;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .btn-secondary:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .raceday-header h1 {
      font-size: var(--font-size-3xl);
    }

    .format-grid,
    .weather-grid {
      grid-template-columns: 1fr;
    }

    .cta-actions {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
    }
  }
</style>
