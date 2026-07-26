import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import { PasswordField } from '../../components/settings/InputField';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import PasswordStrengthBar from '../../components/settings/PasswordStrengthBar';
import { DUMMY_SESSION } from '../../components/settings/settingsDummyData';
import { validatePassword } from '../../utils/passwordValidator';
import useAuth from '../../hooks/useAuth';
import { useChangePassword } from '../../hooks/useSettings';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

function ComingSoonNote({ children }) {
  return (
    <p className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-body-md text-sm text-on-surface-variant">
      {children}
    </p>
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
          Two-factor authentication, login alerts, and trusted devices require session tracking and
          are not saved yet. These controls are preview-only until that backend work is scheduled.
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
        <ComingSoonNote>
          Per-device session history is not tracked yet. Changing your password signs out other
          browsers using your account. Full session management is planned as a separate feature.
        </ComingSoonNote>
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 space-y-3 opacity-70">
          <div>
            <p className="font-label-md text-on-surface">Current Device</p>
            <p className="font-body-md text-on-surface-variant text-sm">{DUMMY_SESSION.device}</p>
          </div>
          <div>
            <p className="font-label-md text-on-surface">Last Login</p>
            <p className="font-body-md text-on-surface-variant text-sm">{DUMMY_SESSION.lastLogin}</p>
          </div>
          <div>
            <p className="font-label-md text-on-surface">IP Address</p>
            <p className="font-body-md text-on-surface-variant text-sm">{DUMMY_SESSION.ipAddress}</p>
          </div>
        </div>
      </SectionCard>
    </SettingsPageShell>
  );
}
