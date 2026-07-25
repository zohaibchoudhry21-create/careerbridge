import { useState } from 'react';
import { toast } from 'react-toastify';
import SettingsPageShell, { simulateSave } from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import { PasswordField } from '../../components/settings/InputField';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import PasswordStrengthBar from '../../components/settings/PasswordStrengthBar';
import { DUMMY_SESSION } from '../../components/settings/settingsDummyData';
import { validatePassword } from '../../utils/passwordValidator';

export default function LoginSecurity() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [rememberDevices, setRememberDevices] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    if (!validatePassword(newPassword).valid) {
      toast.error('Please choose a stronger password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await simulateSave();
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Unable to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.info('Changes discarded.');
  };

  const handleLogoutOthers = () => {
    toast.success('Other devices have been signed out.');
  };

  return (
    <SettingsPageShell
      title="Login & Security"
      description="Update your password, manage security preferences, and review active sessions."
      onSave={handleSave}
      onCancel={handleCancel}
      saveLabel="Change Password"
      saving={saving}
    >
      <SectionCard
        title="Password"
        description="Choose a strong password you do not use elsewhere."
        icon="lock"
        color="security"
      >
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
      </SectionCard>

      <SectionCard
        title="Security"
        description="Additional protections for your account."
        icon="shield"
        color="security"
      >
        <ToggleSwitch
          id="two-factor"
          label="Two-Factor Authentication"
          description="Require a verification code when signing in on a new device."
          checked={twoFactor}
          onChange={setTwoFactor}
        />
        <ToggleSwitch
          id="login-alerts"
          label="Login Alerts"
          description="Get notified when someone signs in to your account."
          checked={loginAlerts}
          onChange={setLoginAlerts}
        />
        <ToggleSwitch
          id="remember-devices"
          label="Remember Devices"
          description="Stay signed in on trusted devices for faster access."
          checked={rememberDevices}
          onChange={setRememberDevices}
        />
      </SectionCard>

      <SectionCard
        title="Active Sessions"
        description="Devices currently signed in to your account."
        icon="devices"
        color="settings"
      >
        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 space-y-3">
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
          <button
            type="button"
            onClick={handleLogoutOthers}
            className="mt-2 px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px]"
          >
            Logout Other Devices
          </button>
        </div>
      </SectionCard>
    </SettingsPageShell>
  );
}
