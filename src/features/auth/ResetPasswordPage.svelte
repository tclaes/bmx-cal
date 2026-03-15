<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Input, Button, Alert } from '@shared/components';
  import { supabase } from '@data/supabase';
  import { navigate } from '../../router';

  let password = '';
  let confirmPassword = '';
  let error = '';
  let success = false;
  let loading = false;
  let sessionReady = false;
  let sessionError = '';

  onMount(async () => {
    const searchParams = new URLSearchParams(window.location.search);
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (tokenHash && type === 'recovery') {
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });

      if (verifyErr) {
        sessionError = 'This reset link has expired. Please request a new one.';
        return;
      }

      sessionReady = true;
      return;
    }

    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || '';
      const hashType = hashParams.get('type');

      if (accessToken && hashType === 'recovery') {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionErr) {
          sessionError = 'This reset link has expired. Please request a new one.';
          return;
        }

        sessionReady = true;
        return;
      }
    }

    sessionError = 'Invalid or expired reset link.';
  });

  async function handleSubmit() {
    error = '';

    if (!password || !confirmPassword) {
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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update password';
    } finally {
      loading = false;
    }
  }
</script>

<div class="reset-container">
  <Card padding="lg" shadow="lg">
    <div class="reset-content">
      <h1 class="reset-title">Set new password</h1>
      <p class="reset-subtitle">Choose a strong password for your account</p>

      {#if sessionError}
        <div class="error-state">
          <Alert type="danger" message={sessionError} />
          <Button variant="secondary" on:click={() => navigate('/forgot-password')}>Request new link</Button>
        </div>
      {:else if success}
        <div class="success-state">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#dcfce7"/>
              <path d="M14 24L21 31L34 17" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="success-title">Password updated!</h2>
          <p class="success-message">Your password has been changed. You can now sign in with your new password.</p>
          <Button variant="primary" on:click={() => navigate('/login')}>Sign in</Button>
        </div>
      {:else if sessionReady}
        {#if error}
          <Alert type="danger" message={error} />
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="reset-form">
          <Input
            type="password"
            id="password"
            label="New password"
            placeholder="At least 8 characters"
            bind:value={password}
            required
          />

          <Input
            type="password"
            id="confirm-password"
            label="Confirm new password"
            placeholder="Repeat your new password"
            bind:value={confirmPassword}
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      {:else}
        <div class="loading-state">
          <p class="loading-text">Verifying reset link...</p>
        </div>
      {/if}
    </div>
  </Card>
</div>

<style>
  .reset-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-md);
    background-color: var(--color-bg-secondary);
  }

  .reset-content {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .reset-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    text-align: center;
  }

  .reset-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }

  .reset-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .error-state {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
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

  .loading-state {
    text-align: center;
    padding: var(--spacing-lg) 0;
  }

  .loading-text {
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
