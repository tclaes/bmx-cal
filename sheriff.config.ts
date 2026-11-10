import { noDependencies } from '@softarc/sheriff-core';

const tag = (name: string) => [name];

export const sheriffConfig = {
  entryFile: 'src/main.ts',
  // Modules are only the folders below. Deep imports inside the project are allowed,
  // so folders with their own index.ts are no separate (untagged) modules.
  enableBarrelLess: true,
  autoTagging: false,
  modules: {
    'src/features/calendar': tag('calendar'),
    'src/features/admin': tag('admin'),
    'src/features/auth': tag('auth'),
    'src/features/bug-report': tag('bug-report'),
    'src/features/my-events': tag('my-events'),
    'src/features/profile': tag('profile'),
    'src/features/team-manager': tag('team-manager'),
    'src/libs/ui': tag('ui'),
    'src/libs/core/services': tag('services'),
    'src/libs/core/stores': tag('stores'),
    'src/shared': tag('shared'),
    'src/shared/utils': tag('shared'),
    'src/layout': tag('layout'),
    'src/data': tag('data'),
    'src/types': tag('types'),
    'src/config': tag('config'),
    'src/router': tag('router'),
    'src/i18n': tag('i18n'),
  },
  depRules: {
    // src/main.ts is the app entry: it wires up the update check and stores.
    root: ['stores', 'shared'],
    calendar: ['ui', 'shared', 'services', 'stores', 'data', 'types'],
    admin: ['ui', 'shared', 'services', 'stores', 'data', 'types', 'bug-report'],
    auth: ['ui', 'shared', 'services', 'stores', 'data', 'types'],
    'bug-report': ['ui', 'stores', 'data', 'types'],
    'my-events': ['ui', 'shared', 'services', 'stores', 'types'],
    profile: ['ui', 'shared', 'services', 'stores', 'data', 'types', 'config'],
    'team-manager': ['ui', 'shared', 'services', 'stores', 'data', 'types'],
    shared: ['ui', 'stores', 'services', 'types', 'i18n', 'config'],
    layout: ['shared', 'ui', 'services', 'stores', 'types', 'config', 'router', 'i18n'],
    ui: ['types', 'shared'],
    services: ['data', 'types'],
    stores: ['services', 'shared', 'types', 'data'],
    data: ['types'],
    types: noDependencies,
    config: noDependencies,
    router: ['shared'],
    i18n: noDependencies,
  },
};
