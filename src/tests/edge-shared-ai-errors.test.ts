import { describe, it, expect } from 'vitest';
import {
  AI_FAILED_MESSAGE,
  AI_UNAVAILABLE_MESSAGE,
  AiServiceError,
  geminiError,
} from '../../supabase/functions/_shared/ai-errors';

const DEPLETED_BODY = JSON.stringify({
  error: { code: 402, message: 'Your prepayment credits are depleted.', status: 'RESOURCE_EXHAUSTED' },
});

describe('edge shared ai-errors', () => {
  it('maps depleted credits (402) to a 503 with a friendly message', () => {
    const err = geminiError(402, DEPLETED_BODY);
    expect(err).toBeInstanceOf(AiServiceError);
    expect(err.status).toBe(503);
    expect(err.message).toBe(AI_UNAVAILABLE_MESSAGE);
  });

  it('maps rate limiting (429) to a 503 with a friendly message', () => {
    const err = geminiError(429, 'quota');
    expect(err.status).toBe(503);
    expect(err.message).toBe(AI_UNAVAILABLE_MESSAGE);
  });

  it('maps other upstream failures to a 502 with a generic message', () => {
    for (const status of [400, 403, 500, 503]) {
      const err = geminiError(status, 'boom');
      expect(err.status).toBe(502);
      expect(err.message).toBe(AI_FAILED_MESSAGE);
    }
  });

  it('keeps the raw upstream body out of the message but in the detail', () => {
    const err = geminiError(402, DEPLETED_BODY);
    expect(err.message).not.toContain('prepayment');
    expect(err.detail).toContain('402');
    expect(err.detail).toContain('prepayment credits are depleted');
  });
});
