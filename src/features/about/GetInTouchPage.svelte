<script lang="ts">
  import { navigate } from '../../router';

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
      error = 'Please fill in all required fields.';
      return;
    }

    submitting = true;

    try {
      const mailtoSubject = encodeURIComponent(`Team features inquiry from ${clubName || name}`);
      const body = [
        `Name: ${name}`,
        clubName ? `Club / Team: ${clubName}` : null,
        `Email: ${email}`,
        '',
        message,
      ].filter(Boolean).join('\n');

      const mailtoLink = `mailto:info@bmxcalendar.be?subject=${mailtoSubject}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      submitted = true;
    } catch {
      error = 'Something went wrong. Please try again.';
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
          &larr; About
        </button>
        <h1>Get in touch</h1>
        <p class="lead">
          Interested in team features for your club? Fill in the form below and we'll get back to you with more information. There's no commitment required.
        </p>
      </div>

      <div class="content">
        <div class="info-panel">
          <h2>What to expect</h2>
          <p>
            Team features are a paid add-on to BMX Calendar. We don't have fixed pricing yet — we're talking to clubs to understand what works best.
          </p>
          <p>
            Getting in touch is completely free and non-binding. We'll discuss your club's needs and give you a clear picture of what's included before anything else.
          </p>

          <div class="what-included">
            <h3>Team features include</h3>
            <ul>
              <li>Create and manage your club's own events</li>
              <li>Dedicated team manager dashboard</li>
              <li>Member management tools</li>
              <li>Team-specific event visibility controls</li>
            </ul>
          </div>
        </div>

        <form class="form" on:submit={handleSubmit}>
          {#if error}
            <div class="alert-error">{error}</div>
          {/if}

          <div class="field">
            <label for="name">Your name <span class="required">*</span></label>
            <input
              id="name"
              type="text"
              bind:value={name}
              placeholder="Jan De Smedt"
              required
            />
          </div>

          <div class="field">
            <label for="email">Email address <span class="required">*</span></label>
            <input
              id="email"
              type="email"
              bind:value={email}
              placeholder="jan@example.com"
              required
            />
          </div>

          <div class="field">
            <label for="clubName">Club or team name</label>
            <input
              id="clubName"
              type="text"
              bind:value={clubName}
              placeholder="BMX Antwerp"
            />
          </div>

          <div class="field">
            <label for="message">Your message <span class="required">*</span></label>
            <textarea
              id="message"
              bind:value={message}
              rows="5"
              placeholder="Tell us a bit about your club and what you're looking for..."
              required
            ></textarea>
          </div>

          <button type="submit" class="btn-submit" disabled={submitting}>
            {submitting ? 'Opening email...' : 'Send message'}
          </button>

          <p class="note">
            This will open your email client. Your message is not stored on our servers.
          </p>
        </form>
      </div>
    {:else}
      <div class="success">
        <div class="success-icon">&#10003;</div>
        <h2>Your email client should have opened</h2>
        <p>
          If it didn't open automatically, you can email us directly. We'll get back to you as soon as we can.
        </p>
        <div class="success-actions">
          <button class="btn-primary" on:click={() => navigate('/')}>
            Back to calendar
          </button>
          <button class="btn-secondary" on:click={() => { submitted = false; }}>
            Send another message
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
