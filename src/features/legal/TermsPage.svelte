<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    document.title = 'Terms of Service - BMX Calendar';
  });

  const lastUpdated = 'April 30, 2026';
</script>

<article class="legal-page">
  <div class="container">
    <header class="legal-header">
      <h1>Terms of Service</h1>
      <p class="meta">Last updated: {lastUpdated}</p>
    </header>

    <section>
      <h2>1. Acceptance of these terms</h2>
      <p>
        By accessing or using <a href="https://bmxkalender.be">bmxkalender.be</a>
        ("the service"), you agree to be bound by these Terms of Service. If
        you do not agree, please do not use the service.
      </p>
    </section>

    <section>
      <h2>2. What the service is</h2>
      <p>
        BMX Calendar is a free, community-maintained calendar of BMX events.
        It lets visitors browse upcoming events, filter them by type or date,
        and export a personal selection to their favourite calendar app. It
        is not affiliated with any cycling federation unless explicitly
        stated.
      </p>
    </section>

    <section>
      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide a valid email address when registering.</li>
        <li>
          You are responsible for keeping your password confidential and for
          any activity carried out under your account.
        </li>
        <li>
          You may delete your account at any time from the
          <a href="/profile">profile page</a>.
        </li>
      </ul>
    </section>

    <section>
      <h2>4. Accuracy of information</h2>
      <p>
        Event information is collected from public sources, federations and
        team managers. We do our best to keep it accurate and up to date, but
        we cannot guarantee completeness or correctness. Always verify
        details with the event organiser before travelling or registering.
      </p>
    </section>

    <section>
      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the service for any unlawful purpose;</li>
        <li>
          attempt to gain unauthorised access to accounts, data or
          infrastructure;
        </li>
        <li>
          scrape, copy or redistribute the calendar at scale without our
          written permission;
        </li>
        <li>submit false bug reports, spam or abusive content.</li>
      </ul>
    </section>

    <section>
      <h2>6. Intellectual property</h2>
      <p>
        The service, its design and its code are the property of the BMX
        Calendar project. Event names, logos and trademarks belong to their
        respective owners. The factual event information itself (dates,
        locations) is considered public data.
      </p>
    </section>

    <section>
      <h2>7. Advertising</h2>
      <p>
        The service is free to use and partly funded by advertising served
        through Google AdSense. See the
        <a href="/privacy-policy">Privacy Policy</a> for details on cookies
        and tracking, and how to manage your consent.
      </p>
    </section>

    <section>
      <h2>8. Disclaimer</h2>
      <p>
        The service is provided "as is" and "as available", without any
        warranty of any kind. To the maximum extent permitted by law, we
        disclaim all warranties, express or implied.
      </p>
    </section>

    <section>
      <h2>9. Limitation of liability</h2>
      <p>
        To the extent permitted by law, we shall not be liable for any
        indirect, incidental or consequential damages arising from your use
        of the service.
      </p>
    </section>

    <section>
      <h2>10. Changes</h2>
      <p>
        We may update these terms from time to time. Material changes will be
        announced on the site. Continued use of the service after changes
        take effect means you accept the new terms.
      </p>
    </section>

    <section>
      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of Belgium. Any dispute will be
        submitted to the exclusive jurisdiction of the courts of Belgium,
        without prejudice to any mandatory consumer protection rules.
      </p>
    </section>

    <section>
      <h2>12. Contact</h2>
      <p>
        Questions about these terms? Reach out via the
        <a href="/get-in-touch">Get in touch</a> page.
      </p>
    </section>
  </div>
</article>

<style>
  .legal-page {
    padding-block: var(--spacing-2xl);
    padding-inline: var(--spacing-lg);
    min-height: 60vh;
  }

  .container {
    max-width: 760px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .legal-header {
    padding-block-end: var(--spacing-lg);
    border-block-end: 1px solid var(--color-border);
  }

  .legal-header h1 {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-sm);
    line-height: var(--line-height-tight);
  }

  .meta {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  section h2 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block-end: var(--spacing-md);
    line-height: var(--line-height-tight);
  }

  section p,
  section li {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    line-height: var(--line-height-relaxed);
  }

  section p {
    margin-block-end: var(--spacing-md);
  }

  section ul {
    padding-inline-start: var(--spacing-lg);
    margin-block-end: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  a {
    color: var(--color-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  a:hover {
    color: var(--color-primary-dark, #1d4ed8);
  }
</style>
