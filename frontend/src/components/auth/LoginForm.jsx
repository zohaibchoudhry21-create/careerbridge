import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import SocialLoginButtons from './SocialLoginButtons';
import AppIcon from '../icons/AppIcon';

const RECOVERY_HINT =
  'Lost your authenticator and backup codes? Contact support from your registered email for manual recovery.';

function ReactivationStep({ onConfirm, onCancel, submitting }) {
  return (
    <div className="space-y-md">
      <header className="mb-6 text-center lg:text-left">
        <h2 className="font-display-md text-on-surface mb-2">Account deactivated</h2>
        <p className="font-body-md text-on-surface-variant">
          Your credentials are valid, but this account is currently deactivated. Reactivate now to
          continue signing in.
        </p>
      </header>

      <div className="rounded-2xl border border-warning/30 bg-warning/5 px-4 py-4">
        <p className="font-body-md text-sm text-on-surface-variant">
          If you did not intend to sign in, choose Cancel to keep the account deactivated.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="w-full sm:w-auto px-4 py-4 rounded-2xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors disabled:opacity-70"
        >
          Cancel
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
              Reactivating...
            </>
          ) : (
            'Reactivate account'
          )}
        </button>
      </div>
    </div>
  );
}

function TwoFactorStep({ onSubmit, submitting, useBackupCode, onToggleBackup }) {
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
      <header className="mb-6 text-center lg:text-left">
        <h2 className="font-display-md text-on-surface mb-2">Two-factor authentication</h2>
        <p className="font-body-md text-on-surface-variant">
          {useBackupCode
            ? 'Enter one of your backup codes to finish signing in.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </header>

      {useBackupCode ? (
        <input
          type="text"
          value={backupCode}
          onChange={(event) => setBackupCode(event.target.value)}
          placeholder="XXXX-XXXX"
          className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none uppercase"
        />
      ) : (
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="123456"
          className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none"
        />
      )}

      <button
        type="button"
        onClick={onToggleBackup}
        className="text-secondary font-label-md hover:underline"
      >
        {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
      </button>

      <p className="font-body-md text-on-surface-variant text-sm">{RECOVERY_HINT}</p>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify and continue'
        )}
      </button>
    </form>
  );
}

export default function LoginForm() {
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
      toast.info('Your account is deactivated. Sign in and confirm reactivation to restore access.');
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
  }, [location.pathname, location.search, location.state, navigate]);

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
        toast.info('Enter your authenticator code to continue.');
        return;
      }

      if (result?.requiresReactivation) {
        setStep('reactivation');
        return;
      }

      toast.success('Login successful! Welcome back.');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Server is taking too long. Please try again.'
          : error.response?.data?.message || 'Login failed. Please check your credentials.';
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
      toast.success('Login successful! Welcome back.');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message || 'Invalid code. Please try again.';
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
        toast.info('Enter your authenticator code to continue.');
        return;
      }

      toast.success('Account reactivated. Welcome back!');
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message || 'Unable to reactivate account. Please sign in again.';
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
      toast.info('Sign-in cancelled. Your account remains deactivated.');
      setStep('credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none';

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
      <header className="mb-10 text-center lg:text-left">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          Welcome Back
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Sign in to continue to your AI-powered career dashboard
        </p>
      </header>

      <form className="space-y-md" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={inputClassName}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`${inputClassName} pe-12`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            <span className="text-on-surface-variant">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-secondary hover:underline">
            Forgot Password?
          </Link>
        </div>

        <label className="flex items-start gap-2 cursor-pointer font-label-md text-label-md">
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 rounded border-outline text-secondary focus:ring-secondary"
            {...register('trustDevice')}
          />
          <span className="text-on-surface-variant">
            Trust this device
            <span className="block text-sm text-on-surface-variant/80">
              Requires Remember Devices to be enabled in your account settings.
            </span>
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
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      <div className="mt-md">
        <SocialLoginButtons />
      </div>

      <div className="mt-xl text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-secondary font-bold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}
