import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import { PasswordField } from '../../components/settings/InputField';
import ToggleSwitch from '../../components/settings/ToggleSwitch';
import PasswordStrengthBar from '../../components/settings/PasswordStrengthBar';
import AppIcon from '../../components/icons/AppIcon';
import TwoFactorSettings from '../../components/settings/TwoFactorSettings';
import { validatePassword } from '../../utils/passwordValidator';
import useAuth from '../../hooks/useAuth';
import {
  useChangePassword,
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
  useUpdateAccount,
  useUpdateSessionTrust,
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

function ActiveSessionsSection({ rememberDevicesEnabled }) {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: sessions = [], isLoading, isError, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const updateSessionTrust = useUpdateSessionTrust();

  const otherSessions = sessions.filter((session) => !session.isCurrent);
  const isBusy =
    revokeSession.isPending || revokeOthers.isPending || updateSessionTrust.isPending;

  const handleRevokeSession = async (session) => {
    try {
      const result = await revokeSession.mutateAsync(session.id);

      if (result?.signedOutCurrent || session.isCurrent) {
        toast.success(t('loginSecurity.toasts.signedOut'));
        await logout();
        navigate('/login');
        return;
      }

      toast.success(t('loginSecurity.toasts.deviceSignedOut'));
      await refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('loginSecurity.toasts.signOutDeviceError')));
    }
  };

  const handleRevokeOthers = async () => {
    if (otherSessions.length === 0) {
      toast.info(t('loginSecurity.toasts.noOtherSessions'));
      return;
    }

    try {
      const result = await revokeOthers.mutateAsync();
      toast.success(result?.message || t('loginSecurity.toasts.othersSignedOut'));
      await refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('loginSecurity.toasts.signOutOthersError')));
    }
  };

  const handleTrustChange = async (session, trusted) => {
    if (!rememberDevicesEnabled) {
      toast.error(t('loginSecurity.toasts.trustRememberRequired'));
      return;
    }

    try {
      await updateSessionTrust.mutateAsync({ sessionId: session.id, trusted });
      toast.success(
        trusted ? t('loginSecurity.toasts.trustAdded') : t('loginSecurity.toasts.trustRemoved')
      );
      await refetch();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('loginSecurity.toasts.trustError')));
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
    return <ComingSoonNote>{t('loginSecurity.sessions.loadError')}</ComingSoonNote>;
  }

  if (sessions.length === 0) {
    return <ComingSoonNote>{t('loginSecurity.sessions.empty')}</ComingSoonNote>;
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
                      {t('loginSecurity.sessions.thisDevice')}
                    </span>
                  ) : null}
                  {session.isTrusted ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-label-md text-primary">
                      {t('loginSecurity.sessions.trusted')}
                    </span>
                  ) : null}
                </div>
                <p className="font-body-md text-on-surface-variant text-sm">
                  {t('loginSecurity.sessions.ip', {
                    ip: session.ipAddress || t('loginSecurity.sessions.unknownIp'),
                  })}
                </p>
                <p className="font-body-md text-on-surface-variant text-sm">
                  {t('loginSecurity.sessions.signedIn', {
                    date: formatSessionDate(session.createdAt),
                  })}
                </p>
                <p className="font-body-md text-on-surface-variant text-sm">
                  {t('loginSecurity.sessions.lastActive', {
                    date: formatSessionDate(session.lastActiveAt),
                  })}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {rememberDevicesEnabled ? (
                  <button
                    type="button"
                    onClick={() => handleTrustChange(session, !session.isTrusted)}
                    disabled={isBusy}
                    className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-50"
                  >
                    {session.isTrusted
                      ? t('loginSecurity.sessions.removeTrust')
                      : t('loginSecurity.sessions.trustDevice')}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleRevokeSession(session)}
                  disabled={isBusy}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-50"
                >
                  {session.isCurrent
                    ? t('loginSecurity.sessions.signOut')
                    : t('loginSecurity.sessions.signOutDevice')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {otherSessions.length > 0 ? (
        <button
          type="button"
          onClick={handleRevokeOthers}
          disabled={isBusy}
          className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-50"
        >
          {t('loginSecurity.sessions.signOutAllOthers')}
        </button>
      ) : null}
    </div>
  );
}

