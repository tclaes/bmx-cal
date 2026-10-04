<script lang="ts">
  import { onMount } from 'svelte';
  import { toUserMessage } from '@shared/utils/error-message';
  import { Button, Alert, LoadingSpinner } from '@shared/components';
  import { TeamService } from '@shared/services';
  import type { Team } from '@types';
  import type { TeamMemberWithEmail, TeamManagerWithEmail } from '@shared/services';

  type Tab = 'members' | 'managers';

  let activeTab: Tab = 'members';
  let teams: Team[] = [];
  let selectedTeamId = '';
  let members: TeamMemberWithEmail[] = [];
  let managers: TeamManagerWithEmail[] = [];
  let allUsers: { id: string; email: string }[] = [];
  let selectedUserId = '';

  let loadingTeams = false;
  let loadingList = false;
  let loadingUsers = false;
  let adding = false;
  let removingId: string | null = null;

  let error = '';
  let success = '';

  $: selectedTeam = teams.find(t => t.id === selectedTeamId) ?? null;
  $: currentList = activeTab === 'members' ? members : managers;
  $: assignableUsers = allUsers.filter(u => !currentList.some(m => m.user_id === u.id));

  async function loadTeams() {
    loadingTeams = true;
    error = '';
    try {
      teams = await TeamService.getTeams();
      if (teams.length > 0 && !selectedTeamId) {
        selectedTeamId = teams[0].id;
        await loadList();
      }
    } catch (err) {
      error = toUserMessage(err, 'Failed to load teams');
    } finally {
      loadingTeams = false;
    }
  }

  async function loadList() {
    if (!selectedTeamId) return;
    loadingList = true;
    error = '';
    try {
      if (activeTab === 'members') {
        members = await TeamService.getTeamMembers(selectedTeamId);
      } else {
        managers = await TeamService.getTeamManagers(selectedTeamId);
      }
    } catch (err) {
      error = toUserMessage(err, 'Failed to load list');
    } finally {
      loadingList = false;
    }
  }

  async function loadUsers() {
    loadingUsers = true;
    try {
      allUsers = await TeamService.getAllUsers();
    } catch (err) {
      // ignore — non-admins won't have access
    } finally {
      loadingUsers = false;
    }
  }

  async function handleTeamChange(e: Event) {
    selectedTeamId = (e.target as HTMLSelectElement).value;
    selectedUserId = '';
    success = '';
    error = '';
    await loadList();
  }

  async function handleTabChange(tab: Tab) {
    if (activeTab === tab) return;
    activeTab = tab;
    selectedUserId = '';
    success = '';
    error = '';
    await loadList();
  }

  async function handleAdd() {
    if (!selectedUserId || !selectedTeamId) return;
    adding = true;
    error = '';
    success = '';
    try {
      const added = allUsers.find(u => u.id === selectedUserId);
      if (activeTab === 'members') {
        await TeamService.addTeamMember(selectedUserId, selectedTeamId);
        success = `${added?.email ?? 'User'} added as member to ${selectedTeam?.name}`;
      } else {
        await TeamService.addTeamManager(selectedUserId, selectedTeamId);
        success = `${added?.email ?? 'User'} added as manager to ${selectedTeam?.name}`;
      }
      selectedUserId = '';
      await loadList();
    } catch (err) {
      error = toUserMessage(err, 'Failed to add');
    } finally {
      adding = false;
    }
  }

  async function handleRemove(item: TeamMemberWithEmail | TeamManagerWithEmail) {
    const role = activeTab === 'members' ? 'member' : 'manager';
    if (!confirm(`Remove ${item.user_email} as ${role} from ${selectedTeam?.name}?`)) return;
    removingId = item.id;
    error = '';
    success = '';
    try {
      if (activeTab === 'members') {
        await TeamService.removeTeamMember(item.id);
      } else {
        await TeamService.removeTeamManager(item.id);
      }
      success = `${item.user_email} removed as ${role} from ${selectedTeam?.name}`;
      await loadList();
    } catch (err) {
      error = toUserMessage(err, 'Failed to remove');
    } finally {
      removingId = null;
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  onMount(() => {
    loadTeams();
    loadUsers();
  });
</script>

<div class="tmm-section">
  <p class="section-desc">Assign users as members or managers to teams. Managers can create and manage team events.</p>

  {#if error}
    <Alert type="danger" message={error} />
  {/if}
  {#if success}
    <Alert type="success" message={success} />
  {/if}

  {#if loadingTeams}
    <div class="loading-wrap"><LoadingSpinner size="md" /></div>
  {:else if teams.length === 0}
    <p class="empty-state">No teams found. Create a team first.</p>
  {:else}
    <div class="team-selector">
      <label class="field-label" for="team-select">Team</label>
      <select id="team-select" class="team-select" value={selectedTeamId} on:change={handleTeamChange}>
        {#each teams as team (team.id)}
          <option value={team.id}>{team.name}</option>
        {/each}
      </select>
    </div>

    <div class="tab-bar">
      <button class="tab-btn" class:active={activeTab === 'members'} on:click={() => handleTabChange('members')}>
        Members
      </button>
      <button class="tab-btn" class:active={activeTab === 'managers'} on:click={() => handleTabChange('managers')}>
        Managers
      </button>
    </div>

    <div class="add-row">
      {#if loadingUsers}
        <span class="loading-inline">Loading users...</span>
      {:else}
        <select
          class="user-select"
          bind:value={selectedUserId}
          disabled={adding || assignableUsers.length === 0}
        >
          <option value="">
            {assignableUsers.length === 0 ? `All users already ${activeTab === 'members' ? 'members' : 'managers'}` : '-- Select a user to add --'}
          </option>
          {#each assignableUsers as u (u.id)}
            <option value={u.id}>{u.email}</option>
          {/each}
        </select>
        <Button
          variant="primary"
          size="sm"
          disabled={!selectedUserId || adding}
          on:click={handleAdd}
        >
          {adding ? 'Adding...' : `Add ${activeTab === 'members' ? 'Member' : 'Manager'}`}
        </Button>
      {/if}
    </div>

    {#if loadingList}
      <div class="loading-wrap"><LoadingSpinner size="md" /></div>
    {:else if currentList.length === 0}
      <p class="empty-list">No {activeTab === 'members' ? 'members' : 'managers'} in {selectedTeam?.name ?? 'this team'} yet.</p>
    {:else}
      <div class="list">
        {#each currentList as item (item.id)}
          <div class="item-row">
            <div class="item-info">
              <span class="item-email">{item.user_email}</span>
              <span class="item-since">{activeTab === 'members' ? 'Member' : 'Manager'} since {formatDate(item.created_at)}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              disabled={removingId === item.id}
              on:click={() => handleRemove(item)}
            >
              {removingId === item.id ? '...' : 'Remove'}
            </Button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .tmm-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .section-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .field-label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xs);
  }

  .team-selector {
    display: flex;
    flex-direction: column;
  }

  .team-select,
  .user-select {
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-sm);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .team-select:focus,
  .user-select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .user-select {
    flex: 1;
    min-width: 0;
  }

  .tab-bar {
    display: flex;
    gap: var(--spacing-xs);
    border-bottom: 1px solid var(--color-border);
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab-btn:hover {
    color: var(--color-text-primary);
  }

  .tab-btn.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .add-row {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
  }

  .loading-inline {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .loading-wrap {
    display: flex;
    justify-content: center;
    padding: var(--spacing-lg) 0;
  }

  .empty-state,
  .empty-list {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-lg) 0;
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    gap: var(--spacing-md);
  }

  .item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .item-email {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-since {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  @media (max-width: 600px) {
    .add-row {
      flex-direction: column;
      align-items: stretch;
    }

    .item-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
