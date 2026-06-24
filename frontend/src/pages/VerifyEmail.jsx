import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyEmailOnce } from '../utils/verifyEmailOnce';
import { AuthLayout } from '../components/layout';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return undefined;
    }

    let isActive = true;

    verifyEmailOnce(token)
      .then(({ data }) => {
        if (!isActive) return;
        const successMessage = data.message || 'Email verified successfully.';
        setStatus('success');
        setMessage(successMessage);
        toast.success(successMessage);
      })
      .catch((error) => {
        if (!isActive) return;
        const errorMessage =
          error.response?.data?.message || 'Invalid or expired token';
        setStatus((prev) => {
          if (prev === 'success') return prev;
          toast.error(errorMessage);
          return 'error';
        });
        setMessage((prev) =>
          prev.includes('successfully') || prev.includes('verified') ? prev : errorMessage
        );
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  return (
    <AuthLayout navActive="login">
      <div className="text-center lg:text-left">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto lg:mx-0 ${
            status === 'success'
              ? 'bg-secondary/10 text-secondary'
              : status === 'error'
                ? 'bg-error-container text-error'
                : 'bg-surface-container text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {status === 'loading'
              ? 'hourglass_top'
              : status === 'success'
                ? 'check_circle'
                : 'error'}
          </span>
        </div>

        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          {status === 'loading' && 'Verifying Email'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="font-body-md text-body-md text-on-surface-variant mb-8">{message}</p>

        {status === 'loading' && (
          <div className="flex justify-center lg:justify-start">
            <span className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <Link
            to="/login"
            className="inline-flex bg-secondary text-on-secondary font-label-md text-label-md py-4 px-8 rounded-2xl hover:opacity-95 transition-all"
          >
            Continue to Login
          </Link>
        )}

        {status === 'error' && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              to="/verify-email-sent"
              className="inline-flex justify-center bg-secondary text-on-secondary font-label-md text-label-md py-4 px-8 rounded-2xl hover:opacity-95 transition-all"
            >
              Resend Verification
            </Link>
            <Link
              to="/login"
              className="inline-flex justify-center border border-secondary text-secondary font-label-md text-label-md py-4 px-8 rounded-2xl hover:bg-surface-container transition-all"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
