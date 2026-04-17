<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { AuthService } from '@shared/services';
  import { authStore } from '@shared/stores';
  import { supabase } from '@data/supabase';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';

    if (!email || !password || !confirmPassword) {
      error = $t.common.fillAllFields;
      return;
    }

    if (password !== confirmPassword) {
      error = $t.common.passwordsDoNotMatch;
      return;
    }

    if (password.length < 8) {
      error = $t.common.passwordMinLength;
      return;
    }

    try {
      loading = true;
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      await AuthService.login(email, password);
      const user = await AuthService.getCurrentUser();
      authStore.setUser(user);
      navigate('/my-events');
    } catch (err) {
      error = err instanceof Error ? err.message : $t.auth.registrationFailed;
    } finally {
      loading = false;
    }
  }
</script>

<div class="register-container">
  <Card padding="lg" shadow="lg">
    <div class="register-content">
      <div class="beta-badge">Beta</div>
      <h1 class="register-title">{$t.auth.createAccountTitle}</h1>
      <p class="register-subtitle">{$t.auth.createAccountSubtitle}</p>

      {#if error}
        <Alert type="danger" message={error} />
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="register-form">
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
          placeholder={$t.auth.newPasswordPlaceholder}
          bind:value={password}
          required
        />

        <Input
          type="password"
          id="confirm-password"
          label={$t.common.confirmPassword}
          placeholder={$t.auth.confirmPasswordPlaceholder}
          bind:value={confirmPassword}
          required
        />

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
          {loading ? $t.auth.creatingAccount : $t.auth.createAccount}
        </Button>
      </form>

      <p class="login-hint">
        {$t.auth.alreadyHaveAccount}
        <button class="link-btn" on:click={() => navigate('/admin/login')}>{$t.auth.signInTitle}</button>
      </p>
    </div>
  </Card>
</div>

<style>
  .register-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-secondary);
  }

  .register-content {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .beta-badge {
    align-self: flex-start;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 20px;
    padding: 0.2rem 0.6rem;
  }

  .register-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    text-align: center;
  }

  .register-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .register-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .login-hint {
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
