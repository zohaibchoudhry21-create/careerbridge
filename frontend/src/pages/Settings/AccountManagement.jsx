import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import SectionCard from '../../components/settings/SectionCard';
import InputField, { PasswordField } from '../../components/settings/InputField';
import SettingsConfirmDialog, {
  AccountDeletedState,
  AccountDeactivatedState,
} from '../../components/settings/SettingsConfirmDialog';
import { DELETE_ACCOUNT_CONFIRMATION_PHRASE } from '../../components/settings/settingsConstants';
import AppIcon from '../../components/icons/AppIcon';
import Button from '../../components/ui/Button';
import useAuth from '../../hooks/useAuth';
import { useDeactivateAccount, useDeleteAccount, useExportAccountData } from '../../hooks/useSettings';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

const EXPORT_INCLUDES = [
  'Profile and personal information',
  'Built resumes',
  'Sanitized sign-in session history',
];

function mapDeleteAccountErrors(error) {
  const message = getApiErrorMessage(error, 'Unable to delete account.');
  const lower = message.toLowerCase();

  if (lower.includes('password')) {
    return { password: message, form: null };
  }
  if (lower.includes('email confirmation') || lower.includes('account email')) {
    return { confirmEmail: message, form: null };
  }
  if (lower.includes('delete my account') || lower.includes('confirmation phrase')) {
    return { confirmPhrase: message, form: null };
  }

  return { password: null, confirmEmail: null, confirmPhrase: null, form: message };
}

