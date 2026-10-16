<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toUserMessage } from '@shared/utils/error-message';
  import { Card, Input, Button, Alert } from '@shared/components';
  import { AuthService } from '@shared/services';
  import { authStore } from '@shared/stores';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';

    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    try {
      loading = true;
      await AuthService.login(email, password);
      const user = await AuthService.getCurrentUser();

      if (user?.role !== 'admin') {
        error = 'Access denied. Admin privileges required.';
        await AuthService.logout();
        return;
      }

      authStore.setUser(user);
      dispatch('loginSuccess');
    } catch (err) {
      error = toUserMessage(err, 'Login failed');
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <Card padding="lg" shadow="lg">
    <div class="login-content">
      <h1 class="login-title">Admin Login</h1>
      <p class="login-subtitle">Sign in to manage BMX events</p>

      {#if error}
        <Alert type="danger" message={error} />
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="login-form">
        <Input
          type="email"
          id="email"
          label="Email"
          placeholder="admin@example.com"
          bind:value={email}
          required
        />

        <Input
          type="password"
          id="password"
          label="Password"
          placeholder="Enter your password"
          bind:value={password}
          required
        />

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  </Card>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-secondary);
  }

  .login-content {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .login-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    text-align: center;
  }

  .login-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
</style>
