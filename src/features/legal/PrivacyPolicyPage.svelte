<script lang="ts">
  import { onMount } from 'svelte';

  onMount(() => {
    document.title = 'Privacy Policy - BMX Calendar';
  });

  const lastUpdated = 'April 30, 2026';
</script>

<article class="legal-page">
  <div class="container">
    <header class="legal-header">
      <h1>Privacy Policy</h1>
      <p class="meta">Last updated: {lastUpdated}</p>
    </header>

    <section>
      <h2>1. Who we are</h2>
      <p>
        BMX Calendar (<a href="https://bmxkalender.be">bmxkalender.be</a>) is a
        community project that publishes a shared calendar of BMX events in
        Belgium and neighbouring regions. This Privacy Policy explains what
        personal data we collect when you visit the site, why we collect it,
        and what rights you have under the General Data Protection Regulation
        (GDPR).
      </p>
      <p>
        For any privacy question you can reach us via the
        <a href="/get-in-touch">Get in touch</a> page.
      </p>
    </section>

    <section>
      <h2>2. What data we collect</h2>
      <h3>2.1 Data you give us</h3>
      <ul>
        <li>
          <strong>Account data</strong> (optional): email address and password
          hash, stored by our authentication provider Supabase when you create
          an account.
        </li>
        <li>
          <strong>Profile data</strong> (optional): the team you manage or
          belong to, if you join a team.
        </li>
        <li>
          <strong>Saved calendars</strong>: the list of events you selected and
          the calendar name you chose.
        </li>
        <li>
          <strong>Contact messages and bug reports</strong>: the name, email
          and content of any message you send us.
        </li>
      </ul>

      <h3>2.2 Data collected automatically</h3>
      <ul>
        <li>
          <strong>Analytics</strong>: we use Google Analytics to understand
          aggregated, anonymised usage (pages viewed, referrer, device type,
          approximate location at country level). IP addresses are truncated.
        </li>
        <li>
          <strong>Advertising</strong>: we display ads through Google AdSense,
          which may set cookies and use device identifiers for ad delivery,
          frequency capping and measurement.
        </li>
        <li>
          <strong>Service logs</strong>: our hosting and database provider may
          keep technical logs (IP address, user-agent) for security and abuse
          prevention.
        </li>
      </ul>
    </section>

    <section>
      <h2>3. Legal basis and purposes</h2>
      <ul>
        <li><strong>Consent</strong> for analytics and advertising cookies.</li>
        <li>
          <strong>Performance of a contract</strong> for account-related data:
          we need it to let you sign in and save calendars.
        </li>
        <li>
          <strong>Legitimate interest</strong> for basic security logging and
          to answer support messages.
        </li>
      </ul>
    </section>

    <section>
      <h2>4. Cookies and similar technologies</h2>
      <p>
        The first time you visit the site we ask you to accept or reject
        non-essential cookies. You can change your choice at any time by
        clicking <em>Cookie settings</em> in the footer.
      </p>
      <ul>
        <li>
          <strong>Essential</strong>: session and preference storage (e.g.
          language choice). These do not require consent.
        </li>
        <li>
          <strong>Analytics</strong>: Google Analytics (<code>_ga</code>,
          <code>_gid</code>).
        </li>
        <li>
          <strong>Advertising</strong>: Google AdSense and its partners may
          set cookies such as <code>__gads</code> and <code>IDE</code> for ad
          personalisation and measurement. For users in the EEA, UK and
          Switzerland we use Google Consent Mode; ads are non-personalised
          unless you opt in.
        </li>
      </ul>
      <p>
        Learn more at
        <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
          Google's Ads policy
        </a>
        and
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google's Privacy Policy
        </a>.
      </p>
    </section>

    <section>
      <h2>5. Who we share data with</h2>
      <ul>
        <li><strong>Supabase</strong> (database and authentication provider).</li>
        <li><strong>Google</strong> (Analytics and AdSense).</li>
        <li><strong>Resend</strong> (transactional email for contact and password reset).</li>
      </ul>
      <p>
        We never sell your personal data. We only share it with the
        providers above, who act as processors and are bound by appropriate
        data-protection agreements.
      </p>
    </section>

    <section>
      <h2>6. International transfers</h2>
      <p>
        Some of our processors are located outside the EEA. Where this is the
        case, transfers are covered by the European Commission's Standard
        Contractual Clauses or an adequacy decision.
      </p>
    </section>

    <section>
      <h2>7. How long we keep data</h2>
      <ul>
        <li>Account data: until you delete your account.</li>
        <li>Saved calendars: until you delete them or delete your account.</li>
        <li>Contact messages: up to 24 months after the last reply.</li>
        <li>Analytics data: 14 months.</li>
      </ul>
    </section>

    <section>
      <h2>8. Your rights</h2>
      <p>Under the GDPR you have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>rectify inaccurate data;</li>
        <li>erase your data ("right to be forgotten");</li>
        <li>restrict or object to processing;</li>
        <li>data portability;</li>
        <li>withdraw consent at any time;</li>
        <li>
          lodge a complaint with the Belgian Data Protection Authority
          (<a href="https://www.dataprotectionauthority.be" target="_blank" rel="noopener noreferrer">
            dataprotectionauthority.be
          </a>).
        </li>
      </ul>
      <p>
        You can exercise most of these rights directly from your
        <a href="/profile">profile page</a>, including account deletion. For
        anything else, contact us.
      </p>
    </section>

    <section>
      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy to reflect changes in our service or in the
        law. The "Last updated" date at the top of the page shows the most
        recent revision.
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

  section h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-block: var(--spacing-md) var(--spacing-sm);
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

  code {
    font-family: monospace;
    font-size: 0.95em;
    background-color: var(--color-bg-secondary);
    padding-inline: 0.25em;
    border-radius: var(--border-radius-sm);
  }
</style>
