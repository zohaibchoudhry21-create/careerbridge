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

export const createReactivationChallenge = (payload) => {
  purgeExpiredChallenges();

  const challengeId = crypto.randomBytes(32).toString('hex');
  challenges.set(challengeId, {
    ...payload,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });

  return challengeId;
};

export const getReactivationChallenge = (challengeId) => {
  if (!challengeId) return null;

  purgeExpiredChallenges();

  const entry = challenges.get(challengeId);
  if (!entry || entry.expiresAt <= Date.now()) {
    challenges.delete(challengeId);
    return null;
  }

  return entry;
};

export const consumeReactivationChallenge = (challengeId) => {
  const entry = getReactivationChallenge(challengeId);
  if (!entry) return null;
  challenges.delete(challengeId);
  return entry;
};

export default createReactivationChallenge;
