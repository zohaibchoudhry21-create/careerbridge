const TOKEN_COOKIE = 'cb_token';
const TWO_FACTOR_CHALLENGE_COOKIE = 'cb_2fa_challenge';

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

export const setAuthCookie = (res, token, remember = true) => {
  const options = { ...baseCookieOptions };

  if (remember) {
    const expireDays = Number(process.env.JWT_EXPIRE?.replace('d', '')) || 7;
    options.maxAge = expireDays * 24 * 60 * 60 * 1000;
  }

  res.cookie(TOKEN_COOKIE, token, options);
};

export const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE, baseCookieOptions);
};

export const setTwoFactorChallengeCookie = (res, challengeId) => {
  res.cookie(TWO_FACTOR_CHALLENGE_COOKIE, challengeId, {
    ...baseCookieOptions,
    maxAge: 5 * 60 * 1000,
  });
};

export const clearTwoFactorChallengeCookie = (res) => {
  res.clearCookie(TWO_FACTOR_CHALLENGE_COOKIE, baseCookieOptions);
};

export const getTwoFactorChallengeIdFromRequest = (req) =>
  req.cookies?.[TWO_FACTOR_CHALLENGE_COOKIE] || null;

export const getTokenFromRequest = (req) => {
  if (req.cookies?.[TOKEN_COOKIE]) {
    return req.cookies[TOKEN_COOKIE];
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

export default setAuthCookie;
