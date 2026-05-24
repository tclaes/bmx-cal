<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

  onMount(() => {
    document.title = $t.tracks.docTitle;
  });

  $: tracks = [
    { name: $t.tracks.desselName, location: $t.tracks.desselLocation, description: $t.tracks.desselDesc },
    { name: $t.tracks.ravelsName, location: $t.tracks.ravelsLocation, description: $t.tracks.ravelsDesc },
    { name: $t.tracks.zolderName, location: $t.tracks.zolderLocation, description: $t.tracks.zolderDesc },
    { name: $t.tracks.gentName, location: $t.tracks.gentLocation, description: $t.tracks.gentDesc },
    { name: $t.tracks.blegnyName, location: $t.tracks.blegnyLocation, description: $t.tracks.blegnyDesc },
    { name: $t.tracks.westerloName, location: $t.tracks.westerloLocation, description: $t.tracks.westerloDesc },
    { name: $t.tracks.turnhoutName, location: $t.tracks.turnhoutLocation, description: $t.tracks.turnhoutDesc },
    { name: $t.tracks.molName, location: $t.tracks.molLocation, description: $t.tracks.molDesc },
    { name: $t.tracks.baisieuxName, location: $t.tracks.baisieuxLocation, description: $t.tracks.baisieuxDesc },
    { name: $t.tracks.lessinesName, location: $t.tracks.lessinesLocation, description: $t.tracks.lessinesDesc },
    { name: $t.tracks.aalstName, location: $t.tracks.aalstLocation, description: $t.tracks.aalstDesc },
    { name: $t.tracks.mechelenName, location: $t.tracks.mechelenLocation, description: $t.tracks.mechelenDesc },
    { name: $t.tracks.leuvenName, location: $t.tracks.leuvenLocation, description: $t.tracks.leuvenDesc },
    { name: $t.tracks.hobokenName, location: $t.tracks.hobokenLocation, description: $t.tracks.hobokenDesc },
    { name: $t.tracks.mortselName, location: $t.tracks.mortselLocation, description: $t.tracks.mortselDesc },
  ];
</script>

<article class="tracks-page">
  <div class="container">
    <header class="tracks-header">
      <span class="eyebrow">{$t.tracks.eyebrow}</span>
      <h1>{$t.tracks.heading}</h1>
      <p class="lead">{$t.tracks.lead}</p>
    </header>

    <section class="intro-section">
      <h2>{$t.tracks.introTitle}</h2>
      <p>{$t.tracks.introP1}</p>
      <p>{$t.tracks.introP2}</p>
      <p>{$t.tracks.introP3}</p>
    </section>

    <section class="features-section">
      <h2>{$t.tracks.featuresTitle}</h2>
      <p>{$t.tracks.featuresIntro}</p>
      <dl class="features-list">
        <dt>{$t.tracks.featureStartHill}</dt>
        <dd>{$t.tracks.featureStartHillDesc}</dd>
        <dt>{$t.tracks.featureStraights}</dt>
        <dd>{$t.tracks.featureStraightsDesc}</dd>
        <dt>{$t.tracks.featureJumps}</dt>
        <dd>{$t.tracks.featureJumpsDesc}</dd>
        <dt>{$t.tracks.featureBerms}</dt>
        <dd>{$t.tracks.featureBermsDesc}</dd>
        <dt>{$t.tracks.featureGate}</dt>
        <dd>{$t.tracks.featureGateDesc}</dd>
        <dt>{$t.tracks.featureFinish}</dt>
        <dd>{$t.tracks.featureFinishDesc}</dd>
      </dl>
    </section>

    <section class="tracks-section">
      <h2>{$t.tracks.listTitle}</h2>
      <p>{$t.tracks.listIntro}</p>
      <div class="tracks-grid">
        {#each tracks as track}
          <div class="track-card">
            <h3 class="track-name">{track.name}</h3>
            <span class="track-location">{track.location}</span>
            <p class="track-description">{track.description}</p>
          </div>
        {/each}
      </div>
    </section>

    <section class="cta-section">
      <h2>{$t.tracks.ctaTitle}</h2>
      <p>{$t.tracks.ctaBody}</p>
      <div class="cta-actions">
        <button class="btn-primary" on:click={() => navigate('/')}>{$t.tracks.ctaCalendar}</button>
        <button class="btn-secondary" on:click={() => navigate('/guide')}>{$t.tracks.ctaGuide}</button>
      </div>
    </section>
  </div>
</article>

<style>
  .tracks-page {
    padding-block: var(--spacing-2xl);
    padding-inline: var(--spacing-lg);
    min-height: 60vh;
  }

  .container {
    max-width: 960px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .tracks-header {
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

  .tracks-header h1 {
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

  .intro-section h2,
  .features-section h2,
  .tracks-section h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  .intro-section p,
  .features-section p,
  .tracks-section > p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-block-end: var(--spacing-md);
  }

  .features-list {
    display: grid;
    gap: var(--spacing-md);
    margin-block-start: var(--spacing-lg);
  }

  .features-list dt {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    font-size: var(--font-size-base);
  }

  .features-list dd {
    margin-inline-start: 0;
    padding-inline-start: var(--spacing-md);
    border-inline-start: 3px solid var(--color-primary-light);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    margin-block-end: var(--spacing-sm);
  }

  .tracks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-lg);
    margin-block-start: var(--spacing-lg);
  }

  .track-card {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    transition: border-color var(--transition-fast);
  }

  .track-card:hover {
    border-color: var(--color-primary);
  }

  .track-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
    margin: 0;
  }

  .track-location {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .track-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: var(--line-height-relaxed);
    margin: 0;
    margin-block-start: var(--spacing-xs);
  }

  .cta-section {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
    text-align: center;
  }

  .cta-section h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  .cta-section p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-block-end: var(--spacing-md);
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
    .tracks-header h1 {
      font-size: var(--font-size-3xl);
    }

    .tracks-grid {
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