export default function LoginSecurity() {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const changePassword = useChangePassword();
  const updateAccount = useUpdateAccount();
  const isLocalAccount = (user?.provider || user?.authProvider || 'local') === 'local';
  const loginAlertsEnabled = user?.loginAlertsEnabled !== false;
  const rememberDevicesEnabled = user?.rememberDevicesEnabled === true;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    if (!isLocalAccount) {
      toast.error(t('loginSecurity.toasts.passwordSocialOnly'));
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('loginSecurity.toasts.passwordFieldsRequired'));
      return;
    }

    const strength = validatePassword(newPassword);
    if (!strength.valid) {
      toast.error(strength.errors[0] || t('loginSecurity.toasts.passwordWeak'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('loginSecurity.toasts.passwordMismatch'));
      return;
    }

    try {
      const result = await changePassword.mutateAsync({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success(result?.message || t('loginSecurity.toasts.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('loginSecurity.toasts.passwordChangeError')));
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.info(t('loginSecurity.toasts.discarded'));
  };

  const handleLoginAlertsChange = async (checked) => {
    try {
      await updateAccount.mutateAsync({ loginAlertsEnabled: checked });
      toast.success(
        checked ? t('loginSecurity.toasts.loginAlertsOn') : t('loginSecurity.toasts.loginAlertsOff')
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('loginSecurity.toasts.loginAlertsError')));
    }
  };

  const handleRememberDevicesChange = async (checked) => {
    try {
      await updateAccount.mutateAsync({ rememberDevicesEnabled: checked });
      toast.success(
        checked ? t('loginSecurity.toasts.rememberOn') : t('loginSecurity.toasts.rememberOff')
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('loginSecurity.toasts.rememberError')));
    }
  };

  return (
    <SettingsPageShell
      title={t('loginSecurity.title')}
      description={t('loginSecurity.description')}
      onSave={isLocalAccount ? handleSave : undefined}
      onCancel={isLocalAccount ? handleCancel : undefined}
      saveLabel={t('loginSecurity.changePassword')}
      saving={changePassword.isPending}
      showActions={isLocalAccount}
    >
      <SectionCard
        title={t('loginSecurity.password.title')}
        description={
          isLocalAccount
            ? t('loginSecurity.password.descriptionLocal')
            : t('loginSecurity.password.descriptionSocial')
        }
        icon="lock"
        color="security"
      >
        {isLocalAccount ? (
          <div className="space-y-4 max-w-xl">
            <PasswordField
              id="current-password"
              label={t('loginSecurity.password.current')}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              showPassword={showCurrent}
              onToggleShow={() => setShowCurrent((value) => !value)}
              required
            />
            <div>
              <PasswordField
                id="new-password"
                label={t('loginSecurity.password.new')}
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
              label={t('loginSecurity.password.confirm')}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              showPassword={showConfirm}
              onToggleShow={() => setShowConfirm((value) => !value)}
              required
            />
          </div>
        ) : (
          <ComingSoonNote>
            {t('loginSecurity.password.socialNote', {
              provider: user?.provider || user?.authProvider,
            })}
          </ComingSoonNote>
        )}
      </SectionCard>

      <SectionCard
        title={t('loginSecurity.twoFactor.title')}
        description={t('loginSecurity.twoFactor.description')}
        icon="shield"
        color="focus"
      >
        <TwoFactorSettings />
      </SectionCard>

      <SectionCard
        title={t('loginSecurity.securityPrefs.title')}
        description={t('loginSecurity.securityPrefs.description')}
        icon="shield"
        color="focus"
      >
        <ToggleSwitch
          id="login-alerts"
          label={t('loginSecurity.securityPrefs.loginAlerts')}
          description={t('loginSecurity.securityPrefs.loginAlertsDescription')}
          checked={loginAlertsEnabled}
          onChange={handleLoginAlertsChange}
          disabled={updateAccount.isPending}
        />
        <ToggleSwitch
          id="remember-devices"
          label={t('loginSecurity.securityPrefs.rememberDevices')}
          description={t('loginSecurity.securityPrefs.rememberDevicesDescription')}
          checked={rememberDevicesEnabled}
          onChange={handleRememberDevicesChange}
          disabled={updateAccount.isPending}
        />
      </SectionCard>

      <SectionCard
        title={t('loginSecurity.sessions.title')}
        description={t('loginSecurity.sessions.description')}
        icon="devices"
        color="role"
      >
        <p className="font-body-md text-on-surface-variant text-sm">
          {t('loginSecurity.sessions.passwordNote')}
        </p>
        <ActiveSessionsSection rememberDevicesEnabled={rememberDevicesEnabled} />
      </SectionCard>
    </SettingsPageShell>
  );
}
