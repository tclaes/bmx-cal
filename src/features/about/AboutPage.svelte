<script lang="ts">
  import { navigate } from '../../router';
  import { t } from '../../i18n';
</script>

<div class="about-page">
  <div class="container">
    <section class="hero">
      <h1>{$t.about.title}</h1>
      <p class="lead">
        {$t.about.lead}
      </p>
    </section>

    <section class="section">
      <h2>{$t.about.whatIsTitle}</h2>
      <p>{$t.about.whatIsPara1}</p>
      <p>{$t.about.whatIsPara2}</p>
    </section>

    <section class="section section--highlight">
      <div class="highlight-content">
        <div class="highlight-text">
          <h2>{$t.about.builtForTeamsTitle}</h2>
          <p>{$t.about.builtForTeamsPara1}</p>
          <p>{$t.about.builtForTeamsPara2}</p>
          <button class="btn-primary" on:click={() => navigate('/get-in-touch')}>
            {$t.about.getInTouchCta}
          </button>
        </div>
        <div class="highlight-visual">
          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">&#9711;</span>
              <div>
                <strong>{$t.about.teamEventManagement}</strong>
                <span>{$t.about.teamEventManagementDesc}</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">&#9711;</span>
              <div>
                <strong>{$t.about.memberCoordination}</strong>
                <span>{$t.about.memberCoordinationDesc}</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-icon">&#9711;</span>
              <div>
                <strong>{$t.about.dedicatedDashboard}</strong>
                <span>{$t.about.dedicatedDashboardDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>{$t.about.questionsTitle}</h2>
      <p>{$t.about.questionsPara}</p>
      <div class="cta-row">
        <button class="btn-primary" on:click={() => navigate('/get-in-touch')}>
          {$t.about.contactUs}
        </button>
        <button class="btn-secondary" on:click={() => navigate('/report-bug')}>
          {$t.about.reportBug}
        </button>
      </div>
    </section>
  </div>
</div>

<style>
  .about-page {
    padding: var(--spacing-2xl) var(--spacing-lg);
    min-height: 60vh;
  }

  .container {
    max-width: 860px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
  }

  .hero {
    text-align: center;
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .hero h1 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    max-width: 640px;
    margin: 0 auto;
  }

  .section h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  .section p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-md);
  }

  .section p:last-child {
    margin-bottom: 0;
  }

  .section--highlight {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
  }

  .highlight-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-xl);
    align-items: start;
  }

  .highlight-text p {
    margin-bottom: var(--spacing-md);
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .feature-item {
    display: flex;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .feature-icon {
    font-size: var(--font-size-xl);
    color: var(--color-primary);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .feature-item div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .feature-item strong {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .feature-item span {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    line-height: var(--line-height-normal);
  }

  .cta-row {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    margin-top: var(--spacing-lg);
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--color-primary);
    color: white;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    margin-top: var(--spacing-lg);
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: transparent;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .btn-secondary:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  @media (max-width: 640px) {
    .hero h1 {
      font-size: var(--font-size-3xl);
    }

    .highlight-content {
      grid-template-columns: 1fr;
    }

    .section--highlight {
      padding: var(--spacing-lg);
    }

    .cta-row {
      flex-direction: column;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }
  }
</style>
