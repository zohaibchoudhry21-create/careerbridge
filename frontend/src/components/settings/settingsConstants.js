export const SETTINGS_DASHBOARD_CARDS = [
  {
    id: 'personal-information',
    title: 'Personal Information',
    description: 'Update your personal details and profile information.',
    icon: 'person',
    color: 'role',
    to: '/settings/personal-information',
  },
  {
    id: 'login-security',
    title: 'Login & Security',
    description: 'Manage your password and secure your account.',
    icon: 'shield_lock',
    color: 'security',
    to: '/settings/login-security',
  },
  {
    id: 'appearance',
    title: 'Appearance & Language',
    description: 'Customize theme, language, and display preferences.',
    icon: 'palette',
    color: 'mode',
    to: '/settings/appearance',
  },
  {
    id: 'account-management',
    title: 'Account Management',
    description: 'Deactivate, delete, export data, or sign out.',
    icon: 'manage_accounts',
    color: 'danger',
    to: '/settings/account-management',
  },
];

/** Must match backend `ACCOUNT_DELETE_CONFIRMATION` in settingsController.js */
export const DELETE_ACCOUNT_CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';
