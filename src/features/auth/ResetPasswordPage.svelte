<script lang="ts">
  import { onMount } from 'svelte';
  import { toUserMessage } from '@shared/utils/error-message';
  import { Card, Input, Button, Alert } from '@shared/components';
  import { supabase } from '@data/supabase';
  import { navigate } from '../../router';
  import { t } from '../../i18n';

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
        sessionError = $t.auth.expiredLink;
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
          sessionError = $t.auth.expiredLink;
          return;
        }

        sessionReady = true;
        return;
      }
    }

    sessionError = $t.auth.invalidLink;
  });

  async function handleSubmit() {
    error = '';

    if (!password || !confirmPassword) {
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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      success = true;
    } catch (err) {
      error = toUserMessage(err, $t.profile.failedToUpdate);
    } finally {
      loading = false;
    }
  }
</script>

<div class="reset-container">
  <Card padding="lg" shadow="lg">
    <div class="reset-content">
      <h1 class="reset-title">{$t.auth.setNewPassword}</h1>
      <p class="reset-subtitle">{$t.auth.setNewPasswordSubtitle}</p>

      {#if sessionError}
        <div class="error-state">
          <Alert type="danger" message={sessionError} />
          <Button variant="secondary" on:click={() => navigate('/forgot-password')}>{$t.auth.requestNewLink}</Button>
        </div>
      {:else if success}
        <div class="success-state">
          <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#dcfce7"/>
              <path d="M14 24L21 31L34 17" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="success-title">{$t.auth.passwordUpdated}</h2>
          <p class="success-message">{$t.auth.passwordUpdatedMessage}</p>
          <Button variant="primary" on:click={() => navigate('/login')}>{$t.auth.signInTitle}</Button>
        </div>
      {:else if sessionReady}
        {#if error}
          <Alert type="danger" message={error} />
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="reset-form">
          <Input
            type="password"
            id="password"
            label={$t.auth.newPassword}
            placeholder={$t.auth.newPasswordPlaceholder}
            bind:value={password}
            required
          />

          <Input
            type="password"
            id="confirm-password"
            label={$t.auth.confirmNewPassword}
            placeholder={$t.auth.confirmNewPasswordPlaceholder}
            bind:value={confirmPassword}
            required
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? $t.common.updating : $t.common.updatePassword}
          </Button>
        </form>
      {:else}
        <div class="loading-state">
          <p class="loading-text">{$t.auth.verifyingLink}</p>
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
