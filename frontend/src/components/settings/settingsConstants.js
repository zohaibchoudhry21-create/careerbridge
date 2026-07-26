export const SETTINGS_DASHBOARD_CARD_DEFS = [
  {
    id: 'personal-information',
    icon: 'person',
    color: 'role',
    to: '/settings/personal-information',
  },
  {
    id: 'login-security',
    icon: 'shield_lock',
    color: 'security',
    to: '/settings/login-security',
  },
  {
    id: 'appearance',
    icon: 'palette',
    color: 'mode',
    to: '/settings/appearance',
  },
  {
    id: 'account-management',
    icon: 'manage_accounts',
    color: 'danger',
    to: '/settings/account-management',
  },
];

/** Must match backend `ACCOUNT_DELETE_CONFIRMATION` in settingsController.js */
export const DELETE_ACCOUNT_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';
