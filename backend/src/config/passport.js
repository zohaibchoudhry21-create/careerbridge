import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { findOrCreateSocialUser } from '../utils/socialAuthService.js';

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

const extractProfile = (provider, profile) => {
  const email =
    profile.emails?.[0]?.value ||
    profile._json?.email ||
    profile.email ||
    profile._json?.emailAddress;

  const name =
    profile.displayName ||
    [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') ||
    profile._json?.name ||
    email?.split('@')[0];

  const avatar =
    profile.photos?.[0]?.value ||
    profile.picture ||
    profile._json?.picture ||
    '';

  return {
    provider,
    providerId: String(profile.id),
    email,
    name,
    avatar,
  };
};

const createSocialStrategyHandler = (provider) => async (_accessToken, _refreshToken, profile, done) => {
  try {
    const { user, isNewUser } = await findOrCreateSocialUser(extractProfile(provider, profile));
    user._isNewSocialUser = isNewUser;
    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

const registerGoogleStrategy = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('[passport] Google OAuth credentials not configured.');
    return;
  }

  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${API_URL}/auth/google/callback`,
        scope: ['openid', 'profile', 'email'],
      },
      createSocialStrategyHandler('google')
    )
  );
};

const registerFacebookStrategy = () => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    console.warn('[passport] Facebook OAuth credentials not configured.');
    return;
  }

  passport.use(
    'facebook',
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${API_URL}/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      createSocialStrategyHandler('facebook')
    )
  );
};

const registerLinkedInStrategy = () => {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    console.warn('[passport] LinkedIn OAuth credentials not configured.');
    return;
  }

  passport.use(
    'linkedin',
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: `${API_URL}/auth/linkedin/callback`,
        scope: ['openid', 'profile', 'email'],
      },
      createSocialStrategyHandler('linkedin')
    )
  );
};

export const configurePassport = () => {
  registerGoogleStrategy();
  registerFacebookStrategy();
  registerLinkedInStrategy();
};

export const isProviderConfigured = (provider) => {
  switch (provider) {
    case 'google':
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    case 'facebook':
      return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
    case 'linkedin':
      return Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
    default:
      return false;
  }
};

export default configurePassport;
