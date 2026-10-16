<script lang="ts">
  import { onMount } from 'svelte';
  import { NewsService } from '@shared/services';
  import { navigate, routeParams } from '../../router';
  import { toUserMessage } from '@shared/utils/error-message';
  import { LoadingSpinner, Alert, Button } from '@shared/components';
  import type { NewsArticle } from '@types';

  let article: NewsArticle | null = null;
  let loading = true;
  let error = '';

  async function loadArticle(slug: string) {
    loading = true;
    error = '';
    try {
      article = await NewsService.getArticleBySlug(slug);
      if (!article) {
        error = 'Article not found.';
      }
    } catch (err) {
      error = toUserMessage(err, 'Failed to load article');
    } finally {
      loading = false;
    }
  }

  function formatDate(d: string | null): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function renderContent(content: string): string {
    let html = content
      .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p class="md-p">')
      .replace(/^- (.+)$/gm, '<li class="md-li">$1</li>');

    if (!html.startsWith('<h1') && !html.startsWith('<h2') && !html.startsWith('<h3')) {
      html = '<p class="md-p">' + html + '</p>';
    }

    return html;
  }

  $: slug = $routeParams.slug;

  onMount(() => {
    if (slug) loadArticle(slug);
  });

  $: if (slug && !loading && !article && !error) {
    loadArticle(slug);
  }
</script>

<div class="article-page">
  <div class="article-container">
    {#if loading}
      <div class="article-loading"><LoadingSpinner size="lg" /></div>
    {:else if error}
      <Alert type="danger" message={error} />
      <div class="article-back">
        <Button variant="ghost" size="sm" on:click={() => navigate('/news')}>Back to news</Button>
      </div>
    {:else if article}
      <div class="article-back">
        <Button variant="ghost" size="sm" on:click={() => navigate('/news')}>Back to news</Button>
      </div>

      <header class="article-header">
        <div class="article-meta">
          <span class="article-date">{formatDate(article.published_at)}</span>
          <span class="article-author">{article.author}</span>
        </div>
        <h1 class="article-title">{article.title}</h1>
        {#if article.excerpt}
          <p class="article-excerpt">{article.excerpt}</p>
        {/if}
      </header>

      <div class="article-content">
        {@html renderContent(article.content)}
      </div>

      <div class="article-footer">
        <Button variant="ghost" size="sm" on:click={() => navigate('/news')}>Back to news</Button>
      </div>
    {/if}
  </div>
</div>

<style>
  .article-page {
    min-height: 60vh;
    padding: var(--spacing-xl) var(--spacing-md);
    background: var(--color-bg-secondary);
  }

  .article-container {
    max-width: 720px;
    margin: 0 auto;
  }

  .article-loading {
    display: flex;
    justify-content: center;
    padding: var(--spacing-3xl) 0;
  }

  .article-back {
    margin-bottom: var(--spacing-lg);
  }

  .article-header {
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  .article-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  .article-date {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
  }

  .article-author {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .article-author::before {
    content: '·';
    margin-right: var(--spacing-sm);
  }

  .article-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
    line-height: 1.2;
  }

  .article-excerpt {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .article-content {
    color: var(--color-text-primary);
    line-height: 1.7;
  }

  .article-content :global(.md-h1) {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin: var(--spacing-2xl) 0 var(--spacing-md);
    line-height: 1.2;
  }

  .article-content :global(.md-h2) {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    margin: var(--spacing-xl) 0 var(--spacing-sm);
    line-height: 1.3;
  }

  .article-content :global(.md-h3) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin: var(--spacing-lg) 0 var(--spacing-sm);
    line-height: 1.3;
  }

  .article-content :global(.md-p) {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-md);
  }

  .article-content :global(.md-li) {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-xs);
    list-style: none;
    padding-left: var(--spacing-md);
    position: relative;
  }

  .article-content :global(.md-li)::before {
    content: '—';
    position: absolute;
    left: 0;
    color: var(--color-text-muted);
  }

  .article-content :global(strong) {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  .article-footer {
    margin-top: var(--spacing-2xl);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }

  @media (max-width: 640px) {
    .article-page {
      padding: var(--spacing-lg) var(--spacing-sm);
    }

    .article-title {
      font-size: var(--font-size-3xl);
    }
  }
</style>
