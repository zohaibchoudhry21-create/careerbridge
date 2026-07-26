import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { exchangeSocialCode } from '../services/authService';

const socialLoginRequests = new Map();
const socialLoginResults = new Map();
const socialLoginToasts = new Set();

const getSharedSocialLogin = (code) => {
  if (socialLoginResults.has(code)) {
    return Promise.resolve(socialLoginResults.get(code));
  }

  if (!socialLoginRequests.has(code)) {
    socialLoginRequests.set(
      code,
      exchangeSocialCode(code)
        .then((response) => {
          socialLoginResults.set(code, response.data);
          return response.data;
        })
        .catch((error) => {
          socialLoginRequests.delete(code);
          socialLoginResults.delete(code);
          throw error;
        })
    );
  }

  return socialLoginRequests.get(code);
};

export default function SocialAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, syncSession } = useAuth();
  const [message, setMessage] = useState('Completing sign in...');

  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    let isActive = true;

    const finishLogin = async (data) => {
      if (data?.requires2FA) {
        navigate('/login?twoFactor=1', { replace: true });
        toast.info('Enter your authenticator code to continue.');
        return;
      }

      if (!data?.user) {
        throw new Error('Social login response did not include a user profile.');
      }

      flushSync(() => {
        setSession(data);
      });

      await syncSession({ preserveExistingSession: true });

      if (!isActive) return;

      if (code && !socialLoginToasts.has(code)) {
        socialLoginToasts.add(code);
        toast.success(data.message || 'Signed in successfully.');
      }

      navigate('/dashboard', { replace: true });
    };

    const completeSocialLogin = async () => {
      if (error) {
        if (!isActive) return;

        const decodedError = decodeURIComponent(error);
        setMessage(decodedError);
        toast.error(decodedError);
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      if (!code) {
        if (!isActive) return;

        setMessage('Missing authorization code.');
        toast.error('Social login failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      try {
        const data = await getSharedSocialLogin(code);
        if (!isActive) return;

        await finishLogin(data);
      } catch (requestError) {
        if (!isActive) return;

        socialLoginToasts.delete(code);

        const apiMessage =
          requestError.response?.data?.message ||
          requestError.message ||
          'Unable to complete social login.';
        setMessage(apiMessage);
        toast.error(apiMessage);
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    completeSocialLogin();

    return () => {
      isActive = false;
    };
  }, [code, error, navigate, setSession, syncSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>
      </div>
    </div>
  );
}
