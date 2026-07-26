import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { forgotPassword } from '../services/authService';
import { resolveApiError } from '../utils/apiError';
import { AuthLayout } from '../components/layout';

export default function ForgotPassword() {
  const { t } = useTranslation('auth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setIsSubmitting(true);
    try {
      const { data } = await forgotPassword(email);
      toast.success(data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.forgotPasswordError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout navActive="login">
      <header className="mb-10 text-center lg:text-start">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          {t('forgotPassword.title')}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('forgotPassword.subtitle')}</p>
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
            className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none text-start"
            {...register('email', {
              required: t('validation.emailRequired'),
              pattern: { value: /^\S+@\S+\.\S+$/, message: t('validation.emailInvalid') },
            })}
          />
          {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-2xl hover:opacity-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
              {t('forgotPassword.submitting')}
            </>
          ) : (
            t('forgotPassword.submit')
          )}
        </button>
      </form>

      {resetToken && (
        <div className="mt-md p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
          <p className="text-sm text-on-surface-variant mb-2">{t('forgotPassword.devTokenLabel')}</p>
          <code className="text-xs break-all text-secondary">{resetToken}</code>
          <Link
            to={`/reset-password?token=${resetToken}`}
            className="block mt-3 text-secondary font-bold hover:underline text-sm"
          >
            {t('forgotPassword.continueToReset')}
          </Link>
        </div>
      )}

      <div className="mt-xl text-center lg:text-start">
        <Link to="/login" className="text-secondary font-bold hover:underline">
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    </AuthLayout>
  );
}
