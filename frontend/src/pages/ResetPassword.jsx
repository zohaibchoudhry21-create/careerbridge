import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../services/authService';
import useAuth from '../hooks/useAuth';
import { validatePassword } from '../utils/passwordValidator';
import { AuthLayout } from '../components/layout';
import PasswordRequirements from '../components/auth/PasswordRequirements';
import AppIcon from '../components/icons/AppIcon';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      token: searchParams.get('token') || '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const { data } = await resetPassword({
        token: values.token,
        password: values.password,
      });
      setSession(data);
      toast.success('Password reset successful!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout navActive="login">
      <header className="mb-10 text-center lg:text-left">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          Reset Password
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Enter your reset token and choose a new password
        </p>
      </header>

      <form className="space-y-md" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="token">
            Reset Token
          </label>
          <input
            id="token"
            type="text"
            placeholder="Paste reset token"
            className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none"
            {...register('token', { required: 'Reset token is required' })}
          />
          {errors.token && <p className="text-sm text-error">{errors.token.message}</p>}
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              className="w-full px-4 pr-12 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none"
              {...register('password', {
                required: 'Password is required',
                validate: (value) => validatePassword(value).valid || ' ',
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary"
            >
              <AppIcon name={showPassword ? 'visibility_off' : 'visibility'} size="h-5 w-5" />
            </button>
          </div>
          <PasswordRequirements password={password} />
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none"
            {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: (value) => value === password || 'Passwords do not match',
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
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      <div className="mt-xl text-center lg:text-left">
        <Link to="/login" className="text-secondary font-bold hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
