<script lang="ts">
  import { onMount } from 'svelte';
  import { NewsService } from '@shared/services';
  import { navigate } from '../../router';
  import { toUserMessage } from '@shared/utils/error-message';
  import { LoadingSpinner, Alert } from '@shared/components';
  import type { NewsArticle } from '@types';

  let articles: NewsArticle[] = [];
  let loading = true;
  let error = '';

  async function loadArticles() {
    loading = true;
    error = '';
    try {
      articles = await NewsService.getPublishedArticles();
    } catch (err) {
      error = toUserMessage(err, 'Failed to load news');
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

  function handleArticleClick(slug: string) {
    navigate(`/news/${slug}`);
  }

  onMount(() => {
    loadArticles();
  });
</script>

<div class="news-page">
  <div class="news-container">
    <header class="news-header">
      <p class="news-eyebrow">Updates</p>
      <h1 class="news-title">News & Updates</h1>
      <p class="news-lead">Stay up to date with the latest features, improvements, and announcements from BMX Calendar.</p>
    </header>

    {#if loading}
      <div class="news-loading"><LoadingSpinner size="lg" /></div>
    {:else if error}
      <Alert type="danger" message={error} />
    {:else if articles.length === 0}
      <p class="news-empty">No news articles yet. Check back soon!</p>
    {:else}
      <div class="articles-list">
        {#each articles as article (article.id)}
          <article class="article-card" on:click={() => handleArticleClick(article.slug)} role="link" tabindex="0">
            <div class="article-card-body">
              <div class="article-meta">
                <span class="article-date">{formatDate(article.published_at)}</span>
                <span class="article-author">{article.author}</span>
              </div>
              <h2 class="article-heading">{article.title}</h2>
              {#if article.excerpt}
                <p class="article-excerpt">{article.excerpt}</p>
              {/if}
              <span class="article-readmore">Read more</span>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .news-page {
    min-height: 60vh;
    padding: var(--spacing-xl) var(--spacing-md);
    background: var(--color-bg-secondary);
  }

  .news-container {
    max-width: 800px;
    margin: 0 auto;
  }

  .news-header {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
  }

  .news-eyebrow {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 var(--spacing-xs);
  }

  .news-title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
    line-height: 1.2;
  }

  .news-lead {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin: 0 auto;
    max-width: 600px;
  }

  .news-loading {
    display: flex;
    justify-content: center;
    padding: var(--spacing-3xl) 0;
  }

  .news-empty {
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
    padding: var(--spacing-3xl) 0;
  }

  .articles-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .article-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
    overflow: hidden;
  }

  .article-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .article-card:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .article-card-body {
    padding: var(--spacing-lg) var(--spacing-xl);
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

  .article-heading {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--spacing-sm);
    line-height: 1.3;
  }

  .article-excerpt {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 var(--spacing-md);
  }

  .article-readmore {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  @media (max-width: 640px) {
    .news-page {
      padding: var(--spacing-lg) var(--spacing-sm);
    }

    .news-title {
      font-size: var(--font-size-3xl);
    }

    .article-card-body {
      padding: var(--spacing-md);
    }

    .article-heading {
      font-size: var(--font-size-xl);
    }
  }
</style>
