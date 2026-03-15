<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { navigate } from '../../router';
  import { supabase } from '@data/supabase';

  let email = '';
  let error = '';
  let success = false;
  let loading = false;

  async function handleSubmit() {
    error = '';

    if (!email.trim()) {
      error = 'Please enter your email address';
      return;
    }

    try {
      loading = true;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email: email.trim(), appUrl: window.location.origin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Something went wrong';
    } finally {
      loading = false;
    }
  }
</script>

<div class="forgot-container">
  <Card padding="lg" shadow="lg">
    <div class="forgot-content">
      <h1 class="forgot-title">Forgot password</h1>
      <p class="forgot-subtitle">Enter your email and we'll send you a reset link</p>

      {#if success}
        <div class="success-state">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#dcfce7"/>
              <path d="M14 24L21 31L34 17" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="success-title">Check your email</h2>
          <p class="success-message">If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
          <Button variant="secondary" on:click={() => navigate('/login')}>Back to sign in</Button>
        </div>
      {:else}
        {#if error}
          <Alert type="danger" message={error} />
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="forgot-form">
          <Input
            type="email"
            id="email"
            label="Email"
            placeholder="you@example.com"
            bind:value={email}
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>

        <p class="back-hint">
          Remember your password?
          <button class="link-btn" on:click={() => navigate('/login')}>Sign in</button>
        </p>
      {/if}
    </div>
  </Card>
</div>

<style>
  .forgot-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-secondary);
  }

  .forgot-content {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .forgot-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    text-align: center;
  }

  .forgot-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .forgot-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .back-hint {
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

  .success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-md);
    text-align: center;
    padding: var(--spacing-lg) 0;
  }

  .success-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .success-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  .success-message {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: 1.6;
  }
</style>
