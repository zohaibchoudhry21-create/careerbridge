import crypto from 'crypto';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map();

const purgeExpiredChallenges = () => {
  const now = Date.now();

  for (const [id, entry] of challenges.entries()) {
    if (entry.expiresAt <= now) {
      challenges.delete(id);
    }
  }
};

export const createTwoFactorChallenge = (payload) => {
  purgeExpiredChallenges();

  const challengeId = crypto.randomBytes(32).toString('hex');
  challenges.set(challengeId, {
    ...payload,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    failedAttempts: 0,
  });

  return challengeId;
};

export const getTwoFactorChallenge = (challengeId) => {
  if (!challengeId) return null;

  purgeExpiredChallenges();

  const entry = challenges.get(challengeId);
  if (!entry || entry.expiresAt <= Date.now()) {
    challenges.delete(challengeId);
    return null;
  }

  return entry;
};

export const consumeTwoFactorChallenge = (challengeId) => {
  const entry = getTwoFactorChallenge(challengeId);
  if (!entry) return null;
  challenges.delete(challengeId);
  return entry;
};

export const incrementTwoFactorChallengeFailures = (challengeId) => {
  const entry = getTwoFactorChallenge(challengeId);
  if (!entry) return null;

  entry.failedAttempts = (entry.failedAttempts || 0) + 1;
  challenges.set(challengeId, entry);
  return entry.failedAttempts;
};

export const MAX_TWO_FACTOR_VERIFY_ATTEMPTS = 5;

export default createTwoFactorChallenge;
