<script lang="ts">
  import { onMount } from 'svelte';
  import { toUserMessage } from '@shared/utils/error-message';
  import { Button, Alert, LoadingSpinner, Select } from '@shared/components';
  import { TeamService } from '@shared/services';
  import type { Team } from '@types';
  import type { TeamMemberWithEmail } from '@shared/services';

  let teams: Team[] = [];
  let selectedTeamId = '';
  let members: TeamMemberWithEmail[] = [];
  let allUsers: { id: string; email: string }[] = [];
  let selectedUserId = '';

  let loadingTeams = false;
  let loadingMembers = false;
  let loadingUsers = false;
  let adding = false;
  let removingId: string | null = null;

  let error = '';
  let success = '';

  $: selectedTeam = teams.find(t => t.id === selectedTeamId) ?? null;
  $: assignableUsers = allUsers.filter(u => !members.some(m => m.user_id === u.id));

  async function loadTeams() {
    loadingTeams = true;
    error = '';
    try {
      teams = await TeamService.getTeams();
      if (teams.length > 0 && !selectedTeamId) {
        selectedTeamId = teams[0].id;
        await loadMembers();
      }
    } catch (err) {
      error = toUserMessage(err, 'Failed to load teams');
    } finally {
      loadingTeams = false;
    }
  }

  async function loadMembers() {
    if (!selectedTeamId) return;
    loadingMembers = true;
    error = '';
    try {
      members = await TeamService.getTeamMembers(selectedTeamId);
    } catch (err) {
      error = toUserMessage(err, 'Failed to load members');
    } finally {
      loadingMembers = false;
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
    await loadMembers();
  }

  async function handleAddMember() {
    if (!selectedUserId || !selectedTeamId) return;
    adding = true;
    error = '';
    success = '';
    try {
      await TeamService.addTeamMember(selectedUserId, selectedTeamId);
      const added = allUsers.find(u => u.id === selectedUserId);
      success = `${added?.email ?? 'User'} added to ${selectedTeam?.name}`;
      selectedUserId = '';
      await loadMembers();
    } catch (err) {
      error = toUserMessage(err, 'Failed to add member');
    } finally {
      adding = false;
    }
  }

  async function handleRemoveMember(member: TeamMemberWithEmail) {
    if (!confirm(`Remove ${member.user_email} from ${selectedTeam?.name}?`)) return;
    removingId = member.id;
    error = '';
    success = '';
    try {
      await TeamService.removeTeamMember(member.id);
      success = `${member.user_email} removed from ${selectedTeam?.name}`;
      await loadMembers();
    } catch (err) {
      error = toUserMessage(err, 'Failed to remove member');
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
  <p class="section-desc">Assign users to teams. Members can see their team's events.</p>

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

    <div class="add-member-row">
      {#if loadingUsers}
        <span class="loading-inline">Loading users...</span>
      {:else}
        <select
          class="user-select"
          bind:value={selectedUserId}
          disabled={adding || assignableUsers.length === 0}
        >
          <option value="">
            {assignableUsers.length === 0 ? 'All users already members' : '-- Select a user to add --'}
          </option>
          {#each assignableUsers as u (u.id)}
            <option value={u.id}>{u.email}</option>
          {/each}
        </select>
        <Button
          variant="primary"
          size="sm"
          disabled={!selectedUserId || adding}
          on:click={handleAddMember}
        >
          {adding ? 'Adding...' : 'Add Member'}
        </Button>
      {/if}
    </div>

    {#if loadingMembers}
      <div class="loading-wrap"><LoadingSpinner size="md" /></div>
    {:else if members.length === 0}
      <p class="empty-members">No members in {selectedTeam?.name ?? 'this team'} yet.</p>
    {:else}
      <div class="members-list">
        {#each members as member (member.id)}
          <div class="member-row">
            <div class="member-info">
              <span class="member-email">{member.user_email}</span>
              <span class="member-since">Member since {formatDate(member.created_at)}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              disabled={removingId === member.id}
              on:click={() => handleRemoveMember(member)}
            >
              {removingId === member.id ? '...' : 'Remove'}
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

  .add-member-row {
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
  .empty-members {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-lg) 0;
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .member-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    gap: var(--spacing-md);
  }

  .member-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .member-email {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .member-since {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  @media (max-width: 600px) {
    .add-member-row {
      flex-direction: column;
      align-items: stretch;
    }

    .member-row {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
