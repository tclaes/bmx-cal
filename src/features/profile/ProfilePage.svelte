<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { authStore } from '@shared/stores';
  import { AuthService } from '@shared/services';
  import { supabase } from '@data/supabase';
  import { navigate } from '../../router';

  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  let passwordError = '';
  let passwordSuccess = '';
  let passwordLoading = false;

  let deleteConfirmEmail = '';
  let deleteError = '';
  let deleteLoading = false;
  let showDeleteConfirm = false;

  $: user = $authStore.user;

  async function handleChangePassword() {
    passwordError = '';
    passwordSuccess = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError = 'Please fill in all fields';
      return;
    }

    if (newPassword.length < 6) {
      passwordError = 'New password must be at least 6 characters';
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError = 'New passwords do not match';
      return;
    }

    try {
      passwordLoading = true;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        passwordError = 'Current password is incorrect';
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      passwordSuccess = 'Password updated successfully';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err) {
      passwordError = err instanceof Error ? err.message : 'Failed to update password';
    } finally {
      passwordLoading = false;
    }
  }

  async function handleDeleteAccount() {
    deleteError = '';

    if (deleteConfirmEmail !== user?.email) {
      deleteError = 'Email does not match your account email';
      return;
    }

    try {
      deleteLoading = true;
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;

      await AuthService.logout();
      authStore.logout();
      navigate('/');
    } catch (err) {
      deleteError = err instanceof Error ? err.message : 'Failed to delete account';
    } finally {
      deleteLoading = false;
    }
  }
</script>

<div class="profile-container">
  <div class="profile-content">
    <div class="profile-header">
      <h1 class="profile-title">Profile</h1>
      <p class="profile-email">{user?.email}</p>
    </div>

    <Card padding="lg" shadow="md">
      <h2 class="section-title">Change password</h2>

      {#if passwordError}
        <Alert type="danger" message={passwordError} />
      {/if}
      {#if passwordSuccess}
        <Alert type="success" message={passwordSuccess} />
      {/if}

      <form on:submit|preventDefault={handleChangePassword} class="form">
        <Input
          type="password"
          id="current-password"
          label="Current password"
          placeholder="Enter current password"
          bind:value={currentPassword}
          required
        />
        <Input
          type="password"
          id="new-password"
          label="New password"
          placeholder="At least 6 characters"
          bind:value={newPassword}
          required
        />
        <Input
          type="password"
          id="confirm-password"
          label="Confirm new password"
          placeholder="Repeat new password"
          bind:value={confirmPassword}
          required
        />
        <Button type="submit" variant="primary" disabled={passwordLoading}>
          {passwordLoading ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </Card>

    <Card padding="lg" shadow="md">
      <h2 class="section-title section-title--danger">Delete account</h2>
      <p class="delete-warning">
        This action is permanent and cannot be undone. All your data, including saved calendars and event selections, will be deleted.
      </p>

      {#if !showDeleteConfirm}
        <Button variant="danger" on:click={() => (showDeleteConfirm = true)}>
          Delete my account
        </Button>
      {:else}
        {#if deleteError}
          <Alert type="danger" message={deleteError} />
        {/if}
        <form on:submit|preventDefault={handleDeleteAccount} class="form">
          <Input
            type="email"
            id="delete-confirm-email"
            label="Type your email address to confirm"
            placeholder={user?.email}
            bind:value={deleteConfirmEmail}
            required
          />
          <div class="delete-actions">
            <Button variant="ghost" on:click={() => { showDeleteConfirm = false; deleteConfirmEmail = ''; deleteError = ''; }}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Permanently delete account'}
            </Button>
          </div>
        </form>
      {/if}
    </Card>
  </div>
</div>

<style>
  .profile-container {
    min-height: 100vh;
    background-color: var(--color-bg-secondary);
    padding: var(--spacing-2xl) var(--spacing-md);
  }

  .profile-content {
    max-width: 560px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .profile-header {
    text-align: center;
  }

  .profile-title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-xs);
  }

  .profile-email {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .section-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-lg);
  }

  .section-title--danger {
    color: var(--color-danger);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .delete-warning {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-lg);
    line-height: var(--line-height-normal);
  }

  .delete-actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }
</style>
