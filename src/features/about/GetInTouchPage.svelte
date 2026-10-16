<script lang="ts">
  import { navigate } from '../../router';
  import { toUserMessage } from '@shared/utils/error-message';
  import { t, interpolate } from '../../i18n';

  let name = '';
  let email = '';
  let clubName = '';
  let message = '';
  let submitted = false;
  let submitting = false;
  let error = '';

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = '';

    if (!name.trim() || !email.trim() || !message.trim()) {
      error = $t.getInTouch.fillRequired;
      return;
    }

    submitting = true;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, clubName, message }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      submitted = true;
    } catch (err) {
      error = toUserMessage(err, 'Something went wrong. Please try again.');
    } finally {
      submitting = false;
    }
  }
</script>

<div class="page">
  <div class="container">
    {#if !submitted}
      <div class="header">
        <button class="back-link" on:click={() => navigate('/about')}>
          &larr; {$t.getInTouch.backToAbout}
        </button>
        <h1>{$t.getInTouch.title}</h1>
        <p class="lead">
          {$t.getInTouch.lead}
        </p>
      </div>

      <div class="content">
        <div class="info-panel">
          <h2>{$t.getInTouch.whatToExpectTitle}</h2>
          <p>{$t.getInTouch.whatToExpectPara1}</p>
          <p>{$t.getInTouch.whatToExpectPara2}</p>

          <div class="what-included">
            <h3>{$t.getInTouch.teamFeaturesTitle}</h3>
            <ul>
              <li>{$t.getInTouch.feature1}</li>
              <li>{$t.getInTouch.feature2}</li>
              <li>{$t.getInTouch.feature3}</li>
              <li>{$t.getInTouch.feature4}</li>
            </ul>
          </div>
        </div>

        <form class="form" on:submit={handleSubmit}>
          {#if error}
            <div class="alert-error">{error}</div>
          {/if}

          <div class="field">
            <label for="name">{$t.getInTouch.nameLabelRequired} <span class="required">*</span></label>
            <input
              id="name"
              type="text"
              bind:value={name}
              placeholder={$t.getInTouch.namePlaceholder}
              required
            />
          </div>

          <div class="field">
            <label for="email">{$t.getInTouch.emailLabelRequired} <span class="required">*</span></label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder={$t.getInTouch.emailPlaceholder}
              required
            />
          </div>

          <div class="field">
            <label for="clubName">{$t.getInTouch.clubLabel}</label>
            <input
              id="clubName"
              type="text"
              bind:value={clubName}
              placeholder={$t.getInTouch.clubPlaceholder}
            />
          </div>

          <div class="field">
            <label for="message">{$t.getInTouch.messageLabelRequired} <span class="required">*</span></label>
            <textarea
              id="message"
              bind:value={message}
              rows="5"
              placeholder={$t.getInTouch.messagePlaceholder}
              required
            ></textarea>
          </div>

          <button type="submit" class="btn-submit" disabled={submitting}>
            {submitting ? $t.getInTouch.submitting : $t.getInTouch.sendMessage}
          </button>

          <p class="note">
            {$t.getInTouch.replyNote}
          </p>
        </form>
      </div>
    {:else}
      <div class="success">
        <div class="success-icon">&#10003;</div>
        <h2>{$t.getInTouch.successTitle}</h2>
        <p>{interpolate($t.getInTouch.successMessage, { email })}</p>
        <div class="success-actions">
          <button class="btn-primary" on:click={() => navigate('/')}>
            {$t.getInTouch.backToCalendar}
          </button>
          <button class="btn-secondary" on:click={() => { submitted = false; }}>
            {$t.getInTouch.sendAnother}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    padding: var(--spacing-2xl) var(--spacing-lg);
    min-height: 60vh;
  }

  .container {
    max-width: 900px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: var(--spacing-2xl);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    margin-bottom: var(--spacing-lg);
    transition: color var(--transition-fast);
  }

  .back-link:hover {
    color: var(--color-text-secondary);
  }

  h1 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    max-width: 600px;
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: var(--spacing-2xl);
    align-items: start;
  }

  .info-panel h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
  }

  .info-panel p {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-md);
  }

  .what-included {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    margin-top: var(--spacing-lg);
  }

  .what-included h3 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .what-included ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .what-included li {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
    padding-left: var(--spacing-md);
    position: relative;
  }

  .what-included li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 7px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-primary);
  }

  .form {
    background-color: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .required {
    color: var(--color-danger);
  }

  input,
  textarea {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  textarea {
    resize: vertical;
    min-height: 120px;
    line-height: var(--line-height-relaxed);
  }

  .btn-submit {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--color-primary);
    color: white;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    align-self: flex-start;
  }

  .btn-submit:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .note {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  .alert-error {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-danger);
  }

  .success {
    text-align: center;
    padding: var(--spacing-2xl);
    max-width: 500px;
    margin: 0 auto;
  }

  .success-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: var(--color-success);
    color: white;
    font-size: var(--font-size-2xl);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg);
  }

  .success h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-md);
  }

  .success p {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--spacing-xl);
  }

  .success-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--color-primary);
    color: white;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .btn-primary:hover {
    background-color: #1d4ed8;
  }

  .btn-secondary {
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: transparent;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast);
  }

  .btn-secondary:hover {
    border-color: var(--color-text-muted);
    color: var(--color-text-primary);
  }

  @media (max-width: 700px) {
    h1 {
      font-size: var(--font-size-3xl);
    }

    .content {
      grid-template-columns: 1fr;
    }

    .form {
      padding: var(--spacing-lg);
    }
  }
</style>
