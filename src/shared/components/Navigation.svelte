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
        <img src="/bmx-calendar.png" alt="BMX Calendar Logo" />
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
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-icon img {
    height: 5rem;
    width: auto;
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
