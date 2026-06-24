import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPassword } from '../services/authService';
import { AuthLayout } from '../components/layout';

export default function ForgotPassword() {
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
      toast.error(error.response?.data?.message || 'Unable to process request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout navActive="login">
      <header className="mb-10 text-center lg:text-left">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          Forgot Password
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Enter your email and we&apos;ll send you instructions to reset your password
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
            className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
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
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      {resetToken && (
        <div className="mt-md p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
          <p className="text-sm text-on-surface-variant mb-2">Development reset token:</p>
          <code className="text-xs break-all text-secondary">{resetToken}</code>
          <Link
            to={`/reset-password?token=${resetToken}`}
            className="block mt-3 text-secondary font-bold hover:underline text-sm"
          >
            Continue to Reset Password
          </Link>
        </div>
      )}

      <div className="mt-xl text-center lg:text-left">
        <Link to="/login" className="text-secondary font-bold hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
