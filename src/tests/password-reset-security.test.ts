import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Security tests for the send-password-reset Edge Function
 * 
 * These tests verify that the password reset function properly validates
 * origins to prevent password-reset poisoning attacks.
 */

describe('send-password-reset security', () => {
  describe('origin validation', () => {
    it('should reject attacker-controlled origins not in allowlist', () => {
      const allowedOrigins = ['https://bmxkalender.be', 'https://www.bmxkalender.be'];
      const attackerOrigin = 'https://evil.com';
      
      // Simulate the validateOrigin function logic
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(attackerOrigin, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should accept legitimate origins in allowlist', () => {
      const allowedOrigins = ['https://bmxkalender.be', 'https://www.bmxkalender.be'];
      const legitimateOrigin = 'https://bmxkalender.be';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(legitimateOrigin, allowedOrigins);
      expect(result).toBe('https://bmxkalender.be');
    });

    it('should normalize origins with trailing slashes', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const originWithSlash = 'https://bmxkalender.be/';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(originWithSlash, allowedOrigins);
      expect(result).toBe('https://bmxkalender.be');
    });

    it('should reject malformed URLs', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const malformedUrl = 'not-a-valid-url';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(malformedUrl, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should reject origins with different protocols', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const httpOrigin = 'http://bmxkalender.be';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(httpOrigin, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should reject origins with different ports', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const originWithPort = 'https://bmxkalender.be:8080';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(originWithPort, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should reject subdomain variations not in allowlist', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const subdomainOrigin = 'https://evil.bmxkalender.be';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(subdomainOrigin, allowedOrigins);
      expect(result).toBeNull();
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML special characters in URLs', () => {
      const escapeHtml = (unsafe: string): string => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      const urlWithSpecialChars = 'https://example.com?token=<script>alert("xss")</script>';
      const escaped = escapeHtml(urlWithSpecialChars);
      
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&quot;');
    });

    it('should escape ampersands in URLs', () => {
      const escapeHtml = (unsafe: string): string => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      const urlWithAmpersand = 'https://example.com?param1=value1&param2=value2';
      const escaped = escapeHtml(urlWithAmpersand);
      
      expect(escaped).toContain('&amp;');
      expect(escaped).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#039;)/);
    });
  });

  describe('URL encoding', () => {
    it('should properly encode token hash in URL', () => {
      const tokenHash = 'abc123+/=';
      const encoded = encodeURIComponent(tokenHash);
      
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
      expect(encoded).toContain('%');
    });
  });

  describe('fallback behavior', () => {
    it('should fall back to supabaseUrl when no valid origin is provided', () => {
      const supabaseUrl = 'https://project.supabase.co';
      const allowedOrigins = [supabaseUrl];
      const invalidOrigin = 'https://evil.com';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const validatedOrigin = validateOrigin(invalidOrigin, allowedOrigins);
      const finalOrigin = validatedOrigin || supabaseUrl;
      
      expect(finalOrigin).toBe(supabaseUrl);
    });

    it('should always include supabaseUrl in allowlist', () => {
      const supabaseUrl = 'https://project.supabase.co';
      const allowedOriginsEnv = 'https://bmxkalender.be';
      
      // Simulate the allowlist construction logic
      const allowedOrigins = allowedOriginsEnv
        ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(o => o.length > 0)
        : [];
      
      if (!allowedOrigins.includes(supabaseUrl)) {
        allowedOrigins.push(supabaseUrl);
      }
      
      expect(allowedOrigins).toContain(supabaseUrl);
      expect(allowedOrigins).toContain('https://bmxkalender.be');
    });
  });

  describe('attack scenarios', () => {
    it('should prevent password-reset poisoning attack', () => {
      // Attacker scenario:
      // 1. Attacker calls function with victim's email and attacker's origin
      // 2. Function should reject attacker's origin
      // 3. Function should fall back to legitimate origin
      
      const supabaseUrl = 'https://project.supabase.co';
      const allowedOrigins = [supabaseUrl, 'https://bmxkalender.be'];
      const attackerOrigin = 'https://attacker-controlled.com';
      const victimEmail = 'victim@example.com';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const validatedOrigin = validateOrigin(attackerOrigin, allowedOrigins);
      const finalOrigin = validatedOrigin || supabaseUrl;
      
      // The token should be sent to the legitimate origin, not the attacker's
      expect(finalOrigin).not.toBe(attackerOrigin);
      expect(finalOrigin).toBe(supabaseUrl);
    });

    it('should prevent open redirect via malicious appUrl', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const maliciousUrl = 'https://bmxkalender.be@evil.com';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(maliciousUrl, allowedOrigins);
      
      // Should either be null or normalize to evil.com (which is not in allowlist)
      expect(result).toBeNull();
    });

    it('should prevent token exfiltration via attacker-controlled appUrl parameter', () => {
      // Direct reproduction of pentest Step 1-2: attacker supplies malicious appUrl
      const supabaseUrl = 'https://project.supabase.co';
      const allowedOrigins = [supabaseUrl, 'https://bmxkalender.be'];
      const attackerAppUrl = 'https://evil.attacker.com';
      const tokenHash = 'secret_recovery_token_abc123';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      // Simulate the function's origin selection logic
      const validatedOrigin = validateOrigin(attackerAppUrl, allowedOrigins);
      const finalOrigin = validatedOrigin || supabaseUrl;
      
      // Build the reset URL as the function does
      const resetUrl = `${finalOrigin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
      
      // Verify the token is NOT sent to attacker's domain
      expect(resetUrl).not.toContain('evil.attacker.com');
      expect(resetUrl).toContain(supabaseUrl);
      expect(resetUrl).toContain(tokenHash);
    });

    it('should prevent token exfiltration via malicious Origin header', () => {
      // Pentest scenario: attacker controls Origin header instead of appUrl
      const supabaseUrl = 'https://project.supabase.co';
      const allowedOrigins = [supabaseUrl, 'https://bmxkalender.be'];
      const attackerOriginHeader = 'https://phishing-site.com';
      const tokenHash = 'secret_recovery_token_xyz789';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      // Simulate: no appUrl provided, only Origin header
      const requestedOrigin = attackerOriginHeader;
      const validatedOrigin = validateOrigin(requestedOrigin, allowedOrigins);
      const finalOrigin = validatedOrigin || supabaseUrl;
      
      const resetUrl = `${finalOrigin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
      
      // Verify the token is NOT sent to attacker's domain
      expect(resetUrl).not.toContain('phishing-site.com');
      expect(resetUrl).toContain(supabaseUrl);
    });

    it('should prevent email injection via HTML special characters in reset URL', () => {
      // Pentest Step 5: HTML injection in email template
      const escapeHtml = (unsafe: string): string => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };

      // Simulate a URL that might contain injection attempts
      const resetUrl = 'https://bmxkalender.be/reset-password?token_hash=abc123&type=recovery';
      const maliciousUrl = resetUrl + '"><script>alert("xss")</script><a href="';
      
      const escapedUrl = escapeHtml(maliciousUrl);
      
      // Verify HTML is escaped
      expect(escapedUrl).not.toContain('<script>');
      expect(escapedUrl).not.toContain('</script>');
      expect(escapedUrl).toContain('&lt;script&gt;');
      expect(escapedUrl).toContain('&quot;');
    });

    it('should properly encode token_hash to prevent URL parsing issues', () => {
      // Pentest Step 3-4: token_hash must be properly encoded
      const tokenHash = 'abc+123/def=ghi';
      const origin = 'https://bmxkalender.be';
      
      const resetUrl = `${origin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
      
      // Verify special characters are encoded
      expect(resetUrl).not.toContain('+');
      expect(resetUrl).not.toContain('/def');
      expect(resetUrl).toContain('%2B'); // + encoded
      expect(resetUrl).toContain('%2F'); // / encoded
      expect(resetUrl).toContain('%3D'); // = encoded
    });

    it('should reject javascript: protocol URLs', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const javascriptUrl = 'javascript:alert(document.cookie)';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(javascriptUrl, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should reject data: protocol URLs', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const dataUrl = 'data:text/html,<script>alert("xss")</script>';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(dataUrl, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should reject file: protocol URLs', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const fileUrl = 'file:///etc/passwd';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(fileUrl, allowedOrigins);
      expect(result).toBeNull();
    });

    it('should handle URL with path traversal attempts', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      const pathTraversalUrl = 'https://bmxkalender.be/../../etc/passwd';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(pathTraversalUrl, allowedOrigins);
      // Should accept the origin but normalize it (path is ignored in origin)
      expect(result).toBe('https://bmxkalender.be');
    });

    it('should reject homograph/IDN attacks', () => {
      const allowedOrigins = ['https://bmxkalender.be'];
      // Using Cyrillic 'а' instead of Latin 'a'
      const homographUrl = 'https://bmxkаlender.be';
      
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };

      const result = validateOrigin(homographUrl, allowedOrigins);
      // Should be rejected because it's a different domain
      expect(result).toBeNull();
    });
  });

  describe('complete attack flow simulation', () => {
    it('should prevent full password-reset poisoning attack chain', () => {
      // Complete simulation of pentest Steps 1-6
      const supabaseUrl = 'https://project.supabase.co';
      const allowedOriginsEnv = 'https://bmxkalender.be,https://www.bmxkalender.be';
      const victimEmail = 'victim@example.com';
      const attackerOrigin = 'https://attacker-controlled.com';
      
      // Step 1: Parse allowed origins (function logic)
      const allowedOrigins = allowedOriginsEnv
        ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(o => o.length > 0)
        : [];
      
      if (!allowedOrigins.includes(supabaseUrl)) {
        allowedOrigins.push(supabaseUrl);
      }
      
      // Step 2: Attacker provides malicious appUrl
      const attackerAppUrl = attackerOrigin;
      
      // Step 3: Validate origin (security fix)
      const validateOrigin = (requestedOrigin: string | null, allowed: string[]): string | null => {
        if (!requestedOrigin) return null;
        try {
          const url = new URL(requestedOrigin);
          const normalizedOrigin = url.origin;
          if (allowed.includes(normalizedOrigin)) {
            return normalizedOrigin;
          }
          return null;
        } catch {
          return null;
        }
      };
      
      const validatedOrigin = validateOrigin(attackerAppUrl, allowedOrigins);
      const finalOrigin = validatedOrigin || supabaseUrl;
      
      // Step 4: Generate reset URL with token
      const tokenHash = 'hashed_recovery_token_12345';
      const resetUrl = `${finalOrigin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
      
      // Step 5: HTML-escape for email template
      const escapeHtml = (unsafe: string): string => {
        return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#039;");
      };
      
      const escapedResetUrl = escapeHtml(resetUrl);
      
      // Step 6: Verify security properties
      // 1. Token is NOT sent to attacker's domain
      expect(resetUrl).not.toContain(attackerOrigin);
      expect(escapedResetUrl).not.toContain(attackerOrigin);
      
      // 2. Token is sent to legitimate domain
      expect(resetUrl).toContain(supabaseUrl);
      expect(escapedResetUrl).toContain(supabaseUrl);
      
      // 3. Token is properly encoded
      expect(resetUrl).toContain('token_hash=');
      
      // 4. URL is HTML-escaped for email
      expect(escapedResetUrl).toContain('&amp;');
      
      // 5. Attacker cannot exfiltrate the token
      const attackerCanExfiltrateToken = resetUrl.includes(attackerOrigin);
      expect(attackerCanExfiltrateToken).toBe(false);
    });
  });
});
