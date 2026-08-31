<script lang="ts">
  import { Card, Input, Button, Alert } from '@shared/components';
  import { authStore, updateStore, isAdmin } from '@shared/stores';
  import { AuthService, PushService } from '@shared/services';
  import { supabase } from '@data/supabase';
  import { navigate } from '../../router';
  import { APP_VERSION } from '@config/version';
  import { t, interpolate } from '../../i18n';

  let pushSupported = false;
  let pushEnabled = false;
  let pushLoading = false;
  let pushError = '';
  let pushInfo = '';
  let testLoading = false;
  let testMessage = '';
  let testSuccess = false;

  async function loadPushState() {
    pushSupported = PushService.isSupported();
    if (pushSupported) {
      pushEnabled = await PushService.isSubscribed();
    }
  }

  async function handleTogglePush() {
    pushError = '';
    pushInfo = '';

    try {
      pushLoading = true;
      if (pushEnabled) {
        await PushService.unsubscribe();
        pushEnabled = false;
      } else {
        const result = await PushService.subscribe();
        if (result) {
          pushEnabled = true;
        } else {
          pushError = $t.profile.notificationsPermissionDenied;
        }
      }
    } catch (err) {
      pushError = err instanceof Error ? err.message : $t.profile.notificationsError;
    } finally {
      pushLoading = false;
    }
  }

  async function handleSendTest() {
    testMessage = '';
    testSuccess = false;
    try {
      testLoading = true;
      const { error } = await supabase.functions.invoke('send-push-notifications', {
        body: { test: true },
      });
      if (error) throw error;
      testMessage = $t.profile.notificationsTestSent;
      testSuccess = true;
    } catch (err) {
      testMessage = err instanceof Error ? err.message : $t.profile.notificationsTestFailed;
      testSuccess = false;
    } finally {
      testLoading = false;
      setTimeout(() => { testMessage = ''; }, 5000);
    }
  }

  loadPushState();

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

  let updateCheckMessage = '';
  let updateCheckSuccess = false;

  $: user = $authStore.user;

  async function handleCheckForUpdates() {
    updateCheckMessage = '';
    updateCheckSuccess = false;

    try {
      const versionInfo = await updateStore.checkForUpdates();

      if (versionInfo.hasUpdate || $updateStore.available) {
        updateCheckMessage = $t.profile.updateAvailable;
        updateCheckSuccess = true;
      } else {
        updateCheckMessage = $t.profile.latestVersion;
        updateCheckSuccess = true;
      }
    } catch (err) {
      updateCheckMessage = $t.profile.updateFailed;
      updateCheckSuccess = false;
    }

    setTimeout(() => {
      updateCheckMessage = '';
    }, 5000);
  }

  async function handleChangePassword() {
    passwordError = '';
    passwordSuccess = '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError = $t.common.fillAllFields;
      return;
    }

    if (newPassword.length < 8) {
      passwordError = $t.profile.newPasswordMinLength;
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError = $t.profile.newPasswordsDoNotMatch;
      return;
    }

    try {
      passwordLoading = true;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        passwordError = $t.profile.incorrectPassword;
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      passwordSuccess = $t.profile.passwordUpdatedSuccess;
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err) {
      passwordError = err instanceof Error ? err.message : $t.profile.failedToUpdate;
    } finally {
      passwordLoading = false;
    }
  }

  async function handleDeleteAccount() {
    deleteError = '';

    if (deleteConfirmEmail !== user?.email) {
      deleteError = $t.profile.emailDoesNotMatch;
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
      deleteError = err instanceof Error ? err.message : $t.profile.failedToDelete;
    } finally {
      deleteLoading = false;
    }
  }
</script>

