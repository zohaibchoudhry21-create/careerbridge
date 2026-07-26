import passport from 'passport';
import { createAuthCode } from '../utils/authCodeStore.js';
import { isProviderConfigured } from '../config/passport.js';
import { ERROR_CODES, isErrorCode } from '../constants/apiErrorCodes.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

export const SOCIAL_AUTH_SCOPES = {
  google: ['openid', 'profile', 'email'],
  facebook: ['email'],
  linkedin: ['openid', 'profile', 'email'],
};

const redirectFrontendSocialCallback = (req, res) => {
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  return res.redirect(`${CLIENT_URL}/auth/social/callback${query}`);
};

export { redirectFrontendSocialCallback };

export const getSocialAuthStatus = (_req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const providers = ['google', 'facebook', 'linkedin'].map((provider) => ({
    id: provider,
    name: provider.charAt(0).toUpperCase() + provider.slice(1),
    configured: isProviderConfigured(provider),
    authUrl: `${API_URL}/auth/${provider}`,
    callbackUrl: `${API_URL}/auth/${provider}/callback`,
    ...(isProduction ? {} : { alternateCallbackUrl: `${API_URL}/api/auth/${provider}/callback` }),
  }));

  res.json({
    success: true,
    ready: providers.some((provider) => provider.configured),
    clientUrl: CLIENT_URL,
    providers,
  });
};

const redirectWithErrorCode = (res, code, params = {}) => {
  const search = new URLSearchParams({ errorCode: code });
  if (params && Object.keys(params).length > 0) {
    search.set('errorParams', JSON.stringify(params));
  }
  return res.redirect(`${CLIENT_URL}/auth/social/callback?${search.toString()}`);
};

const resolveSocialError = (err, fallbackCode = ERROR_CODES.SOCIAL.AUTH_FAILED) => {
  if (err?.code && isErrorCode(err.code)) {
    return { code: err.code, params: err.params || {} };
  }

  if (typeof err?.message === 'string' && isErrorCode(err.message)) {
    return { code: err.message, params: {} };
  }

  return { code: fallbackCode, params: {} };
};

const getProviderAuthOptions = (provider) => {
  const options = {
    scope: SOCIAL_AUTH_SCOPES[provider],
    session: false,
  };

  if (provider === 'google') {
    options.prompt = process.env.GOOGLE_OAUTH_PROMPT || 'select_account consent';
  }

  return options;
};

export const initiateSocialAuth = (provider) => (req, res, next) => {
  if (!isProviderConfigured(provider)) {
    return redirectWithErrorCode(res, ERROR_CODES.SOCIAL.PROVIDER_NOT_CONFIGURED, {
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
    });
  }

  return passport.authenticate(provider, getProviderAuthOptions(provider))(req, res, next);
};

export const handleSocialAuthCallback = (provider) => (req, res, next) => {
  if (!isProviderConfigured(provider)) {
    return redirectWithErrorCode(res, ERROR_CODES.SOCIAL.PROVIDER_NOT_CONFIGURED, {
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
    });
  }

  if (!req.query.code && !req.query.error) {
    return res.redirect(`${API_URL}/auth/${provider}`);
  }

  passport.authenticate(
    provider,
    {
      session: false,
      scope: SOCIAL_AUTH_SCOPES[provider],
    },
    (err, user, info) => {
      if (err) {
        console.error(`[social-auth] ${provider} callback error:`, err.message);
        const { code, params } = resolveSocialError(err);
        return redirectWithErrorCode(res, code, params);
      }

      if (!user) {
        const failureMessage = info?.message || '';
        console.error(`[social-auth] ${provider} callback failed:`, failureMessage);
        const { code, params } = isErrorCode(failureMessage)
          ? { code: failureMessage, params: {} }
          : { code: ERROR_CODES.SOCIAL.AUTH_FAILED, params: {} };
        return redirectWithErrorCode(res, code, params);
      }

      try {
        const code = createAuthCode(user._id, { isNewUser: Boolean(user._isNewSocialUser) });
        return res.redirect(`${CLIENT_URL}/auth/social/callback?code=${code}`);
      } catch (error) {
        console.error(`[social-auth] ${provider} code creation failed:`, error.message);
        return redirectWithErrorCode(res, ERROR_CODES.SOCIAL.SIGN_IN_FAILED);
      }
    }
  )(req, res, next);
};
