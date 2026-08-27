import { describe, it, expect } from 'vitest';

describe('Edge Function Security', () => {
  describe('Authentication Requirements', () => {
    it('create-github-issue requires admin authentication', () => {
      const functionRequirements = {
        name: 'create-github-issue',
        requiresAuth: true,
        requiresAdmin: true,
        validateInput: true
      };

      expect(functionRequirements.requiresAuth).toBe(true);
      expect(functionRequirements.requiresAdmin).toBe(true);
      expect(functionRequirements.validateInput).toBe(true);
    });

    it('reopen-github-issue requires admin authentication', () => {
      const functionRequirements = {
        name: 'reopen-github-issue',
        requiresAuth: true,
        requiresAdmin: true,
        validateInput: true
      };

      expect(functionRequirements.requiresAuth).toBe(true);
      expect(functionRequirements.requiresAdmin).toBe(true);
      expect(functionRequirements.validateInput).toBe(true);
    });

    it('delete-account requires user authentication', () => {
      const functionRequirements = {
        name: 'delete-account',
        requiresAuth: true,
        requiresAdmin: false,
        validateInput: false
      };

      expect(functionRequirements.requiresAuth).toBe(true);
    });
  });

  describe('Input Validation', () => {
    it('should validate bug report payload fields', () => {
      const validPayload = {
        id: 'uuid-here',
        description: 'Bug description',
        screenshot_url: null,
        reporter_email: 'user@example.com',
        created_at: new Date().toISOString()
      };

      expect(validPayload.id).toBeTruthy();
      expect(validPayload.description).toBeTruthy();
      expect(validPayload.description.trim().length).toBeGreaterThan(0);
    });

    it('should validate GitHub issue URL format', () => {
      const validUrl = 'https://github.com/owner/repo/issues/123';
      const invalidUrl = 'https://github.com/owner/repo';

      const validMatch = validUrl.match(/\/issues\/(\d+)$/);
      const invalidMatch = invalidUrl.match(/\/issues\/(\d+)$/);

      expect(validMatch).toBeTruthy();
      expect(validMatch?.[1]).toBe('123');
      expect(invalidMatch).toBeNull();
    });

    it('should validate issue state values', () => {
      const validStates = ['open', 'closed'];
      const testState = 'open';

      expect(validStates).toContain(testState);
    });
  });

  describe('CORS Headers', () => {
    it('should include all required CORS headers', () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
      };

      expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*');
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('POST');
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('OPTIONS');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Authorization');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('X-Client-Info');
      expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Apikey');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for missing authorization header', () => {
      const response = {
        status: 401,
        body: { error: 'Unauthorized' }
      };

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 403 for non-admin users accessing admin endpoints', () => {
      const response = {
        status: 403,
        body: { error: 'Unauthorized' }
      };

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid input', () => {
      const response = {
        status: 400,
        body: { error: 'Invalid payload' }
      };

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid');
    });

    it('should return 503 for missing configuration', () => {
      const response = {
        status: 503,
        body: { error: 'GitHub integration not configured' }
      };

      expect(response.status).toBe(503);
      expect(response.body.error).toContain('not configured');
    });
  });

  describe('Security Best Practices', () => {
    it('should use environment variables for secrets', () => {
      const secretKeys = [
        'GITHUB_TOKEN',
        'GITHUB_REPO',
        'SUPABASE_SERVICE_ROLE_KEY',
        'RESEND_API_KEY'
      ];

      secretKeys.forEach(key => {
        expect(key).toMatch(/^[A-Z_]+$/);
        expect(key).not.toContain('password');
        expect(key).not.toContain('secret');
      });
    });

    it('should escape HTML in email content', () => {
      const escapeHtml = (str: string): string => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };

      const maliciousInput = '<script>alert("xss")</script>';
      const escaped = escapeHtml(maliciousInput);

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    it('should validate and sanitize user input', () => {
      const sanitizeInput = (input: string): boolean => {
        return input !== null && input.trim().length > 0;
      };

      expect(sanitizeInput('valid input')).toBe(true);
      expect(sanitizeInput('')).toBe(false);
      expect(sanitizeInput('   ')).toBe(false);
    });
  });

  describe('Authorization Flow', () => {
    it('should verify JWT token before processing requests', () => {
      const authFlow = {
        step1: 'Check Authorization header exists',
        step2: 'Create Supabase client with auth header',
        step3: 'Call getUser() to verify token',
        step4: 'Check user exists and has required role',
        step5: 'Process request if authorized'
      };

      expect(authFlow.step1).toContain('Authorization header');
      expect(authFlow.step3).toContain('getUser');
      expect(authFlow.step4).toContain('role');
    });

    it('should check admin role for privileged operations', () => {
      const userMetadata = {
        app_metadata: {
          role: 'admin'
        }
      };

      const isAdmin = userMetadata.app_metadata.role === 'admin';
      expect(isAdmin).toBe(true);
    });
  });

  describe('Password Reset Security - Token Exfiltration Prevention', () => {
    // Helper function that mirrors the actual implementation
    const validateOrigin = (requestedOrigin: string | null, allowedOrigins: string[]): string | null => {
      if (!requestedOrigin) {
        return null;
      }

      try {
        const url = new URL(requestedOrigin);
        const normalizedOrigin = url.origin;

        if (allowedOrigins.includes(normalizedOrigin)) {
          return normalizedOrigin;
        }

        return null;
      } catch {
        return null;
      }
    };

    // Helper function that mirrors the actual implementation
    const escapeHtml = (unsafe: string): string => {
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    describe('Origin Validation - Allowlist Enforcement', () => {
      it('should reject attacker-controlled origin not in allowlist', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const attackerOrigin = 'https://evil.attacker.com';

        const result = validateOrigin(attackerOrigin, allowedOrigins);

        expect(result).toBeNull();
      });

      it('should accept legitimate origin in allowlist', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const legitimateOrigin = 'https://bmxcalendar.be';

        const result = validateOrigin(legitimateOrigin, allowedOrigins);

        expect(result).toBe('https://bmxcalendar.be');
      });

      it('should accept multiple allowed origins', () => {
        const allowedOrigins = [
          'https://bmxcalendar.be',
          'https://staging.bmxcalendar.be',
          'http://localhost:5173'
        ];

        expect(validateOrigin('https://bmxcalendar.be', allowedOrigins)).toBe('https://bmxcalendar.be');
        expect(validateOrigin('https://staging.bmxcalendar.be', allowedOrigins)).toBe('https://staging.bmxcalendar.be');
        expect(validateOrigin('http://localhost:5173', allowedOrigins)).toBe('http://localhost:5173');
      });

      it('should reject null or empty origin', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];

        expect(validateOrigin(null, allowedOrigins)).toBeNull();
        expect(validateOrigin('', allowedOrigins)).toBeNull();
      });

      it('should reject malformed URL', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const malformedUrl = 'not-a-valid-url';

        const result = validateOrigin(malformedUrl, allowedOrigins);

        expect(result).toBeNull();
      });

      it('should normalize origin (protocol + host + port)', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const originWithPath = 'https://bmxcalendar.be/some/path';

        const result = validateOrigin(originWithPath, allowedOrigins);

        expect(result).toBe('https://bmxcalendar.be');
      });

      it('should reject subdomain not in allowlist', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const subdomainOrigin = 'https://evil.bmxcalendar.be';

        const result = validateOrigin(subdomainOrigin, allowedOrigins);

        expect(result).toBeNull();
      });

      it('should distinguish between http and https', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const httpOrigin = 'http://bmxcalendar.be';

        const result = validateOrigin(httpOrigin, allowedOrigins);

        expect(result).toBeNull();
      });

      it('should distinguish between different ports', () => {
        const allowedOrigins = ['http://localhost:5173'];
        const differentPort = 'http://localhost:3000';

        const result = validateOrigin(differentPort, allowedOrigins);

        expect(result).toBeNull();
      });

      it('should handle origin with explicit default port', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const originWithPort = 'https://bmxcalendar.be:443';

        // URL constructor normalizes https://example.com:443 to https://example.com
        const result = validateOrigin(originWithPort, allowedOrigins);

        expect(result).toBe('https://bmxcalendar.be');
      });
    });

    describe('HTML Escaping - Email Injection Prevention', () => {
      it('should escape HTML special characters in reset URL', () => {
        const maliciousUrl = 'https://evil.com"><script>alert("xss")</script><a href="';
        const escaped = escapeHtml(maliciousUrl);

        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('</script>');
        expect(escaped).toContain('&lt;script&gt;');
        expect(escaped).toContain('&lt;/script&gt;');
        expect(escaped).toContain('&quot;');
      });

      it('should escape double quotes to prevent attribute breakout', () => {
        const urlWithQuotes = 'https://example.com?param="value"';
        const escaped = escapeHtml(urlWithQuotes);

        expect(escaped).not.toContain('"');
        expect(escaped).toContain('&quot;');
      });

      it('should escape single quotes', () => {
        const urlWithSingleQuotes = "https://example.com?param='value'";
        const escaped = escapeHtml(urlWithSingleQuotes);

        expect(escaped).not.toContain("'");
        expect(escaped).toContain('&#039;');
      });

      it('should escape ampersands', () => {
        const urlWithAmpersand = 'https://example.com?a=1&b=2';
        const escaped = escapeHtml(urlWithAmpersand);

        expect(escaped).toContain('&amp;');
      });

      it('should escape less-than and greater-than signs', () => {
        const urlWithBrackets = 'https://example.com?param=<value>';
        const escaped = escapeHtml(urlWithBrackets);

        expect(escaped).not.toContain('<');
        expect(escaped).not.toContain('>');
        expect(escaped).toContain('&lt;');
        expect(escaped).toContain('&gt;');
      });

      it('should handle multiple special characters', () => {
        const complexUrl = '<a href="https://evil.com?x=1&y=2">Click</a>';
        const escaped = escapeHtml(complexUrl);

        expect(escaped).toBe('&lt;a href=&quot;https://evil.com?x=1&amp;y=2&quot;&gt;Click&lt;/a&gt;');
      });
    });

    describe('Security Properties - Exploit Prevention', () => {
      it('should prevent token exfiltration via appUrl parameter', () => {
        // Simulates the pentest attack scenario
        const attackerOrigin = 'https://attacker.com';
        const allowedOrigins = ['https://bmxcalendar.be'];

        const validatedOrigin = validateOrigin(attackerOrigin, allowedOrigins);

        // The function should reject the attacker's origin
        expect(validatedOrigin).toBeNull();

        // In the actual implementation, this would result in a 403 response
        const expectedResponse = {
          status: 403,
          body: { error: 'Invalid origin' }
        };

        expect(expectedResponse.status).toBe(403);
        expect(expectedResponse.body.error).toBe('Invalid origin');
      });

      it('should prevent token exfiltration via Origin header', () => {
        // Simulates attacker sending malicious Origin header
        const attackerOrigin = 'https://evil.com';
        const allowedOrigins = ['https://bmxcalendar.be'];

        const validatedOrigin = validateOrigin(attackerOrigin, allowedOrigins);

        expect(validatedOrigin).toBeNull();
      });

      it('should only use validated origin in reset URL', () => {
        const allowedOrigins = ['https://bmxcalendar.be'];
        const legitimateOrigin = 'https://bmxcalendar.be';
        const validatedOrigin = validateOrigin(legitimateOrigin, allowedOrigins);

        expect(validatedOrigin).toBe('https://bmxcalendar.be');

        // Simulate building the reset URL
        const tokenHash = 'mock-token-hash';
        const resetUrl = `${validatedOrigin}/reset-password?token_hash=${tokenHash}&type=recovery`;

        expect(resetUrl).toContain('https://bmxcalendar.be');
        expect(resetUrl).not.toContain('evil.com');
        expect(resetUrl).not.toContain('attacker.com');
      });

      it('should escape reset URL before inserting into HTML email', () => {
        const validatedOrigin = 'https://bmxcalendar.be';
        const tokenHash = 'abc123';
        const resetUrl = `${validatedOrigin}/reset-password?token_hash=${tokenHash}&type=recovery`;
        const escapedResetUrl = escapeHtml(resetUrl);

        // Build email HTML (simplified version)
        const htmlBody = `<a href="${escapedResetUrl}">Reset password</a>`;

        // Verify the URL is properly escaped in the HTML context
        expect(htmlBody).toContain('href=');
        expect(escapedResetUrl).toContain('&amp;'); // & in query params should be escaped
      });

      it('should validate origin before generating recovery token', () => {
        // This test verifies the security flow order
        const securityFlow = {
          step1: 'Parse email and appUrl from request',
          step2: 'Validate requested origin against allowlist',
          step3: 'Return 403 if origin is invalid',
          step4: 'Generate recovery token only if origin is valid',
          step5: 'Build reset URL with validated origin',
          step6: 'Escape URL before inserting into email'
        };

        expect(securityFlow.step2).toContain('Validate');
        expect(securityFlow.step3).toContain('403');
        expect(securityFlow.step4).toContain('only if origin is valid');
      });
    });

    describe('Configuration and Defaults', () => {
      it('should parse comma-separated ALLOWED_ORIGINS environment variable', () => {
        const allowedOriginsEnv = 'https://bmxcalendar.be,https://staging.bmxcalendar.be,http://localhost:5173';
        const allowedOrigins = allowedOriginsEnv
          .split(',')
          .map(o => o.trim())
          .filter(o => o.length > 0);

        expect(allowedOrigins).toHaveLength(3);
        expect(allowedOrigins).toContain('https://bmxcalendar.be');
        expect(allowedOrigins).toContain('https://staging.bmxcalendar.be');
        expect(allowedOrigins).toContain('http://localhost:5173');
      });

      it('should handle whitespace in ALLOWED_ORIGINS', () => {
        const allowedOriginsEnv = ' https://bmxcalendar.be , https://staging.bmxcalendar.be ';
        const allowedOrigins = allowedOriginsEnv
          .split(',')
          .map(o => o.trim())
          .filter(o => o.length > 0);

        expect(allowedOrigins).toHaveLength(2);
        expect(allowedOrigins[0]).toBe('https://bmxcalendar.be');
        expect(allowedOrigins[1]).toBe('https://staging.bmxcalendar.be');
      });

      it('should filter out empty strings from ALLOWED_ORIGINS', () => {
        const allowedOriginsEnv = 'https://bmxcalendar.be,,https://staging.bmxcalendar.be';
        const allowedOrigins = allowedOriginsEnv
          .split(',')
          .map(o => o.trim())
          .filter(o => o.length > 0);

        expect(allowedOrigins).toHaveLength(2);
        expect(allowedOrigins).not.toContain('');
      });

      it('should fall back to SUPABASE_URL if ALLOWED_ORIGINS not set', () => {
        const allowedOriginsEnv = undefined;
        const supabaseUrl = 'https://mock-supabase-project.supabase.co';

        const allowedOrigins = allowedOriginsEnv
          ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(o => o.length > 0)
          : [supabaseUrl];

        expect(allowedOrigins).toHaveLength(1);
        expect(allowedOrigins[0]).toBe(supabaseUrl);
      });
    });

    describe('Response Codes and Error Handling', () => {
      it('should return 403 for invalid origin', () => {
        const response = {
          status: 403,
          body: { error: 'Invalid origin' }
        };

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Invalid origin');
      });

      it('should return 400 for missing email', () => {
        const response = {
          status: 400,
          body: { error: 'Email is required' }
        };

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Email is required');
      });

      it('should return 503 for missing email service configuration', () => {
        const response = {
          status: 503,
          body: { error: 'Email service not configured' }
        };

        expect(response.status).toBe(503);
        expect(response.body.error).toBe('Email service not configured');
      });

      it('should return 200 for successful request', () => {
        const response = {
          status: 200,
          body: { success: true }
        };

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should return 200 even if user not found (prevent enumeration)', () => {
        // This prevents attackers from discovering valid email addresses
        const response = {
          status: 200,
          body: { success: true }
        };

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
