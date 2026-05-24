<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

  onMount(() => {
    document.title = $t.faq.docTitle;
  });
</script>

<article class="faq-page">
  <div class="container">
    <header class="faq-header">
      <span class="eyebrow">{$t.faq.eyebrow}</span>
      <h1>{$t.faq.heading}</h1>
      <p class="lead">{$t.faq.lead}</p>
    </header>

    <section class="faq-section">
      <h2 class="section-title">{$t.faq.sectionGettingStarted}</h2>

      <details class="faq-item">
        <summary>{$t.faq.q1Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q1Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q2Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q2Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q3Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q3Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q4Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q4Answer}</p>
        </div>
      </details>
    </section>

    <section class="faq-section">
      <h2 class="section-title">{$t.faq.sectionRaceDay}</h2>

      <details class="faq-item">
        <summary>{$t.faq.q5Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q5Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q6Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q6Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q7Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q7Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q8Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q8Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q9Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q9Answer}</p>
        </div>
      </details>
    </section>

    <section class="faq-section">
      <h2 class="section-title">{$t.faq.sectionLicensing}</h2>

      <details class="faq-item">
        <summary>{$t.faq.q10Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q10Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q11Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q11Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q12Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q12Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q13Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q13Answer}</p>
        </div>
      </details>
    </section>

    <section class="faq-section">
      <h2 class="section-title">{$t.faq.sectionRankings}</h2>

      <details class="faq-item">
        <summary>{$t.faq.q14Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q14Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q15Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q15Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q16Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q16Answer}</p>
        </div>
      </details>

      <details class="faq-item">
        <summary>{$t.faq.q17Summary}</summary>
        <div class="faq-answer">
          <p>{$t.faq.q17Answer}</p>
        </div>
      </details>
    </section>

    <section class="cta-section">
      <h2>{$t.faq.ctaTitle}</h2>
      <p>{$t.faq.ctaBody}</p>
      <div class="cta-actions">
        <button class="btn-primary" on:click={() => navigate('/')}>{$t.faq.ctaCalendar}</button>
        <button class="btn-secondary" on:click={() => navigate('/guide')}>{$t.faq.ctaGuide}</button>
      </div>
    </section>
  </div>
</article>

<style>
  .faq-page {
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

  .faq-header {
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

  .faq-header h1 {
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

  .faq-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .section-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: var(--line-height-tight);
    margin-block-end: var(--spacing-sm);
    padding-block-end: var(--spacing-xs);
    border-block-end: 2px solid var(--color-primary-light);
  }

  .faq-item {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    transition: border-color var(--transition-fast);
  }

  .faq-item[open] {
    border-color: var(--color-primary-light);
  }

  .faq-item summary {
    padding-block: var(--spacing-md);
    padding-inline: var(--spacing-lg);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-md);
    line-height: var(--line-height-tight);
    transition: color var(--transition-fast);
  }

  .faq-item summary::-webkit-details-marker {
    display: none;
  }

  .faq-item summary::after {
    content: '+';
    flex-shrink: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
    transition: transform var(--transition-fast), color var(--transition-fast);
  }

  .faq-item[open] summary::after {
    content: '\2212';
    color: var(--color-primary);
  }

  .faq-item summary:hover {
    color: var(--color-primary);
  }

  .faq-answer {
    padding-block: 0 var(--spacing-lg);
    padding-inline: var(--spacing-lg);
    border-block-start: 1px solid var(--color-border);
    margin-block-start: 0;
  }

  .faq-answer p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    padding-block-start: var(--spacing-md);
    margin: 0;
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
    .faq-header h1 {
      font-size: var(--font-size-3xl);
    }

    .faq-item summary {
      padding-inline: var(--spacing-md);
    }

    .faq-answer {
      padding-inline: var(--spacing-md);
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
