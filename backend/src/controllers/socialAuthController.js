import passport from 'passport';
import { createAuthCode } from '../utils/authCodeStore.js';
import { isProviderConfigured } from '../config/passport.js';

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

const redirectWithError = (res, message) => {
  const error = encodeURIComponent(message || 'Social authentication failed.');
  return res.redirect(`${CLIENT_URL}/auth/social/callback?error=${error}`);
};

const getProviderAuthOptions = (provider) => {
  const options = {
    scope: SOCIAL_AUTH_SCOPES[provider],
    session: false,
  };

  if (provider === 'google') {
    // Without prompt, Google may auto-select the signed-in account and skip consent
    // if the user already approved this app + scopes before.
    options.prompt = process.env.GOOGLE_OAUTH_PROMPT || 'select_account consent';
  }

  return options;
};

export const initiateSocialAuth = (provider) => (req, res, next) => {
  if (!isProviderConfigured(provider)) {
    return redirectWithError(
      res,
      `${provider.charAt(0).toUpperCase()}${provider.slice(1)} login is not configured on the server.`
    );
  }

  return passport.authenticate(provider, getProviderAuthOptions(provider))(req, res, next);
};

export const handleSocialAuthCallback = (provider) => (req, res, next) => {
  if (!isProviderConfigured(provider)) {
    return redirectWithError(
      res,
      `${provider.charAt(0).toUpperCase()}${provider.slice(1)} login is not configured on the server.`
    );
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
        return redirectWithError(res, err.message);
      }

      if (!user) {
        const failureMessage =
          info?.message || 'Authentication failed. Please try again.';
        console.error(`[social-auth] ${provider} callback failed:`, failureMessage);
        return redirectWithError(res, failureMessage);
      }

      try {
        const code = createAuthCode(user._id, { isNewUser: Boolean(user._isNewSocialUser) });
        return res.redirect(`${CLIENT_URL}/auth/social/callback?code=${code}`);
      } catch (error) {
        console.error(`[social-auth] ${provider} code creation failed:`, error.message);
        return redirectWithError(res, 'Unable to complete sign in. Please try again.');
      }
    }
  )(req, res, next);
};
