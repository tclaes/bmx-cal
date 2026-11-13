import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(__dirname, '..');
const COLOR_LITERAL = /(^|[^&\w])#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/;

function collectTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'tests' ? [] : collectTsFiles(path);
    return /\.ts$/.test(name) && !/\.(test|spec)\.ts$/.test(name) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

describe('color tokens', () => {
  it('has no color literals in non-test TypeScript files', () => {
    const offenders = collectTsFiles(SRC).filter((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .some((line) => COLOR_LITERAL.test(line) && !/&#\d+;/.test(line))
    );
    expect(offenders).toEqual([]);
  });
});
