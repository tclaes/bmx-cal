/** Registration states derived from getRegistrationStatus(); compare against these instead of string literals. */
export const REGISTRATION_STATE = {
  open: 'open',
  soon: 'soon',
  closed: 'closed',
  register: 'register',
} as const;

export type RegistrationState = (typeof REGISTRATION_STATE)[keyof typeof REGISTRATION_STATE];
