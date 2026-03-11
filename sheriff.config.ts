import { noDependencies, sameTag, tag } from '@softarc/sheriff-core';

export const sheriffConfig = {
  tagging: {
    'src/features/calendar': tag('calendar'),
    'src/features/admin': tag('admin'),
    'src/shared/components': tag('components'),
    'src/shared/services': tag('services'),
    'src/data': tag('data'),
    'src/types': tag('types'),
  },
  depRules: {
    calendar: ['components', 'services', 'data', 'types'],
    admin: ['components', 'services', 'data', 'types'],
    components: ['types'],
    services: ['data', 'types'],
    data: ['types'],
    types: noDependencies,
  },
};
