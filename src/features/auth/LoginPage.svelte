<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { AuthService } from '@shared/services';
  import { authStore } from '@shared/stores';
  import { navigate } from '../../router';

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
      authStore.setUser(user);
      navigate('/my-events');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <Card padding="lg" shadow="lg">
    <div class="login-content">
      <h1 class="login-title">Sign in</h1>
      <p class="login-subtitle">Access your personal BMX calendar</p>

      {#if error}
        <Alert type="danger" message={error} />
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="login-form">
        <Input
          type="email"
          id="email"
          label="Email"
          placeholder="you@example.com"
          bind:value={email}
          required
        />

        <Input
          type="password"
          id="password"
          label="Password"
          placeholder="Your password"
          bind:value={password}
          required
        />

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p class="register-hint">
        No account yet?
        <button class="link-btn" on:click={() => navigate('/register')}>Create one</button>
      </p>
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

  .register-hint {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    text-align: center;
    margin: 0;
  }

  .link-btn {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
  }

  .link-btn:hover {
    opacity: 0.8;
  }
</style>
