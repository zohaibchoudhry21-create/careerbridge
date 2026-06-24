const TOKEN_COOKIE = 'cb_token';

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
