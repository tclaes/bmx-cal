import fs from 'node:fs';
import path from 'node:path';
import { noDependencies } from '@softarc/sheriff-core';

/**
 * Sheriff cannot resolve imports of .svelte files, so its dependency rules never see
 * a .svelte -> .svelte (or .ts -> .svelte) import. This rule applies the same
 * `modules` and `depRules` from sheriff.config.ts to exactly those imports.
 */
export function createSvelteBoundariesRule(sheriffConfig, root = process.cwd()) {
  const modules = Object.entries(sheriffConfig.modules)
    .map(([dir, tags]) => ({ dir: path.resolve(root, dir), tag: tags[0] }))
    .sort((a, b) => b.dir.length - a.dir.length); // longest path wins

  const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
  const aliases = Object.entries(tsconfig.compilerOptions.paths)
    .filter(([key]) => key.endsWith('/*'))
    .map(([key, [target]]) => [key.slice(0, -1), path.resolve(root, target.slice(0, -1))]);

  const moduleOf = (file) => modules.find((m) => file === m.dir || file.startsWith(m.dir + path.sep)) ?? { dir: root, tag: 'root' };

  const resolve = (spec, fromFile) => {
    if (spec.startsWith('.')) return path.resolve(path.dirname(fromFile), spec);
    const alias = aliases.find(([prefix]) => spec.startsWith(prefix));
    return alias ? path.join(alias[1], spec.slice(alias[0].length)) : null;
  };

  const allowed = (from, to) => {
    if (from.dir === to.dir) return true;
    const rule = sheriffConfig.depRules[from.tag];
    if (rule === noDependencies) return false;
    return Array.isArray(rule) && rule.includes(to.tag);
  };

  return {
    meta: { type: 'problem', schema: [] },
    create(context) {
      const check = (node, spec) => {
        if (typeof spec !== 'string' || !spec.endsWith('.svelte')) return;
        const file = context.filename;
        const target = resolve(spec, file);
        if (!target) return;
        const from = moduleOf(file);
        const to = moduleOf(target);
        if (!allowed(from, to)) {
          context.report({ node, message: `module ${path.relative(root, from.dir) || '.'} (${from.tag}) cannot import ${spec}: ${from.tag} has no clearance for tag ${to.tag}` });
        }
      };
      return {
        ImportDeclaration: (n) => check(n, n.source.value),
        ExportAllDeclaration: (n) => check(n, n.source?.value),
        ExportNamedDeclaration: (n) => n.source && check(n, n.source.value),
        ImportExpression: (n) => n.source.type === 'Literal' && check(n, n.source.value),
      };
    },
  };
}
