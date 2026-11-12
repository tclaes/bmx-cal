#!/usr/bin/env node
// Production-safe smoke test for the Supabase edge functions.
//
// Every request here is harmless by construction: no credentials are sent, so protected
// functions answer 401 before doing any work, and the two public functions receive an
// empty payload and answer 400 before sending anything. Positive paths (admin, team
// manager, scheduler) must only be tested against a local Supabase, never production.
//
// Usage: node scripts/smoke-edge-functions.mjs <base-url>
//   e.g. node scripts/smoke-edge-functions.mjs http://127.0.0.1:54321/functions/v1

/** @typedef {{ name: string, kind: 'protected' | 'public' }} FunctionSpec */
/** @typedef {{ label: string, fn: string, method: string, body?: string, expectStatus: number, expectCors: boolean }} SmokeCase */

/** @type {FunctionSpec[]} */
export const FUNCTIONS = [
  { name: 'analyze-image', kind: 'protected' },
  { name: 'analyze-pdf', kind: 'protected' },
  { name: 'create-github-issue', kind: 'protected' },
  { name: 'delete-account', kind: 'protected' },
  { name: 'get-github-issue-statuses', kind: 'protected' },
  { name: 'reopen-github-issue', kind: 'protected' },
  { name: 'search-uec-livestream', kind: 'protected' },
  { name: 'send-push-notifications', kind: 'protected' },
  { name: 'sync-jstiming', kind: 'protected' },
  { name: 'send-contact-email', kind: 'public' },
  { name: 'send-password-reset', kind: 'public' },
];

/** @returns {SmokeCase[]} */
export function buildCases(functions = FUNCTIONS) {
  /** @type {SmokeCase[]} */
  const cases = [];
  for (const { name, kind } of functions) {
    cases.push({
      label: `${name}: CORS preflight`,
      fn: name,
      method: 'OPTIONS',
      expectStatus: 200,
      expectCors: true,
    });
    if (kind === 'protected') {
      // Without an Authorization header the gateway or the function itself must refuse.
      cases.push({
        label: `${name}: unauthenticated call is refused`,
        fn: name,
        method: 'POST',
        body: '{}',
        expectStatus: 401,
        expectCors: false,
      });
    } else {
      cases.push({
        label: `${name}: empty payload is rejected`,
        fn: name,
        method: 'POST',
        body: '{}',
        expectStatus: 400,
        expectCors: true,
      });
    }
  }
  return cases;
}

/**
 * @param {string} baseUrl
 * @param {typeof fetch} fetchImpl
 * @param {SmokeCase[]} cases
 */
export async function runSmoke(baseUrl, fetchImpl = fetch, cases = buildCases()) {
  const base = baseUrl.replace(/\/+$/, '');
  const results = [];
  for (const c of cases) {
    /** @type {RequestInit} */
    const init = { method: c.method, headers: { 'Content-Type': 'application/json' } };
    if (c.body !== undefined) init.body = c.body;
    let status = 0;
    let cors = false;
    let error = '';
    try {
      const res = await fetchImpl(`${base}/${c.fn}`, init);
      status = res.status;
      cors = res.headers.get('Access-Control-Allow-Origin') !== null;
      await res.text();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    const statusOk = status === c.expectStatus;
    const corsOk = !c.expectCors || cors;
    results.push({
      label: c.label,
      ok: !error && statusOk && corsOk,
      detail: error
        ? `request failed: ${error}`
        : `status ${status} (want ${c.expectStatus})${c.expectCors ? `, CORS ${cors ? 'present' : 'MISSING'}` : ''}`,
    });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    console.error('Usage: node scripts/smoke-edge-functions.mjs <base-url>');
    process.exit(2);
  }
  const results = await runSmoke(baseUrl);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}  ${r.detail}`);
  const failed = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed === 0 ? 0 : 1);
}
