<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { AuthService } from '@shared/services';
  import { authStore } from '@shared/stores';
  import { supabase } from '@data/supabase';
  import { navigate } from '../../router';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let loading = false;

  async function handleSubmit() {
    error = '';

    if (!email || !password || !confirmPassword) {
      error = 'Please fill in all fields';
      return;
    }

    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
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
      error = err instanceof Error ? err.message : 'Registration failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="register-container">
  <Card padding="lg" shadow="lg">
    <div class="register-content">
      <div class="beta-badge">Beta</div>
      <h1 class="register-title">Create an account</h1>
      <p class="register-subtitle">Save your event selections across devices</p>

      {#if error}
        <Alert type="danger" message={error} />
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="register-form">
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
          placeholder="At least 8 characters"
          bind:value={password}
          required
        />

        <Input
          type="password"
          id="confirm-password"
          label="Confirm password"
          placeholder="Repeat your password"
          bind:value={confirmPassword}
          required
        />

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p class="login-hint">
        Already have an account?
        <button class="link-btn" on:click={() => navigate('/admin/login')}>Sign in</button>
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
