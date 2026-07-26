import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import SocialLoginButtons from './SocialLoginButtons';
import AppIcon from '../icons/AppIcon';

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await login(
        {
          email: values.email,
          password: values.password,
          trustDevice: values.trustDevice,
        },
        values.remember
      );
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

  const inputClassName =
    'w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none';

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
              className={`${inputClassName} pr-12`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary"
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
