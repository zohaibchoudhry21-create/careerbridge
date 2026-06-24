import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resendVerification } from '../services/authService';
import { AuthLayout } from '../components/layout';

export default function VerifyEmailSent() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [name] = useState(location.state?.name || '');
  const [devLink, setDevLink] = useState(location.state?.verificationUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResend = async (event) => {
    event.preventDefault();

    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await resendVerification(email);
      toast.success(data.message);
      if (data.verificationUrl) {
        setDevLink(data.verificationUrl);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to resend verification email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout navActive="register">
      <header className="mb-10 text-center lg:text-left">
        <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-6 mx-auto lg:mx-0">
          <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
        </div>
        <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-xs">
          Check Your Email
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {name ? (
            <>
              Hi <span className="font-semibold text-on-surface">{name}</span>, we sent a verification
              link to <span className="font-semibold text-on-surface">{email || 'your email'}</span>.
              The link expires in 15 minutes.
            </>
          ) : (
            <>We sent a verification link to your email. The link expires in 15 minutes.</>
          )}
        </p>
      </header>

      <form onSubmit={handleResend} className="space-y-md">
        <div className="space-y-xs">
          <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-4 bg-[#F1F5F9] border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-secondary transition-all outline-none"
          />
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
            'Resend Verification Email'
          )}
        </button>
      </form>

      {devLink && (
        <div className="mt-md p-4 rounded-2xl bg-surface-container-low border border-outline-variant">
          <p className="text-sm text-on-surface-variant mb-2">Development verification link:</p>
          <a href={devLink} className="text-sm text-secondary break-all hover:underline">
            {devLink}
          </a>
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
