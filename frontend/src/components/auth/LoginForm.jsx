import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { resolveApiError } from '../../utils/apiError';
import SocialLoginButtons from './SocialLoginButtons';
import AppIcon from '../icons/AppIcon';

function ReactivationStep({ onConfirm, onCancel, submitting }) {
  const { t } = useTranslation('auth');

  return (
    <div className="space-y-md">
      <header className="mb-6 text-center lg:text-start">
        <h2 className="font-display-md text-on-surface mb-2">{t('reactivation.title')}</h2>
        <p className="font-body-md text-on-surface-variant">{t('reactivation.description')}</p>
      </header>

      <div className="rounded-2xl border border-warning/30 bg-warning/5 px-4 py-4">
        <p className="font-body-md text-sm text-on-surface-variant">{t('reactivation.warning')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 rtl:sm:flex-row-reverse">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full sm:w-auto px-4 py-4 rounded-2xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors disabled:opacity-70"
        >
          {t('reactivation.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="w-full sm:flex-1 bg-secondary text-on-secondary font-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
              {t('reactivation.submitting')}
            </>
          ) : (
            t('reactivation.submit')
          )}
        </button>
      </div>
    </div>
  );
}

function TwoFactorStep({ onSubmit, submitting, useBackupCode, onToggleBackup }) {
  const { t } = useTranslation('auth');
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      code: useBackupCode ? undefined : code,
      backupCode: useBackupCode ? backupCode : undefined,
    });
  };

  return (
    <form className="space-y-md" onSubmit={handleSubmit} noValidate>
      <header className="mb-6 text-center lg:text-start">
        <h2 className="font-display-md text-on-surface mb-2">{t('twoFactor.title')}</h2>
        <p className="font-body-md text-on-surface-variant">
          {useBackupCode ? t('twoFactor.backupHint') : t('twoFactor.authenticatorHint')}
        </p>
      </header>

      {useBackupCode ? (
        <input
          type="text"
          value={backupCode}
          onChange={(event) => setBackupCode(event.target.value)}
          placeholder={t('twoFactor.placeholderBackup')}
          className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none uppercase text-start"
        />
      ) : (
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t('twoFactor.placeholderCode')}
          className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none text-start"
        />
      )}

      <button
        type="button"
        onClick={onToggleBackup}
        className="text-secondary font-label-md hover:underline"
      >
        {useBackupCode ? t('twoFactor.useAuthenticator') : t('twoFactor.useBackup')}
      </button>

      <p className="font-body-md text-on-surface-variant text-sm">{t('twoFactor.recoveryHint')}</p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
            {t('twoFactor.submitting')}
          </>
        ) : (
          t('twoFactor.submit')
        )}
      </button>
    </form>
  );
}

export default function LoginForm() {
  const { t } = useTranslation('auth');
  const { login, verifyTwoFactor, confirmReactivation, cancelReactivation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialStep = (() => {
    if (searchParams.get('twoFactor') === '1') return '2fa';
    if (searchParams.get('reactivate') === '1') return 'reactivation';
    return 'credentials';
  })();
  const [step, setStep] = useState(initialStep);
  const [useBackupCode, setUseBackupCode] = useState(false);

  useEffect(() => {
    if (location.state?.accountDeactivated) {
      toast.info(t('toasts.accountDeactivated'));
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state, navigate, t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
      trustDevice: false,
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const result = await login(
        {
          email: values.email,
          password: values.password,
          trustDevice: values.trustDevice,
        },
        values.remember
      );

      if (result?.requires2FA) {
        setStep('2fa');
        toast.info(t('social.enterAuthenticator'));
        return;
      }

      if (result?.requiresReactivation) {
        setStep('reactivation');
        return;
      }

      toast.success(t('toasts.loginSuccess'));
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error.code === 'ECONNABORTED'
          ? t('toasts.serverTimeout')
          : resolveApiError(error, t('toasts.loginFailed'));
      toast.error(message);

      if (error.response?.status === 403) {
        navigate('/verify-email-sent', { state: { email: values.email } });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async ({ code, backupCode }) => {
    setIsSubmitting(true);
    try {
      await verifyTwoFactor({ code, backupCode });
      toast.success(t('toasts.loginSuccess'));
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = resolveApiError(error, t('toasts.invalidCode'));
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivationConfirm = async () => {
    setIsSubmitting(true);
    try {
      const result = await confirmReactivation();
      if (result?.requires2FA) {
        setStep('2fa');
        toast.info(t('social.enterAuthenticator'));
        return;
      }

      toast.success(t('toasts.reactivated'));
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = resolveApiError(error, t('toasts.reactivateFailed'));
      toast.error(message);
      setStep('credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivationCancel = async () => {
    setIsSubmitting(true);
    try {
      await cancelReactivation();
      toast.info(t('toasts.signInCancelled'));
      setStep('credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none text-start';

  if (step === '2fa') {
    return (
      <TwoFactorStep
        onSubmit={handleTwoFactorSubmit}
        submitting={isSubmitting}
        useBackupCode={useBackupCode}
        onToggleBackup={() => setUseBackupCode((value) => !value)}
      />
    );
  }

  if (step === 'reactivation') {
    return (
      <ReactivationStep
        onConfirm={handleReactivationConfirm}
        onCancel={handleReactivationCancel}
        submitting={isSubmitting}
      />
    );
  }

  return (
    <>
      <header className="mb-10 text-center lg:text-start">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          {t('login.title')}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('login.subtitle')}</p>
      </header>

      <form className="space-y-md" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            placeholder={t('fields.placeholders.email')}
            className={inputClassName}
            {...register('email', {
              required: t('validation.emailRequired'),
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: t('validation.emailInvalidLong'),
              },
            })}
          />
          {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
            {t('fields.password')}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('fields.placeholders.password')}
              className={`${inputClassName} pe-12`}
              {...register('password', {
                required: t('validation.passwordRequired'),
                minLength: { value: 6, message: t('validation.passwordMinLength') },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary"
              aria-label={showPassword ? t('fields.hidePassword') : t('fields.showPassword')}
            >
              <AppIcon name={showPassword ? 'visibility_off' : 'visibility'} size="h-5 w-5" />
            </button>
          </div>
          {errors.password && <p className="text-sm text-error">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between font-label-md text-label-md">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-outline text-secondary focus:ring-secondary"
              {...register('remember')}
            />
            <span className="text-on-surface-variant">{t('login.rememberMe')}</span>
          </label>
          <Link to="/forgot-password" className="text-secondary hover:underline">
            {t('login.forgotPassword')}
          </Link>
        </div>

        <label className="flex items-start gap-2 cursor-pointer font-label-md text-label-md">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 rounded border-outline text-secondary focus:ring-secondary"
            {...register('trustDevice')}
          />
          <span className="text-on-surface-variant">
            {t('login.trustDevice')}
            <span className="block text-sm text-on-surface-variant/80">{t('login.trustDeviceHint')}</span>
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
              {t('login.submitting')}
            </>
          ) : (
            t('login.submit')
          )}
        </button>
      </form>

      <div className="mt-md">
        <SocialLoginButtons />
      </div>

      <div className="mt-xl text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-secondary font-bold hover:underline">
            {t('login.createAccount')}
          </Link>
        </p>
      </div>
    </>
  );
}
