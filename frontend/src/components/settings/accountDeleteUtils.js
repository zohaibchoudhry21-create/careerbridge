import { DELETE_ACCOUNT_CONFIRMATION_PHRASE } from './settingsConstants';

export const normalizeAccountEmail = (email) =>
  String(email || '').trim().toLowerCase();

export const normalizeDeletePhrase = (phrase) =>
  String(phrase || '').trim().replace(/\s+/g, ' ').toUpperCase();

export const resolveAuthProvider = (user) =>
  String(user?.provider || user?.authProvider || 'local').trim().toLowerCase();

export const isLocalAuthAccount = (user) => resolveAuthProvider(user) === 'local';

export const isDeletePhraseValid = (phrase) =>
  normalizeDeletePhrase(phrase) === DELETE_ACCOUNT_CONFIRMATION_PHRASE;

export const isDeleteEmailValid = (user, confirmEmail) =>
  normalizeAccountEmail(confirmEmail) === normalizeAccountEmail(user?.email);

export const evaluateDeleteRequirements = ({
  user,
  deleteAcknowledged,
  deletePassword,
  confirmEmail,
  confirmPhrase,
}) => {
  if (!deleteAcknowledged) {
    return { met: false, reason: 'acknowledge' };
  }

  if (isLocalAuthAccount(user)) {
    if (!deletePassword.trim()) {
      return { met: false, reason: 'password' };
    }
    return { met: true, reason: null };
  }

  if (!isDeleteEmailValid(user, confirmEmail)) {
    return { met: false, reason: 'email' };
  }

  if (!isDeletePhraseValid(confirmPhrase)) {
    return { met: false, reason: 'phrase' };
  }

  return { met: true, reason: null };
};

export const getDeleteRequirementMessageKey = (reason) => {
  switch (reason) {
    case 'acknowledge':
      return 'account.delete.requirements.acknowledge';
    case 'email':
      return 'account.delete.requirements.email';
    case 'phrase':
      return 'account.delete.requirements.phrase';
    case 'password':
      return 'account.delete.requirements.password';
    default:
      return 'account.delete.requirementsPending';
  }
};
