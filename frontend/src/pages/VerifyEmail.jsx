import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { verifyEmailOnce } from '../utils/verifyEmailOnce';
import { resolveApiError } from '../utils/apiError';
import { AuthLayout } from '../components/layout';
import AppIcon from '../components/icons/AppIcon';

export default function VerifyEmail() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(t('verifyEmail.loadingMessage'));
  }, [t]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmail.tokenMissing'));
      return undefined;
    }

    let isActive = true;

    verifyEmailOnce(token)
      .then(({ data }) => {
        if (!isActive) return;
        const successMessage = data.message || t('verifyEmail.successFallback');
        setStatus('success');
        setMessage(successMessage);
        toast.success(successMessage);
      })
      .catch((error) => {
        if (!isActive) return;
        const errorMessage = resolveApiError(error, t('verifyEmail.errorFallback'));
        setStatus((prev) => {
          if (prev === 'success') return prev;
          toast.error(errorMessage);
          return 'error';
        });
        setMessage((prev) => {
          const successMarkers = [t('verifyEmail.successFallback'), 'verified', 'successfully'];
          if (successMarkers.some((marker) => prev.includes(marker))) return prev;
          return errorMessage;
        });
      });

    return () => {
      isActive = false;
    };
  }, [token, t]);

  return (
    <AuthLayout navActive="login">
      <div className="text-center lg:text-start">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto lg:mx-0 ${
            status === 'success'
              ? 'bg-secondary/10 text-secondary'
              : status === 'error'
                ? 'bg-error-container text-error'
                : 'bg-surface-container text-secondary'
          }`}
        >
          <AppIcon
            name={
              status === 'loading'
                ? 'hourglass_top'
                : status === 'success'
                  ? 'check_circle'
                  : 'error'
            }
            size="h-8 w-8"
          />
        </div>

        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          {status === 'loading' && t('verifyEmail.verifying')}
          {status === 'success' && t('verifyEmail.verified')}
          {status === 'error' && t('verifyEmail.failed')}
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant mb-8">{message}</p>

        {status === 'loading' && (
          <div className="flex justify-center lg:justify-start">
            <span className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <Link
            to="/login"
            className="inline-flex bg-secondary text-on-secondary font-label-md text-label-md py-4 px-8 rounded-2xl hover:opacity-95 transition-all"
          >
            {t('verifyEmail.continueToLogin')}
          </Link>
        )}

        {status === 'error' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start rtl:sm:flex-row-reverse">
            <Link
              to="/verify-email-sent"
              className="inline-flex justify-center bg-secondary text-on-secondary font-label-md text-label-md py-4 px-8 rounded-2xl hover:opacity-95 transition-all"
            >
              {t('verifyEmail.resendVerification')}
            </Link>
            <Link
              to="/login"
              className="inline-flex justify-center border border-secondary text-secondary font-label-md text-label-md py-4 px-8 rounded-2xl hover:bg-surface-container transition-all"
            >
              {t('verifyEmail.backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
