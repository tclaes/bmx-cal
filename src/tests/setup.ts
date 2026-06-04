import '@testing-library/jest-dom';
import { configureAxe } from 'vitest-axe';
import { toHaveNoViolations } from 'vitest-axe/matchers';

configureAxe({
  globalOptions: {
    rules: [{ id: 'color-contrast', enabled: false }],
  },
});

expect.extend({ toHaveNoViolations });
