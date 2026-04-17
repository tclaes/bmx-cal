<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { AuthService } from '@shared/services';
  import { authStore } from '@shared/stores';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';

    if (!email || !password) {
      error = $t.common.fillAllFields;
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
      <h1 class="login-title">{$t.auth.signInTitle}</h1>
      <p class="login-subtitle">{$t.auth.signInSubtitle}</p>

      {#if error}
        <Alert type="danger" message={error} />
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="login-form">
        <Input
          type="email"
          id="email"
          label={$t.common.email}
          placeholder={$t.common.emailPlaceholder}
          bind:value={email}
          required
        />

        <Input
          type="password"
          id="password"
          label={$t.common.password}
          placeholder={$t.auth.passwordPlaceholder}
          bind:value={password}
          required
        />

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
          {loading ? $t.auth.signingIn : $t.auth.signInTitle}
        </Button>
      </form>

      <p class="forgot-hint">
        <button class="link-btn" on:click={() => navigate('/forgot-password')}>{$t.auth.forgotPassword}</button>
      </p>

      <p class="register-hint">
        {$t.auth.noAccount}
        <button class="link-btn" on:click={() => navigate('/register')}>{$t.auth.createOne}</button>
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

  .forgot-hint {
    font-size: 0.875rem;
    text-align: center;
    margin: 0;
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
