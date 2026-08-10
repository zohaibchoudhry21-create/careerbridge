import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { registerUser } from '../../services/authService';
import { validatePassword } from '../../utils/passwordValidator';
import SocialLoginButtons from './SocialLoginButtons';
import PasswordRequirements from './PasswordRequirements';
import AuthFormHeader from './AuthFormHeader';
import AuthSubmitButton from './AuthSubmitButton';
import AppIcon from '../icons/AppIcon';
import {
  authInputClassName,
  authInputPasswordClassName,
  getAuthFieldClassName,
} from './authUi';

export default function RegisterForm() {
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
          emailPreviewUrl: data.emailPreviewUrl || '',
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AuthFormHeader title="Create your account." />

      <SocialLoginButtons />

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="name">
            Full Name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            className={getAuthFieldClassName(authInputClassName, Boolean(errors.name))}
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <p className="text-sm text-error">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="email">
            Email <span className="text-error">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={getAuthFieldClassName(authInputClassName, Boolean(errors.email))}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
          {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">
            Password <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              className={getAuthFieldClassName(authInputPasswordClassName, Boolean(errors.password))}
              {...register('password', {
                required: 'Password is required',
                validate: (value) => validatePassword(value).valid || ' ',
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-outline transition-colors duration-200 hover:text-secondary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <AppIcon name={showPassword ? 'visibility_off' : 'visibility'} size="h-5 w-5" />
            </button>
          </div>
          <PasswordRequirements password={password} />
        </div>

        <div className="space-y-1.5">
          <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="confirmPassword">
            Confirm Password <span className="text-error">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className={getAuthFieldClassName(authInputClassName, Boolean(errors.confirmPassword))}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <AuthSubmitButton
          isSubmitting={isSubmitting}
          loadingLabel="Creating account..."
          label="Sign up"
        />
      </form>

      <div className="mt-6 text-center">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-secondary transition-colors hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </>
  );
}