export default function AccountManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const deleteAccount = useDeleteAccount();
  const deactivateAccount = useDeactivateAccount();
  const exportAccountData = useExportAccountData();

  const isLocalAccount = (user?.provider || user?.authProvider || 'local') === 'local';

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteErrors, setDeleteErrors] = useState({});
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const deleteRequirementsMet = useMemo(() => {
    if (!deleteAcknowledged) return false;

    if (isLocalAccount) {
      return Boolean(deletePassword.trim());
    }

    const normalizedEmail = confirmEmail.trim().toLowerCase();
    const normalizedPhrase = confirmPhrase.trim().toUpperCase();
    return (
      normalizedEmail === String(user?.email || '').toLowerCase() &&
      normalizedPhrase === DELETE_ACCOUNT_CONFIRMATION_PHRASE
    );
  }, [
    confirmEmail,
    confirmPhrase,
    deleteAcknowledged,
    deletePassword,
    isLocalAccount,
    user?.email,
  ]);

  useEffect(() => {
    if (!deleteSuccess) return undefined;

    const timer = window.setTimeout(async () => {
      await logout();
      navigate('/login', { replace: true, state: { accountDeleted: true } });
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [deleteSuccess, logout, navigate]);

  useEffect(() => {
    if (!deactivateSuccess) return undefined;

    const timer = window.setTimeout(async () => {
      await logout();
      navigate('/login', { replace: true, state: { accountDeactivated: true } });
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [deactivateSuccess, logout, navigate]);

  const clearDeleteFieldError = (field) => {
    setDeleteErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutDialogOpen(false);
      toast.success('You have been signed out.');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeactivateConfirm = async () => {
    try {
      await deactivateAccount.mutateAsync();
      setDeactivateDialogOpen(false);
      setDeactivateSuccess(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to deactivate account.'));
    }
  };

  const handleExportConfirm = async () => {
    try {
      const result = await exportAccountData.mutateAsync();
      setExportDialogOpen(false);
      toast.success(`Download started (${result?.filename || 'export.zip'}).`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to export your data.'));
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteErrors({});

    if (!deleteRequirementsMet) {
      if (!deleteAcknowledged) {
        setDeleteErrors({ form: 'Please confirm that you understand this action cannot be undone.' });
      } else if (isLocalAccount && !deletePassword.trim()) {
        setDeleteErrors({ password: 'Enter your password to confirm account deletion.' });
      } else if (!isLocalAccount) {
        const nextErrors = {};
        if (confirmEmail.trim().toLowerCase() !== String(user?.email || '').toLowerCase()) {
          nextErrors.confirmEmail = 'Email must match your account email exactly.';
        }
        if (confirmPhrase.trim().toUpperCase() !== DELETE_ACCOUNT_CONFIRMATION_PHRASE) {
          nextErrors.confirmPhrase = `Type "${DELETE_ACCOUNT_CONFIRMATION_PHRASE}" to confirm.`;
        }
        setDeleteErrors(nextErrors);
      }
      return;
    }

    try {
      const payload = isLocalAccount
        ? { password: deletePassword }
        : {
            confirmEmail: confirmEmail.trim(),
            confirmPhrase: confirmPhrase.trim(),
          };

      await deleteAccount.mutateAsync(payload);
      setDeleteSuccess(true);
    } catch (error) {
      const mapped = mapDeleteAccountErrors(error);
      setDeleteErrors(mapped);
    }
  };

  if (deactivateSuccess) {
    return (
      <SettingsPageShell
        title="Account Management"
        description="Manage account status, data export, and sign out options."
        showActions={false}
      >
        <SectionCard color="warning" icon="pause_circle">
          <AccountDeactivatedState />
        </SectionCard>
      </SettingsPageShell>
    );
  }

  if (deleteSuccess) {
    return (
      <SettingsPageShell
        title="Account Management"
        description="Manage account status, data export, and sign out options."
        showActions={false}
      >
        <SectionCard color="danger" icon="delete_forever">
          <AccountDeletedState />
        </SectionCard>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell
      title="Account Management"
      description="Manage account status, data export, and sign out options."
      showActions={false}
    >
      <SectionCard
        title="Export Data"
        description="Download a copy of your profile, resumes, and account activity."
        icon="download"
        color="resume"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4">
          <div className="space-y-2 min-w-0">
            <p className="font-label-md text-on-surface">Portable account archive</p>
            <p className="font-body-md text-sm text-on-surface-variant">
              Receive a ZIP file with your profile, resumes, and sanitized session history. Limited
              to one export every 24 hours.
            </p>
            <ul className="font-body-md text-xs text-on-surface-variant space-y-1">
              {EXPORT_INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <AppIcon name="check_circle" size="h-4 w-4" className="text-secondary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Button
            type="button"
            variant="primary"
            onClick={() => setExportDialogOpen(true)}
            disabled={exportAccountData.isPending}
            className="min-h-[44px] gap-2 px-4 py-2.5 shrink-0"
          >
            {exportAccountData.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <AppIcon name="download" size="button" />
                Download my data
              </>
            )}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Deactivate Account"
        description="Temporarily disable your account. Your data will be preserved and you can reactivate anytime."
        icon="pause_circle"
        color="warning"
      >
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 sm:p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
              <AppIcon name="pause_circle" size="button" className="text-warning" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-label-md text-on-surface">Pause your account</p>
              <p className="font-body-md text-sm text-on-surface-variant">
                You will be signed out on all devices. To sign in again, you must explicitly confirm
                reactivation — we will not restore access automatically.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDeactivateDialogOpen(true)}
            disabled={deactivateAccount.isPending || user?.status === 'deactivated'}
            className="min-h-[44px] gap-2 px-4 py-2.5"
          >
            {deactivateAccount.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
                Deactivating...
              </>
            ) : (
              'Deactivate account'
            )}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Sign Out"
        description="Sign out of your account on this device. Your session will end here and on the server."
        icon="logout"
        color="mode"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4">
          <div className="space-y-1 min-w-0">
            <p className="font-label-md text-on-surface">End this session</p>
            <p className="font-body-md text-sm text-on-surface-variant">
              Signed in as <span className="font-medium text-on-surface">{user?.email}</span>
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLogoutDialogOpen(true)}
            disabled={loggingOut}
            className="min-h-[44px] gap-2 px-4 py-2.5 shrink-0"
          >
            <AppIcon name="logout" size="button" />
            Sign out
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Delete Account"
        description="Permanently remove your account and all associated data."
        icon="delete_forever"
        color="danger"
        className="border-error/25"
      >
        <div className="rounded-xl border border-error/30 bg-error-container/15 p-4 sm:p-5 space-y-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error/10">
              <AppIcon name="warning" size="button" className="text-error" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-label-md text-on-surface">This action is permanent</p>
              <p className="font-body-md text-sm text-on-surface-variant">
                All resumes, preferences, sessions, and account history for{' '}
                <span className="font-medium text-on-surface">{user?.email}</span> will be deleted
                and cannot be recovered.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-error/20 bg-white/60 px-3 py-3">
            <input
              type="checkbox"
              checked={deleteAcknowledged}
              onChange={(event) => {
                setDeleteAcknowledged(event.target.checked);
                clearDeleteFieldError('form');
              }}
              className="mt-0.5 h-4 w-4 rounded border-outline-variant text-error focus:ring-error"
            />
            <span className="font-body-md text-sm text-on-surface">
              I understand this action cannot be undone and all my data will be permanently deleted.
            </span>
          </label>

          {isLocalAccount ? (
            <PasswordField
              id="delete-account-password"
              label="Confirm with your password"
              value={deletePassword}
              onChange={(event) => {
                setDeletePassword(event.target.value);
                clearDeleteFieldError('password');
                clearDeleteFieldError('form');
              }}
              showPassword={showDeletePassword}
              onToggleShow={() => setShowDeletePassword((value) => !value)}
              error={deleteErrors.password}
              required
            />
          ) : (
            <div className="space-y-4 max-w-xl">
              <InputField
                id="delete-confirm-email"
                label="Confirm your account email"
                type="email"
                value={confirmEmail}
                onChange={(event) => {
                  setConfirmEmail(event.target.value);
                  clearDeleteFieldError('confirmEmail');
                  clearDeleteFieldError('form');
                }}
                placeholder={user?.email || 'you@example.com'}
                autoComplete="email"
                error={deleteErrors.confirmEmail}
                required
              />
              <InputField
                id="delete-confirm-phrase"
                label="Confirmation phrase"
                value={confirmPhrase}
                onChange={(event) => {
                  setConfirmPhrase(event.target.value);
                  clearDeleteFieldError('confirmPhrase');
                  clearDeleteFieldError('form');
                }}
                placeholder={DELETE_ACCOUNT_CONFIRMATION_PHRASE}
                className="font-mono"
                error={deleteErrors.confirmPhrase}
                required
              />
              <p className="font-body-md text-xs text-on-surface-variant">
                Type{' '}
                <span className="font-mono font-medium text-on-surface">
                  {DELETE_ACCOUNT_CONFIRMATION_PHRASE}
                </span>{' '}
                exactly. For security, you must have signed in recently with your provider.
              </p>
            </div>
          )}

          {deleteErrors.form ? (
            <p className="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              {deleteErrors.form}
            </p>
          ) : null}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-error/15">
            <p className="font-body-md text-xs text-on-surface-variant">
              {deleteRequirementsMet
                ? 'Requirements met. You can delete your account.'
                : 'Complete all requirements above to enable deletion.'}
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!deleteRequirementsMet || deleteAccount.isPending}
              className="min-h-[44px] gap-2 px-4 py-2.5 shrink-0"
            >
              {deleteAccount.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting account...
                </>
              ) : (
                <>
                  <AppIcon name="delete_forever" size="button" />
                  Delete account permanently
                </>
              )}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SettingsConfirmDialog
        open={logoutDialogOpen}
        title="Sign out of CareerBridge?"
        description="You will need to sign in again to access your account on this device."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => {
          if (!loggingOut) setLogoutDialogOpen(false);
        }}
      />

      <SettingsConfirmDialog
        open={deactivateDialogOpen}
        title="Deactivate your account?"
        description="You will be signed out everywhere. Your data stays saved, but signing in again will require an explicit reactivation confirmation."
        confirmLabel="Deactivate"
        cancelLabel="Keep account active"
        loading={deactivateAccount.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => {
          if (!deactivateAccount.isPending) setDeactivateDialogOpen(false);
        }}
      />

      <SettingsConfirmDialog
        open={exportDialogOpen}
        title="Download your data?"
        description="We will prepare a ZIP file with your profile, resumes, and sanitized session history. Excludes passwords and security secrets. You can request another export after 24 hours."
        confirmLabel="Download"
        cancelLabel="Cancel"
        loading={exportAccountData.isPending}
        onConfirm={handleExportConfirm}
        onCancel={() => {
          if (!exportAccountData.isPending) setExportDialogOpen(false);
        }}
      />
    </SettingsPageShell>
  );
}
