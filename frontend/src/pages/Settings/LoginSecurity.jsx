import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import { PasswordField } from '../../components/settings/InputField';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import PasswordStrengthBar from '../../components/settings/PasswordStrengthBar';
import AppIcon from '../../components/icons/AppIcon';
import { validatePassword } from '../../utils/passwordValidator';
import useAuth from '../../hooks/useAuth';
import {
  useChangePassword,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from '../../hooks/useSettings';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

function ComingSoonNote({ children }) {
  return (
    <p className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-body-md text-sm text-on-surface-variant">
      {children}
    </p>
  );
}

function formatSessionDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ActiveSessionsSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: sessions = [], isLoading, isError, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();

  const otherSessions = sessions.filter((session) => !session.isCurrent);
  const isRevoking = revokeSession.isPending || revokeOthers.isPending;

  const handleRevokeSession = async (session) => {
    try {
      const result = await revokeSession.mutateAsync(session.id);

      if (result?.signedOutCurrent || session.isCurrent) {
        toast.success('You have been signed out.');
        await logout();
        navigate('/login');
        return;
      }

      toast.success('Device signed out.');
      await refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to sign out that device.'));
    }
  };

  const handleRevokeOthers = async () => {
    if (otherSessions.length === 0) {
      toast.info('No other active sessions to sign out.');
      return;
    }

    try {
      const result = await revokeOthers.mutateAsync();
      toast.success(result?.message || 'Other devices have been signed out.');
      await refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to sign out other devices.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
      </div>
    );
  }

  if (isError) {
    return (
      <ComingSoonNote>
        Unable to load active sessions right now. Please refresh the page and try again.
      </ComingSoonNote>
    );
  }

  if (sessions.length === 0) {
    return (
      <ComingSoonNote>
        No active sessions were found. Sign in again to refresh this list.
      </ComingSoonNote>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-label-md text-on-surface">{session.deviceLabel}</p>
                  {session.isCurrent ? (
                    <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-label-md text-secondary">
                      This device
                    </span>
                  ) : null}
                </div>
                <p className="font-body-md text-on-surface-variant text-sm">
                  IP: {session.ipAddress || 'Unknown'}
                </p>
                <p className="font-body-md text-on-surface-variant text-sm">
                  Signed in: {formatSessionDate(session.createdAt)}
                </p>
                <p className="font-body-md text-on-surface-variant text-sm">
                  Last active: {formatSessionDate(session.lastActiveAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRevokeSession(session)}
                disabled={isRevoking}
                className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-50"
              >
                {session.isCurrent ? 'Sign out' : 'Sign out device'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {otherSessions.length > 0 ? (
        <button
          type="button"
          onClick={handleRevokeOthers}
          disabled={isRevoking}
          className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-50"
        >
          Sign out all other devices
        </button>
      ) : null}
    </div>
  );
}

export default function LoginSecurity() {
  const { user } = useAuth();
  const changePassword = useChangePassword();
  const isLocalAccount = (user?.provider || user?.authProvider || 'local') === 'local';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    if (!isLocalAccount) {
      toast.error('Password changes are only available for email and password accounts.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    const strength = validatePassword(newPassword);
    if (!strength.valid) {
      toast.error(strength.errors[0] || 'Please choose a stronger password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      const result = await changePassword.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(result?.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to change password. Please try again.'));
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.info('Changes discarded.');
  };

  return (
    <SettingsPageShell
      title="Login & Security"
      description="Update your password, manage security preferences, and review active sessions."
      onSave={isLocalAccount ? handleSave : undefined}
      onCancel={isLocalAccount ? handleCancel : undefined}
      saveLabel="Change Password"
      saving={changePassword.isPending}
      showActions={isLocalAccount}
    >
      <SectionCard
        title="Password"
        description={
          isLocalAccount
            ? 'Choose a strong password you do not use elsewhere.'
            : 'Your account uses social sign-in. Manage your password with your provider.'
        }
        icon="lock"
        color="security"
      >
        {isLocalAccount ? (
          <div className="space-y-4 max-w-xl">
            <PasswordField
              id="current-password"
              label="Current Password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              showPassword={showCurrent}
              onToggleShow={() => setShowCurrent((value) => !value)}
              required
            />
            <div>
              <PasswordField
                id="new-password"
                label="New Password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                showPassword={showNew}
                onToggleShow={() => setShowNew((value) => !value)}
                required
              />
              <PasswordStrengthBar password={newPassword} />
            </div>
            <PasswordField
              id="confirm-password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              showPassword={showConfirm}
              onToggleShow={() => setShowConfirm((value) => !value)}
              required
            />
          </div>
        ) : (
          <ComingSoonNote>
            Signed in with {user?.provider || user?.authProvider}. Password changes are managed by
            your identity provider, not CareerBridge.
          </ComingSoonNote>
        )}
      </SectionCard>

      <SectionCard
        title="Security"
        description="Additional protections for your account."
        icon="shield"
        color="focus"
      >
        <ComingSoonNote>
          Two-factor authentication, login alerts, and trusted devices are coming in the next
          phases. Session tracking is live below.
        </ComingSoonNote>
        <ToggleSwitch
          id="two-factor"
          label="Two-Factor Authentication"
          description="Require a verification code when signing in on a new device."
          checked={false}
          onChange={() => {}}
          disabled
        />
        <ToggleSwitch
          id="login-alerts"
          label="Login Alerts"
          description="Get notified when someone signs in to your account."
          checked={false}
          onChange={() => {}}
          disabled
        />
        <ToggleSwitch
          id="remember-devices"
          label="Remember Devices"
          description="Stay signed in on trusted devices for faster access."
          checked={false}
          onChange={() => {}}
          disabled
        />
      </SectionCard>

      <SectionCard
        title="Active Sessions"
        description="Devices currently signed in to your account."
        icon="devices"
        color="role"
      >
        <p className="font-body-md text-on-surface-variant text-sm">
          Changing your password also signs out other browsers using your account.
        </p>
        <ActiveSessionsSection />
      </SectionCard>
    </SettingsPageShell>
  );
}
