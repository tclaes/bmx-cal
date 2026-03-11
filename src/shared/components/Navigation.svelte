<script lang="ts">
  import { authStore } from '@shared/stores';
  import { navigate } from '../../router';

  function handleNavigate(path: string) {
    navigate(path);
  }
</script>

<nav class="navigation">
  <div class="nav-container">
    <button class="nav-brand" on:click={() => handleNavigate('/')}>
      <span class="brand-icon">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <!-- BMX Bike wheels -->
          <circle cx="25" cy="70" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <circle cx="25" cy="70" r="2" fill="currentColor"/>
          <circle cx="75" cy="70" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <circle cx="75" cy="70" r="2" fill="currentColor"/>

          <!-- Bike frame -->
          <line x1="25" y1="70" x2="50" y2="50" stroke="currentColor" stroke-width="2.5"/>
          <line x1="50" y1="50" x2="75" y2="70" stroke="currentColor" stroke-width="2.5"/>
          <line x1="50" y1="50" x2="55" y2="35" stroke="currentColor" stroke-width="2.5"/>
          <line x1="25" y1="70" x2="40" y2="55" stroke="currentColor" stroke-width="2.5"/>
          <line x1="40" y1="55" x2="55" y2="35" stroke="currentColor" stroke-width="2.5"/>

          <!-- Handlebars -->
          <line x1="55" y1="35" x2="60" y2="30" stroke="currentColor" stroke-width="2.5"/>
          <line x1="55" y1="32" x2="62" y2="32" stroke="currentColor" stroke-width="2"/>

          <!-- Seat -->
          <line x1="40" y1="55" x2="35" y2="50" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>

          <!-- Rider body leaning forward -->
          <ellipse cx="48" cy="38" rx="6" ry="7" fill="currentColor"/>
          <circle cx="48" cy="25" r="5.5" fill="currentColor"/>

          <!-- Rider arms extended -->
          <line x1="48" y1="32" x2="58" y2="30" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Rider legs -->
          <line x1="48" y1="44" x2="45" y2="58" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="48" y1="44" x2="52" y2="56" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>

          <!-- Racing number plate -->
          <rect x="40" y="34" width="14" height="10" fill="white" stroke="currentColor" stroke-width="1.5" rx="1"/>
          <text x="47" y="42" font-size="7" font-weight="bold" text-anchor="middle" fill="currentColor">148</text>
        </svg>
      </span>
      <span class="brand-text">BMX Calendar</span>
    </button>

    <div class="nav-links">
      <button class="nav-link" on:click={() => handleNavigate('/')}>
        Events
      </button>
    </div>
  </div>
</nav>

<style>
  .navigation {
    background-color: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: var(--shadow-sm);
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .brand-icon {
    font-size: var(--font-size-3xl);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-icon svg {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-primary);
  }

  .brand-text {
    display: none;
  }

  @media (min-width: 768px) {
    .brand-text {
      display: inline;
    }
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .nav-link {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius-md);
    transition: all var(--transition-base);
    cursor: pointer;
  }

  .nav-link:hover {
    color: var(--color-primary);
    background-color: var(--color-bg-secondary);
  }
</style>
