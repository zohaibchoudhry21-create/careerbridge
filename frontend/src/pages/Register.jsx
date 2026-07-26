import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { registerUser } from '../services/authService';
import { resolveApiError } from '../utils/apiError';
import { validatePassword } from '../utils/passwordValidator';
import { AuthLayout } from '../components/layout';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import PasswordRequirements from '../components/auth/PasswordRequirements';
import AppIcon from '../components/icons/AppIcon';

export default function Register() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { data } = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      toast.success(data.message || t('toasts.verifyEmailRequired'));
      navigate('/verify-email-sent', {
        replace: true,
        state: {
          email: values.email,
          name: values.name,
          verificationUrl: data.verificationUrl || '',
        },
      });
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.registrationFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none text-start';

  return (
    <AuthLayout navbar="landing">
      <header className="mb-10 text-center lg:text-start">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          {t('register.title')}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('register.subtitle')}</p>
      </header>

      <form className="space-y-md" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="name">
            {t('fields.fullName')}
          </label>
          <input
            id="name"
            type="text"
            placeholder={t('fields.placeholders.fullName')}
            className={inputClassName}
            {...register('name', { required: t('validation.nameRequired') })}
          />
          {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
        </div>

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
              pattern: { value: /^\S+@\S+\.\S+$/, message: t('validation.emailInvalid') },
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
              placeholder={t('fields.placeholders.createPassword')}
              className={`${inputClassName} pe-12`}
              {...register('password', {
                required: t('validation.passwordRequired'),
                validate: (value) => validatePassword(value).valid || ' ',
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
          <PasswordRequirements password={password} />
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
            {t('fields.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder={t('fields.placeholders.confirmPassword')}
            className={inputClassName}
            {...register('confirmPassword', {
              required: t('validation.confirmRequired'),
              validate: (value) => value === password || t('validation.passwordMismatch'),
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
              {t('register.submitting')}
            </>
          ) : (
            t('register.submit')
          )}
        </button>
      </form>

      <div className="mt-md">
        <SocialLoginButtons />
      </div>

      <div className="mt-xl text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-secondary font-bold hover:underline">
            {t('register.logIn')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
