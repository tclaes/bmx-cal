import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
// Keep the function list in sync with `function-disallowed-list` in .stylelintrc.json.
const COLOR_LITERAL = /(^|[^&\w])#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/;

function collectTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'tests' ? [] : collectTsFiles(path);
    return /\.ts$/.test(name) && !/\.(test|spec)\.ts$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

describe('color tokens', () => {
  it.each([
    "const c = '#fff';",
    "const c = '#1d4ed8';",
    "const c = 'rgb(0 0 0)';",
    "const c = 'rgba(0, 0, 0, 0.5)';",
    "const c = 'hsl(10 20% 30%)';",
    "const c = 'hsla(10, 20%, 30%, 0.5)';",
    "const c = 'hwb(10 20% 30%)';",
    "const c = 'lab(50% 10 10)';",
    "const c = 'lch(50% 10 10)';",
    "const c = 'oklab(50% 0.1 0.1)';",
    "const c = 'oklch(60% 0.1 200)';",
    "const c = 'color(display-p3 1 0 0)';",
  ])('flags %s', (line) => {
    expect(COLOR_LITERAL.test(line)).toBe(true);
  });

  it.each(["const c = 'var(--color-primary)';", "const label = 'Tom &#9745; ok';", "const x = 'color-mix(in srgb, red, blue)';".replace('red, blue', 'var(--a), var(--b)')])(
    'allows %s',
    (line) => {
      expect(COLOR_LITERAL.test(line)).toBe(false);
    },
  );

  it('has no color literals in non-test TypeScript files', () => {
    const offenders = collectTsFiles(SRC).filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => COLOR_LITERAL.test(line)),
    );
    expect(offenders).toEqual([]);
  });
});
