#!/usr/bin/env node
// Production-safe smoke test for the Supabase edge functions.
//
// Every request here is harmless by construction: no credentials are sent, so protected
// functions answer 401 before doing any work, send-contact-email receives an empty payload
// and answers 400 before sending anything, and send-password-reset is only sent a CORS
// preflight (it rate-limits before validating, so a POST would use up a reset slot).
// Positive paths (admin, team manager, scheduler) must only be tested against a local
// Supabase, never production.
//
// Usage: node scripts/smoke-edge-functions.mjs <base-url>
//   e.g. node scripts/smoke-edge-functions.mjs http://127.0.0.1:54321/functions/v1

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** @typedef {{ name: string, kind: 'protected' | 'public', probePost?: boolean }} FunctionSpec */
/** @typedef {{ label: string, fn: string, method: string, body?: string, headers?: Record<string, string>, expectStatus: number, expectCors: boolean, preflight?: boolean }} SmokeCase */

/** @type {FunctionSpec[]} */
export const FUNCTIONS = [
  { name: 'analyze-image', kind: 'protected' },
  { name: 'analyze-pdf', kind: 'protected' },
  { name: 'create-github-issue', kind: 'protected' },
  { name: 'delete-account', kind: 'protected' },
  { name: 'get-github-issue-statuses', kind: 'protected' },
  { name: 'reopen-github-issue', kind: 'protected' },
  { name: 'send-push-notifications', kind: 'protected' },
  { name: 'sync-jstiming', kind: 'protected' },
  { name: 'send-contact-email', kind: 'public', probePost: true },
  // The reset function rate-limits before it validates, so even an empty POST would use up
  // one of the caller's reset slots. Only the preflight is probed in production.
  { name: 'send-password-reset', kind: 'public', probePost: false },
];

/** @returns {SmokeCase[]} */
export function buildCases(functions = FUNCTIONS) {
  /** @type {SmokeCase[]} */
  const cases = [];
  for (const { name, kind, probePost } of functions) {
    cases.push({
      label: `${name}: CORS preflight`,
      fn: name,
      method: 'OPTIONS',
      // What a browser sends before a JSON POST with an Authorization header.
      headers: {
        Origin: 'https://smoke.example',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, authorization',
      },
      expectStatus: 200,
      expectCors: true,
      preflight: true,
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
    } else if (probePost) {
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
 * A browser only proceeds with the JSON POST if the preflight grants the origin, the POST
 * method and the Content-Type and Authorization headers.
 * @param {Headers} headers
 * @returns {string} empty when the preflight is acceptable, otherwise what is missing
 */
export function checkPreflight(headers) {
  const origin = headers.get('Access-Control-Allow-Origin');
  const methods = (headers.get('Access-Control-Allow-Methods') ?? '').toLowerCase();
  const allowed = (headers.get('Access-Control-Allow-Headers') ?? '').toLowerCase();
  const missing = [];
  if (origin !== '*' && origin !== 'https://smoke.example') missing.push('origin');
  if (!methods.split(/\s*,\s*/).includes('post')) missing.push('POST method');
  for (const h of ['content-type', 'authorization']) {
    if (!allowed.split(/\s*,\s*/).includes(h)) missing.push(`${h} header`);
  }
  return missing.length ? `preflight does not allow: ${missing.join(', ')}` : '';
}

/**
 * @param {string} baseUrl
 * @param {typeof fetch} fetchImpl
 * @param {SmokeCase[]} cases
 */
export async function runSmoke(baseUrl, fetchImpl = fetch, cases = buildCases(), timeoutMs = 10000) {
  const base = baseUrl.replace(/\/+$/, '');
  const results = [];
  for (const c of cases) {
    /** @type {RequestInit} */
    const init = {
      method: c.method,
      headers: { 'Content-Type': 'application/json', ...c.headers },
      // Never send cookies or other ambient credentials; never hang on one function.
      credentials: 'omit',
      signal: AbortSignal.timeout(timeoutMs),
    };
    if (c.body !== undefined) init.body = c.body;
    let status = 0;
    let cors = false;
    let preflightProblem = '';
    let error = '';
    try {
      const res = await fetchImpl(`${base}/${c.fn}`, init);
      status = res.status;
      cors = res.headers.get('Access-Control-Allow-Origin') !== null;
      if (c.preflight) preflightProblem = checkPreflight(res.headers);
      await res.text();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    const statusOk = status === c.expectStatus;
    const corsOk = (!c.expectCors || cors) && !preflightProblem;
    results.push({
      label: c.label,
      ok: !error && statusOk && corsOk,
      detail: error
        ? `request failed: ${error}`
        : `status ${status} (want ${c.expectStatus})${c.expectCors ? `, CORS ${cors ? 'present' : 'MISSING'}` : ''}${preflightProblem ? `, ${preflightProblem}` : ''}`,
    });
  }
  return results;
}

// Run only when executed directly (decode the file URL; do not string-compare paths).
const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
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
