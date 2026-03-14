<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Alert, LoadingSpinner, Badge } from '@shared/components';
  import { adminBugReportService } from '@features/bug-report/bug-report.service';
  import type { BugReport } from '@features/bug-report/bug-report.service';

  let reports: BugReport[] = [];
  let loading = false;
  let error = '';
  let updatingId: string | null = null;

  const STATUS_LABELS: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    open: 'error',
    in_progress: 'warning',
    resolved: 'success',
  };

  async function load() {
    loading = true;
    error = '';
    try {
      reports = await adminBugReportService.getAllReports();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load bug reports';
    } finally {
      loading = false;
    }
  }

  async function updateStatus(report: BugReport, status: string) {
    updatingId = report.id;
    try {
      await adminBugReportService.updateStatus(report.id, status);
      reports = reports.map(r => r.id === report.id ? { ...r, status } : r);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to update status';
    } finally {
      updatingId = null;
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onMount(load);
</script>

<div class="panel">
  <div class="panel-header">
    <p class="panel-desc">Bug reports submitted by users. Each open report automatically creates a GitHub issue.</p>
    <Button variant="secondary" size="sm" on:click={load} disabled={loading}>
      {loading ? 'Refreshing...' : 'Refresh'}
    </Button>
  </div>

  {#if error}
    <Alert type="danger" message={error} />
  {/if}

  {#if loading}
    <div class="loading-wrap"><LoadingSpinner size="md" /></div>
  {:else if reports.length === 0}
    <p class="empty">No bug reports yet.</p>
  {:else}
    <div class="reports-list">
      {#each reports as report (report.id)}
        <div class="report-card" class:resolved={report.status === 'resolved'}>
          <div class="report-top">
            <div class="report-meta">
              <Badge variant={STATUS_VARIANTS[report.status] ?? 'default'}>
                {STATUS_LABELS[report.status] ?? report.status}
              </Badge>
              <span class="report-date">{formatDate(report.created_at)}</span>
              {#if report.reporter_email}
                <span class="report-email">{report.reporter_email}</span>
              {:else}
                <span class="report-anon">Anonymous</span>
              {/if}
              {#if report.github_issue_url}
                <a
                  class="github-link"
                  href={report.github_issue_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  GitHub issue
                </a>
              {/if}
            </div>

            <div class="report-actions">
              {#if report.status !== 'in_progress'}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={updatingId === report.id}
                  on:click={() => updateStatus(report, 'in_progress')}
                >
                  Mark in progress
                </Button>
              {/if}
              {#if report.status !== 'resolved'}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={updatingId === report.id}
                  on:click={() => updateStatus(report, 'resolved')}
                >
                  Resolve
                </Button>
              {/if}
              {#if report.status === 'resolved'}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={updatingId === report.id}
                  on:click={() => updateStatus(report, 'open')}
                >
                  Reopen
                </Button>
              {/if}
            </div>
          </div>

          <p class="report-description">{report.description}</p>

          {#if report.screenshot_url}
            <a class="screenshot-link" href={report.screenshot_url} target="_blank" rel="noopener noreferrer">
              <img
                class="screenshot-thumb"
                src={report.screenshot_url}
                alt="Bug screenshot"
                loading="lazy"
              />
            </a>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-top: var(--spacing-md);
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .panel-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .loading-wrap {
    display: flex;
    justify-content: center;
    padding: var(--spacing-xl) 0;
  }

  .empty {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-xl) 0;
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .reports-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .report-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    background: var(--color-bg-primary);
    transition: opacity 0.15s ease;
  }

  .report-card.resolved {
    opacity: 0.6;
  }

  .report-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--spacing-md);
    flex-wrap: wrap;
  }

  .report-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  .report-email {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }

  .report-anon {
    font-style: italic;
  }

  .report-actions {
    display: flex;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .report-description {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.55;
  }

  .screenshot-link {
    display: inline-block;
    margin-top: var(--spacing-xs);
    border-radius: var(--radius-sm, 4px);
    overflow: hidden;
    border: 1px solid var(--color-border);
    max-width: 320px;
  }

  .screenshot-thumb {
    display: block;
    max-width: 100%;
    height: auto;
    max-height: 180px;
    object-fit: cover;
  }

  .github-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    text-decoration: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    padding: 2px 6px;
    transition: color 0.15s ease, border-color 0.15s ease;
  }

  .github-link:hover {
    color: var(--color-text-primary);
    border-color: var(--color-text-secondary);
  }

  .github-link svg {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .report-top {
      flex-direction: column;
    }

    .report-actions {
      width: 100%;
    }
  }
</style>
