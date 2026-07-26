import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { getSocialAuthStatusUrl, resolveSocialAuthUrl } from '../../config/apiConfig';

function GoogleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065c0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

const providers = [
  { id: 'google', Icon: GoogleIcon },
  { id: 'facebook', Icon: FacebookIcon },
  { id: 'linkedin', Icon: LinkedInIcon },
];

export default function SocialLoginButtons({ stacked = false }) {
  const { t } = useTranslation('auth');
  const [configuredProviders, setConfiguredProviders] = useState(null);
  const [authUrls, setAuthUrls] = useState({});
  const [statusError, setStatusError] = useState('');

  useEffect(() => {
    let isActive = true;

    fetch(getSocialAuthStatusUrl(), { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || t('social.statusError'));
        }

        return data;
      })
      .then((data) => {
        if (!isActive) return;

        const enabled = new Set();
        const urls = {};

        (data.providers || []).forEach((provider) => {
          urls[provider.id] = resolveSocialAuthUrl(provider.id, provider.authUrl);
          if (provider.configured) {
            enabled.add(provider.id);
          }
        });

        setConfiguredProviders(enabled);
        setAuthUrls(urls);
        setStatusError('');
      })
      .catch((error) => {
        if (!isActive) return;
        setConfiguredProviders(new Set());
        setAuthUrls({});
        setStatusError(error.message || t('social.statusError'));
      });

    return () => {
      isActive = false;
    };
  }, [t]);

  const handleClick = (providerId) => {
    const providerName = t(`social.providers.${providerId}`);

    if (configuredProviders && !configuredProviders.has(providerId)) {
      toast.info(t('social.notConfigured', { provider: providerName }));
      return;
    }

    const targetUrl = authUrls[providerId] || resolveSocialAuthUrl(providerId);
    window.location.assign(targetUrl);
  };

  const isLoading = configuredProviders === null;

  return (
    <div className="space-y-sm">
      {statusError ? <p className="text-xs text-error text-center">{statusError}</p> : null}

      <div className={`flex gap-sm ${stacked ? 'flex-col' : 'flex-col md:flex-row md:gap-md'}`}>
        {providers.map(({ id, Icon }) => {
          const providerName = t(`social.providers.${id}`);
          const isConfigured = configuredProviders?.has(id);
          const isDisabled = !isLoading && configuredProviders && !isConfigured;

          return (
            <button
              key={id}
              type="button"
              aria-label={t('social.continueWith', { provider: providerName })}
              disabled={Boolean(isDisabled)}
              onClick={() => handleClick(id)}
              className={`flex flex-1 items-center justify-center gap-sm px-4 py-3 bg-white border border-outline-variant rounded-2xl shadow-sm font-label-md text-label-md text-[#374151] transition-all ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50 hover:shadow-md active:scale-[0.98]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{providerName}</span>
            </button>
          );
        })}
      </div>

      {!isLoading && !statusError && configuredProviders?.size === 0 && (
        <p className="text-xs text-on-surface-variant text-center">{t('social.setupHint')}</p>
      )}

      {!isLoading &&
        configuredProviders &&
        configuredProviders.size > 0 &&
        configuredProviders.size < providers.length && (
          <p className="text-xs text-on-surface-variant text-center">{t('social.partialConfig')}</p>
        )}
    </div>
  );
}
