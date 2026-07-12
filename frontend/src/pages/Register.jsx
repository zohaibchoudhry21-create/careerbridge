import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../services/authService';
import { validatePassword } from '../utils/passwordValidator';
import { AuthLayout } from '../components/layout';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import PasswordRequirements from '../components/auth/PasswordRequirements';
import AppIcon from '../components/icons/AppIcon';

export default function Register() {
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
      toast.success(data.message || 'Please verify your email to continue.');
      navigate('/verify-email-sent', {
        replace: true,
        state: {
          email: values.email,
          name: values.name,
          verificationUrl: data.verificationUrl || '',
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none';

  return (
    <AuthLayout navbar="landing">
      <header className="mb-10 text-center lg:text-left">
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          Create Account
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Join AI CareerBridge and start building your future today
        </p>
      </header>

      <form className="space-y-md" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            className={inputClassName}
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
        </div>

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
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
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
              placeholder="Create a password"
              className={`${inputClassName} pr-12`}
              {...register('password', {
                required: 'Password is required',
                validate: (value) => validatePassword(value).valid || ' ',
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
          <PasswordRequirements password={password} />
        </div>

        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className={inputClassName}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
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
              Creating account...
            </>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="mt-md">
        <SocialLoginButtons />
      </div>

      <div className="mt-xl text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-bold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