<div class="profile-container">
  <div class="profile-content">
    <div class="profile-header">
      <h1 class="profile-title">{$t.profile.title}</h1>
      <p class="profile-email">{user?.email}</p>
    </div>

    <Card padding="lg" shadow="md">
      <h2 class="section-title">{$t.profile.appVersion}</h2>
      <p class="version-info">{interpolate($t.profile.currentVersion, { version: APP_VERSION })}</p>

      {#if updateCheckMessage}
        <Alert type={updateCheckSuccess ? 'success' : 'danger'} message={updateCheckMessage} />
      {/if}

      <Button variant="secondary" on:click={handleCheckForUpdates} disabled={$updateStore.checking}>
        {$updateStore.checking ? $t.common.checking : $t.profile.checkForUpdates}
      </Button>
    </Card>

    <Card padding="lg" shadow="md">
      <h2 class="section-title">{$t.profile.notificationsTitle}</h2>

      {#if pushSupported}
        <p class="notifications-description">{$t.profile.notificationsDescription}</p>

        {#if pushError}
          <Alert type="danger" message={pushError} />
        {/if}

        <div class="notifications-toggle">
          <Button
            variant={pushEnabled ? 'secondary' : 'primary'}
            on:click={handleTogglePush}
            disabled={pushLoading}
          >
            {#if pushLoading}
              {pushEnabled ? $t.profile.notificationsDisabling : $t.profile.notificationsEnabling}
            {:else if pushEnabled}
              {$t.profile.notificationsEnabled}
            {:else}
              {$t.profile.notificationsEnable}
            {/if}
          </Button>
        </div>

        {#if pushEnabled && $isAdmin}
          <div class="notifications-test">
            {#if testMessage}
              <Alert type={testSuccess ? 'success' : 'danger'} message={testMessage} />
            {/if}
            <Button variant="secondary" on:click={handleSendTest} disabled={testLoading}>
              {testLoading ? $t.profile.notificationsTestSending : $t.profile.notificationsSendTest}
            </Button>
          </div>
        {/if}

        <p class="notifications-info">{$t.profile.notificationsInfo}</p>
      {:else}
        <p class="notifications-unsupported">{$t.profile.notificationsUnsupported}</p>
      {/if}
    </Card>

    <Card padding="lg" shadow="md">
      <h2 class="section-title">{$t.profile.changePassword}</h2>

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
          label={$t.profile.currentPassword}
          placeholder={$t.profile.currentPasswordPlaceholder}
          bind:value={currentPassword}
          required
        />
        <Input
          type="password"
          id="new-password"
          label={$t.auth.newPassword}
          placeholder={$t.profile.newPasswordPlaceholder}
          bind:value={newPassword}
          required
        />
        <Input
          type="password"
          id="confirm-password"
          label={$t.profile.repeatNewPassword}
          placeholder={$t.auth.confirmNewPasswordPlaceholder}
          bind:value={confirmPassword}
          required
        />
        <Button type="submit" variant="primary" disabled={passwordLoading}>
          {passwordLoading ? $t.common.updating : $t.common.updatePassword}
        </Button>
      </form>
    </Card>

    <Card padding="lg" shadow="md">
      <h2 class="section-title section-title--danger">{$t.profile.deleteAccount}</h2>
      <p class="delete-warning">
        {$t.profile.deleteWarning}
      </p>

      {#if !showDeleteConfirm}
        <Button variant="danger" on:click={() => (showDeleteConfirm = true)}>
          {$t.profile.deleteMyAccount}
        </Button>
      {:else}
        {#if deleteError}
          <Alert type="danger" message={deleteError} />
        {/if}
        <form on:submit|preventDefault={handleDeleteAccount} class="form">
          <Input
            type="email"
            id="delete-confirm-email"
            label={$t.profile.typeEmailToConfirm}
            placeholder={user?.email}
            bind:value={deleteConfirmEmail}
            required
          />
          <div class="delete-actions">
            <Button variant="ghost" on:click={() => { showDeleteConfirm = false; deleteConfirmEmail = ''; deleteError = ''; }}>
              {$t.common.cancel}
            </Button>
            <Button type="submit" variant="danger" disabled={deleteLoading}>
              {deleteLoading ? $t.profile.deleting : $t.profile.permanentlyDelete}
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

  .version-info {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-lg);
  }

  .notifications-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-lg);
    line-height: var(--line-height-normal);
  }

  .notifications-toggle {
    margin: 0 0 var(--spacing-md);
  }

  .notifications-test {
    margin: 0 0 var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .notifications-info {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin: var(--spacing-sm) 0 0;
    line-height: var(--line-height-normal);
  }

  .notifications-unsupported {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
