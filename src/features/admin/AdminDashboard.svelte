<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button } from '@shared/components';
  import { authStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import DocumentUpload from './DocumentUpload.svelte';

  let showUpload = true;

  async function handleLogout() {
    await AuthService.logout();
    authStore.logout();
  }
</script>

<div class="admin-dashboard">
  <div class="dashboard-header">
    <div class="header-content">
      <h1 class="dashboard-title">Admin Dashboard</h1>
      {#if $authStore.user}
        <p class="user-info">Logged in as {$authStore.user.email}</p>
      {/if}
    </div>
    <Button variant="ghost" size="md" on:click={handleLogout}>
      Logout
    </Button>
  </div>

  <div class="dashboard-content">
    <Card padding="lg" shadow="md">
      <DocumentUpload />
    </Card>
  </div>
</div>

<style>
  .admin-dashboard {
    min-height: 100vh;
    padding: var(--spacing-xl) var(--spacing-md);
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .dashboard-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .user-info {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .dashboard-title {
      font-size: var(--font-size-3xl);
    }
  }
</style>
