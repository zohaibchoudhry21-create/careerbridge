import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { resendVerification } from '../services/authService';
import { resolveApiError } from '../utils/apiError';
import { AuthLayout } from '../components/layout';
import AppIcon from '../components/icons/AppIcon';

export default function VerifyEmailSent() {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [name] = useState(location.state?.name || '');
  const [devLink, setDevLink] = useState(location.state?.verificationUrl || '');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(location.state?.emailPreviewUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResend = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error(t('toasts.enterEmail'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await resendVerification(email);
      toast.success(data.message);
      if (data.verificationUrl) {
        setDevLink(data.verificationUrl);
      }
      if (data.emailPreviewUrl) {
        setEmailPreviewUrl(data.emailPreviewUrl);
      }
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.resendFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout navActive="register">
      <header className="mb-10 text-center lg:text-start">
        <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-6 mx-auto lg:mx-0">
          <AppIcon name="mark_email_unread" size="h-8 w-8" />
        </div>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          {t('verifyEmailSent.title')}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {name ? (
            <Trans
              ns="auth"
              i18nKey="verifyEmailSent.greeting"
              values={{
                name,
                email: email || t('verifyEmailSent.yourEmail'),
              }}
              components={{
                strong: <span className="font-semibold text-on-surface" />,
              }}
            />
          ) : (
            t('verifyEmailSent.generic')
          )}
        </p>
      </header>

      <form onSubmit={handleResend} className="space-y-md">
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('fields.placeholders.email')}
            className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none text-start"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
              {t('verifyEmailSent.submitting')}
            </>
          ) : (
            t('verifyEmailSent.resend')
          )}
        </button>
      </form>

      {emailPreviewUrl && (
        <div className="mt-md p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
          <p className="text-sm text-on-surface-variant mb-2">
            Dev email preview (Gmail SMTP failed — open this inbox):
          </p>
          <a
            href={emailPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-secondary break-all hover:underline"
          >
            {emailPreviewUrl}
          </a>
        </div>
      )}

      {devLink && (
        <div className="mt-md p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
          <p className="text-sm text-on-surface-variant mb-2">{t('verifyEmailSent.devLinkLabel')}</p>
          <a href={devLink} className="text-sm text-secondary break-all hover:underline">
            {devLink}
          </a>
        </div>
      )}

      <div className="mt-xl text-center lg:text-start">
        <Link to="/login" className="text-secondary font-bold hover:underline">
          {t('verifyEmailSent.backToLogin')}
        </Link>
      </div>
    </AuthLayout>
  );
}
