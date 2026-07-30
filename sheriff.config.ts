import { noDependencies, SheriffConfig } from '@softarc/sheriff-core';

export const sheriffConfig: SheriffConfig = {
  entryFile: 'src/main.ts',
  modules: {
    // Features
    'src/features/calendar': 'calendar',
    'src/features/admin': 'admin',
    'src/features/about': 'about',
    'src/features/auth': 'auth',
    'src/features/bug-report': 'bug-report',
    'src/features/guide': 'guide',
    'src/features/legal': 'legal',
    'src/features/my-events': 'my-events',
    'src/features/profile': 'profile',
    'src/features/team-manager': 'team-manager',
    // Shared
    'src/shared/components': 'components',
    'src/shared/services': 'services',
    'src/shared/stores': 'stores',
    'src/shared/utils': 'utils',
    // Cross-cutting
    'src/data': 'data',
    'src/types': 'types',
    'src/i18n': 'i18n',
    'src/router': 'router',
    'src/config': 'config',
  },
  depRules: {
    // Features depend only on what they actually use (tightened per folder)
    calendar: ['components', 'services', 'stores', 'utils', 'i18n', 'types'],
    admin: ['components', 'services', 'stores', 'utils', 'bug-report', 'types'],
    about: ['router', 'i18n'],
    auth: ['router', 'i18n'],
    'bug-report': ['components', 'stores', 'data', 'types'],
    guide: ['router', 'i18n'],
    legal: noDependencies,
    'my-events': ['components', 'services', 'stores', 'utils', 'i18n', 'router', 'types'],
    profile: ['components', 'services', 'stores', 'data', 'router', 'config', 'i18n'],
    'team-manager': ['components', 'services', 'stores', 'utils', 'data', 'admin', 'types'],
    // Shared layers
    components: ['utils', 'stores', 'services', 'router', 'i18n', 'types'],
    services: ['data', 'types'],
    stores: ['services', 'data', 'utils', 'types'],
    utils: ['config', 'types'],
    // Cross-cutting
    data: noDependencies,
    types: noDependencies,
    i18n: noDependencies,
    router: ['utils'],
    config: noDependencies,
  },
};
