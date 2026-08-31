<script lang="ts">
  import { navigate } from '../../router';
  import { t } from '../../i18n';
</script>

<aside class="account-cta" aria-label={$t.cta.title}>
  <div class="cta-badge">{$t.cta.badge}</div>
  <h2 class="cta-title">{$t.cta.title}</h2>
  <p class="cta-description">
    {$t.cta.description}
  </p>

  <ul class="cta-benefits" aria-label="Account benefits">
    <li>{$t.cta.benefit1}</li>
    <li>{$t.cta.benefit2}</li>
    <li>
      <span class="benefit-text">{$t.cta.benefit3}</span>
      <span class="benefit-badge">{$t.cta.benefit3Badge}</span>
    </li>
  </ul>

  <div class="cta-actions">
    <button
      class="cta-btn cta-btn--primary"
      on:click={() => navigate('/register')}
    >
      {$t.cta.createAccount}
    </button>
    <button
      class="cta-btn cta-btn--ghost"
      on:click={() => navigate('/login')}
    >
      {$t.cta.signIn}
    </button>
  </div>

</aside>

<style>
  .account-cta {
    background: linear-gradient(145deg, #f0f7ff 0%, #e8f2ff 100%);
    border: 1px solid var(--color-primary-light);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .cta-badge {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    background-color: var(--color-success-light);
    color: var(--color-success);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px var(--spacing-sm);
    border-radius: var(--border-radius-full);
    border: 1px solid #a7f3d0;
  }

  .cta-title {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--line-height-tight);
  }

  .cta-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: var(--line-height-normal);
  }

  .cta-benefits {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .cta-benefits li {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    padding-inline-start: var(--spacing-md);
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .benefit-badge {
    display: inline-flex;
    align-items: center;
    background-color: var(--color-success-light);
    color: var(--color-success);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 1px var(--spacing-xs);
    border-radius: var(--border-radius-full);
    border: 1px solid #a7f3d0;
  }

  .cta-benefits li::before {
    content: '✓';
    position: absolute;
    inset-inline-start: 0;
    color: var(--color-success);
    font-weight: var(--font-weight-bold);
  }

  .cta-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .cta-btn {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: center;
  }

  .cta-btn--primary {
    background-color: var(--color-primary);
    color: #ffffff;
    border: 2px solid var(--color-primary);
  }

  .cta-btn--primary:hover {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .cta-btn--ghost {
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
  }

  .cta-btn--ghost:hover {
    background-color: var(--color-primary-light);
  }

</style>
