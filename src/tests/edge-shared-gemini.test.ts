import { describe, it, expect, vi } from 'vitest';
import {
  GEMINI_MODEL,
  generateGeminiContent,
  geminiGenerateContentUrl,
  geminiHeaders,
} from '../../supabase/functions/_shared/gemini';
import { AI_FAILED_MESSAGE, AI_UNAVAILABLE_MESSAGE, AiServiceError } from '../../supabase/functions/_shared/gemini';

const OK_BODY = { candidates: [{ content: { parts: [{ text: '[]' }] } }] };

function ok() {
  return new Response(JSON.stringify(OK_BODY), { status: 200 });
}
function fail(status: number, message = 'boom') {
  return new Response(JSON.stringify({ error: { code: status, message } }), { status });
}

/** A fetch stub answering with `responses` in order, recording which model each call hit. */
function stubFetch(responses: Array<Response | Error>) {
  const models: string[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request) => {
    models.push(String(url).match(/models\/([^:]+):/)?.[1] ?? '?');
    const next = responses.shift();
    if (!next) throw new Error('unexpected extra fetch');
    if (next instanceof Error) throw next;
    return next;
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, models };
}

const noSleep = vi.fn(async (_ms: number) => {});

describe('edge shared gemini: request shape', () => {
  it('uses gemini-3.8-flash', () => {
    expect(GEMINI_MODEL).toBe('gemini-3.8-flash');
  });

  it('builds the generateContent URL without a key', () => {
    const url = geminiGenerateContentUrl();
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect(url).not.toContain('key=');
    expect(geminiGenerateContentUrl('other-model')).toContain('/models/other-model:generateContent');
  });

  it('sends the API key in the x-goog-api-key header', () => {
    expect(geminiHeaders('KEY')).toEqual({
      'Content-Type': 'application/json',
      'x-goog-api-key': 'KEY',
    });
  });

  it('posts the body as JSON with the key header', async () => {
    const { fetchImpl } = stubFetch([ok()]);
    await generateGeminiContent('KEY', { a: 1 }, { fetchImpl, sleep: noSleep });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['x-goog-api-key']).toBe('KEY');
    expect(init.body).toBe('{"a":1}');
  });
});

describe('edge shared gemini: retry and fallback', () => {
  it('returns the first successful response', async () => {
    const { fetchImpl, models } = stubFetch([ok()]);
    await expect(generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep })).resolves.toEqual(OK_BODY);
    expect(models).toEqual(['gemini-3.8-flash']);
  });

  it('retries an overloaded model (503) and succeeds', async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const { fetchImpl, models } = stubFetch([fail(503), fail(503), ok()]);
    await expect(generateGeminiContent('K', {}, { fetchImpl, sleep })).resolves.toEqual(OK_BODY);
    expect(models).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash']);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000]);
  });

  it('retries rate limits (429), internal errors (500) and network errors', async () => {
    const { fetchImpl } = stubFetch([fail(429), fail(500), new TypeError('fetch failed'), ok()]);
    await expect(
      generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep, maxAttempts: 4 }),
    ).resolves.toEqual(OK_BODY);
  });

  it('does not retry a non-retryable failure', async () => {
    const { fetchImpl, models } = stubFetch([fail(400)]);
    const err = await generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep, fallbackModel: 'lite' }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(AiServiceError);
    expect(err.status).toBe(502);
    expect(err.message).toBe(AI_FAILED_MESSAGE);
    expect(models).toEqual(['gemini-3.8-flash']);
  });

  it('falls back to the fallback model after the primary keeps failing', async () => {
    const { fetchImpl, models } = stubFetch([fail(503), fail(503), fail(503), ok()]);
    await expect(
      generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep, fallbackModel: 'lite' }),
    ).resolves.toEqual(OK_BODY);
    expect(models).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash', 'lite']);
  });

  it('reports "unavailable" when every attempt is overloaded, with every attempt in the detail', async () => {
    const { fetchImpl } = stubFetch([fail(503, 'high demand'), fail(503), fail(503)]);
    const err = await generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep }).catch((e) => e);
    expect(err).toBeInstanceOf(AiServiceError);
    expect(err.status).toBe(503);
    expect(err.message).toBe(AI_UNAVAILABLE_MESSAGE);
    expect(err.detail).toContain('high demand');
    expect(err.detail.match(/attempt/g)).toHaveLength(3);
  });

  it('reports the primary failure when the fallback model is broken (404)', async () => {
    const { fetchImpl, models } = stubFetch([fail(503), fail(503), fail(503), fail(404, 'no such model')]);
    const err = await generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep, fallbackModel: 'gone' }).catch(
      (e) => e,
    );
    expect(err.status).toBe(503);
    expect(err.message).toBe(AI_UNAVAILABLE_MESSAGE);
    expect(err.detail).toContain('no such model');
    expect(models).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash', 'gemini-3.8-flash', 'gone']);
  });

  it('ignores an empty or identical fallback model', async () => {
    for (const fallbackModel of ['', undefined, GEMINI_MODEL]) {
      const { fetchImpl, models } = stubFetch([fail(503), fail(503), fail(503)]);
      await generateGeminiContent('K', {}, { fetchImpl, sleep: noSleep, fallbackModel }).catch(() => {});
      expect(models).toHaveLength(3);
    }
  });
});
