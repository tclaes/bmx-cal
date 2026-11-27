import { describe, it, expect } from 'vitest';
import { GEMINI_MODEL, geminiGenerateContentUrl } from '../../supabase/functions/_shared/gemini';

describe('edge shared gemini', () => {
  it('builds the generateContent URL for the configured model', () => {
    expect(geminiGenerateContentUrl('KEY')).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=KEY`,
    );
  });

  it('no longer uses the retired gemini-2.5-flash model', () => {
    expect(GEMINI_MODEL).not.toBe('gemini-2.5-flash');
  });
});
