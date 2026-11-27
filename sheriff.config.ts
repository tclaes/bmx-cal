import { noDependencies } from '@softarc/sheriff-core';

const tag = (name: string) => [name];

const featureDeps = ['ui', 'shared', 'services', 'stores', 'data', 'types', 'i18n', 'router'];

export const sheriffConfig = {
  entryFile: 'src/main.ts',
  // Modules are only the folders below. Deep imports inside the project are allowed,
  // so folders with their own index.ts are no separate (untagged) modules.
  enableBarrelLess: true,
  autoTagging: false,
  // Sheriff cannot resolve .svelte files, so these imports are skipped here.
  // eslint.config.js adds restrictions for deep .svelte imports instead.
  ignoreFileExtensions: (defaults: string[]) => [...defaults, 'svelte'],
  modules: {
    'src/features/about': tag('about'),
    'src/features/calendar': tag('calendar'),
    'src/features/admin': tag('admin'),
    'src/features/auth': tag('auth'),
    'src/features/bug-report': tag('bug-report'),
    'src/features/guide': tag('guide'),
    'src/features/legal': tag('legal'),
    'src/features/my-events': tag('my-events'),
    'src/features/news': tag('news'),
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
    root: ['stores', 'shared', 'layout'],
    about: featureDeps,
    calendar: featureDeps,
    // The admin dashboard embeds team-manager's TeamMemberManager.
    admin: [...featureDeps, 'bug-report', 'team-manager'],
    auth: featureDeps,
    'bug-report': [...featureDeps],
    guide: featureDeps,
    legal: featureDeps,
    'my-events': featureDeps,
    news: featureDeps,
    profile: [...featureDeps, 'config'],
    'team-manager': featureDeps,
    // shared/DocumentUpload and its parsers talk to supabase.
    shared: ['shared', 'ui', 'stores', 'services', 'data', 'types', 'i18n', 'config'],
    layout: ['shared', 'ui', 'services', 'stores', 'types', 'config', 'router', 'i18n'],
    ui: ['types', 'shared'],
    services: ['data', 'types'],
    // The update store compares the bundled APP_VERSION with the published release.
    stores: ['services', 'shared', 'types', 'data', 'config'],
    data: ['types'],
    types: noDependencies,
    config: noDependencies,
    // The router lazy-loads the feature pages.
    router: ['shared', 'i18n', 'stores', 'about', 'admin', 'auth', 'bug-report', 'calendar', 'guide', 'legal', 'my-events', 'news', 'profile', 'team-manager'],
    i18n: noDependencies,
  },
};
