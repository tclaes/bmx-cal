import { describe, it, expect } from 'vitest';
import { GEMINI_MODEL, geminiGenerateContentUrl, geminiHeaders } from '../../supabase/functions/_shared/gemini';

describe('edge shared gemini', () => {
  it('uses gemini-3.8-flash', () => {
    expect(GEMINI_MODEL).toBe('gemini-3.8-flash');
  });

  it('builds the generateContent URL for the configured model, without a key', () => {
    const url = geminiGenerateContentUrl();
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
    );
    expect(url).not.toContain('key=');
  });

  it('sends the API key in the x-goog-api-key header', () => {
    expect(geminiHeaders('KEY')).toEqual({
      'Content-Type': 'application/json',
      'x-goog-api-key': 'KEY',
    });
  });
});
