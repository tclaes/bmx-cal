<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

  onMount(() => {
    document.title = $t.guide.docTitle;
  });
</script>

<article class="guide-page">
  <div class="container">
    <header class="guide-header">
      <span class="eyebrow">{$t.guide.eyebrow}</span>
      <h1>{$t.guide.heading}</h1>
      <p class="lead">{$t.guide.lead}</p>
    </header>

    <nav class="toc" aria-label={$t.guide.tocLabel}>
      <h2 class="toc-title">{$t.guide.tocTitle}</h2>
      <ol>
        <li><a href="#what-is-bmx">{$t.guide.whatIsBmxTitle}</a></li>
        <li><a href="#event-types">{$t.guide.eventTypesTitle}</a></li>
        <li><a href="#categories">{$t.guide.categoriesTitle}</a></li>
        <li><a href="#season-structure">{$t.guide.seasonTitle}</a></li>
        <li><a href="#getting-started">{$t.guide.gettingStartedTitle}</a></li>
        <li><a href="#registration">{$t.guide.registrationTitle}</a></li>
        <li><a href="#equipment">{$t.guide.equipmentTitle}</a></li>
        <li><a href="#useful-links">{$t.guide.linksTitle}</a></li>
      </ol>
    </nav>

    <section id="what-is-bmx">
      <h2>{$t.guide.whatIsBmxTitle}</h2>
      <p>{$t.guide.whatIsBmxP1}</p>
      <p>{$t.guide.whatIsBmxP2}</p>
    </section>

    <section id="event-types">
      <h2>{$t.guide.eventTypesTitle}</h2>
      <p>{$t.guide.eventTypesIntro}</p>
      <dl class="definition-list">
        <dt>{$t.guide.eventTypeClub}</dt>
        <dd>{$t.guide.eventTypeClubDesc}</dd>
        <dt>{$t.guide.eventTypeRegional}</dt>
        <dd>{$t.guide.eventTypeRegionalDesc}</dd>
        <dt>{$t.guide.eventTypeBelgianCup}</dt>
        <dd>{$t.guide.eventTypeBelgianCupDesc}</dd>
        <dt>{$t.guide.eventTypeChampionship}</dt>
        <dd>{$t.guide.eventTypeChampionshipDesc}</dd>
        <dt>{$t.guide.eventTypeUEC}</dt>
        <dd>{$t.guide.eventTypeUECDesc}</dd>
        <dt>{$t.guide.eventTypeWorldCup}</dt>
        <dd>{$t.guide.eventTypeWorldCupDesc}</dd>
      </dl>
    </section>

    <section id="categories">
      <h2>{$t.guide.categoriesTitle}</h2>
      <p>{$t.guide.categoriesIntro}</p>
      <ul>
        <li>{$t.guide.catCruisers}</li>
        <li>{$t.guide.catBoys}</li>
        <li>{$t.guide.catGirls}</li>
        <li>{$t.guide.catJunior}</li>
        <li>{$t.guide.catElite}</li>
        <li>{$t.guide.catMasters}</li>
      </ul>
    </section>

    <section id="season-structure">
      <h2>{$t.guide.seasonTitle}</h2>
      <p>{$t.guide.seasonP1}</p>
      <p>{$t.guide.seasonP2}</p>
      <p>{$t.guide.seasonP3}</p>
    </section>

    <section id="getting-started">
      <h2>{$t.guide.gettingStartedTitle}</h2>
      <p>{$t.guide.gettingStartedP1}</p>
      <ol class="steps-list">
        <li>{$t.guide.gsStep1}</li>
        <li>{$t.guide.gsStep2}</li>
        <li>{$t.guide.gsStep3}</li>
        <li>{$t.guide.gsStep4}</li>
        <li>{$t.guide.gsStep5}</li>
      </ol>
    </section>

    <section id="registration">
      <h2>{$t.guide.registrationTitle}</h2>
      <p>{$t.guide.registrationP1}</p>
      <p>{$t.guide.registrationP2}</p>
    </section>

    <section id="equipment">
      <h2>{$t.guide.equipmentTitle}</h2>
      <p>{$t.guide.equipmentIntro}</p>
      <ul>
        <li>{$t.guide.equipHelmet}</li>
        <li>{$t.guide.equipGloves}</li>
        <li>{$t.guide.equipJersey}</li>
        <li>{$t.guide.equipPants}</li>
        <li>{$t.guide.equipShoes}</li>
        <li>{$t.guide.equipBike}</li>
      </ul>
    </section>

    <section id="useful-links">
      <h2>{$t.guide.linksTitle}</h2>
      <p>{$t.guide.linksIntro}</p>
      <ul class="links-list">
        <li><a href="https://www.belgiumcycling.be" target="_blank" rel="noopener noreferrer">Belgian Cycling</a> — {$t.guide.linkBelgianCycling}</li>
        <li><a href="https://www.cyclingvlaanderen.be" target="_blank" rel="noopener noreferrer">Cycling Vlaanderen</a> — {$t.guide.linkCyclingVlaanderen}</li>
        <li><a href="https://www.uec.ch" target="_blank" rel="noopener noreferrer">UEC</a> — {$t.guide.linkUEC}</li>
        <li><a href="https://www.uci.org/bmx-racing" target="_blank" rel="noopener noreferrer">UCI BMX Racing</a> — {$t.guide.linkUCI}</li>
      </ul>
    </section>

    <section class="cta-section">
      <h2>{$t.guide.ctaTitle}</h2>
      <p>{$t.guide.ctaBody}</p>
      <div class="cta-actions">
        <button class="btn-primary" on:click={() => navigate('/')}>{$t.guide.ctaBrowse}</button>
        <button class="btn-secondary" on:click={() => navigate('/my-events')}>{$t.guide.ctaCreate}</button>
      </div>
    </section>
  </div>
</article>

<style>
  .guide-page {
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

  .guide-header {
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

  .guide-header h1 {
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

  section h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  section p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-block-end: var(--spacing-md);
  }

  section ul,
  section ol {
    padding-inline-start: var(--spacing-lg);
    margin-block-end: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  section li {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
  }

  .definition-list {
    display: grid;
    gap: var(--spacing-md);
  }

  .definition-list dt {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
  }

  .definition-list dd {
    margin-inline-start: 0;
    padding-inline-start: var(--spacing-md);
    border-inline-start: 3px solid var(--color-primary-light);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    margin-block-end: var(--spacing-sm);
  }

  .steps-list {
    list-style: decimal;
  }

  .links-list a {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .links-list a:hover {
    color: var(--color-primary-dark, #1d4ed8);
  }

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

  @media (max-width: 640px) {
    .guide-header h1 {
      font-size: var(--font-size-3xl);
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
