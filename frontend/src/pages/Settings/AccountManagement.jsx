import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

function mapDeleteAccountErrors(error, t) {
  const message = getApiErrorMessage(error, t('account.delete.errors.generic'));
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
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const deleteAccount = useDeleteAccount();
  const deactivateAccount = useDeactivateAccount();
  const exportAccountData = useExportAccountData();

  const isLocalAccount = (user?.provider || user?.authProvider || 'local') === 'local';

  const exportIncludes = useMemo(
    () => [
      t('account.export.includes.profile'),
      t('account.export.includes.resumes'),
      t('account.export.includes.sessions'),
    ],
    [t]
  );

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
      toast.success(t('account.signOut.success'));
      navigate('/', { replace: true });
    } catch {
      toast.error(t('account.toasts.logoutFailed'));
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
      toast.error(getApiErrorMessage(error, t('account.toasts.deactivateError')));
    }
  };

  const handleExportConfirm = async () => {
    try {
      const result = await exportAccountData.mutateAsync();
      setExportDialogOpen(false);
      toast.success(
        t('account.export.downloadStarted', {
          filename: result?.filename || 'export.zip',
        })
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('account.toasts.exportError')));
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteErrors({});

    if (!deleteRequirementsMet) {
      if (!deleteAcknowledged) {
        setDeleteErrors({ form: t('account.delete.errors.acknowledge') });
      } else if (isLocalAccount && !deletePassword.trim()) {
        setDeleteErrors({ password: t('account.delete.errors.password') });
      } else if (!isLocalAccount) {
        const nextErrors = {};
        if (confirmEmail.trim().toLowerCase() !== String(user?.email || '').toLowerCase()) {
          nextErrors.confirmEmail = t('account.delete.errors.email');
        }
        if (confirmPhrase.trim().toUpperCase() !== DELETE_ACCOUNT_CONFIRMATION_PHRASE) {
          nextErrors.confirmPhrase = t('account.delete.errors.phrase', {
            phrase: DELETE_ACCOUNT_CONFIRMATION_PHRASE,
          });
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
      const mapped = mapDeleteAccountErrors(error, t);
      setDeleteErrors(mapped);
    }
  };

  if (deactivateSuccess) {
    return (
      <SettingsPageShell
        title={t('account.title')}
        description={t('account.description')}
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
        title={t('account.title')}
        description={t('account.description')}
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
      title={t('account.title')}
      description={t('account.description')}
      showActions={false}
    >
      <SectionCard
        title={t('account.export.title')}
        description={t('account.export.description')}
        icon="download"
        color="resume"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4">
          <div className="space-y-2 min-w-0">
            <p className="font-label-md text-on-surface">{t('account.export.archiveTitle')}</p>
            <p className="font-body-md text-sm text-on-surface-variant">
              {t('account.export.archiveDescription')}
            </p>
            <ul className="font-body-md text-xs text-on-surface-variant space-y-1">
              {exportIncludes.map((item) => (
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
                {t('account.export.preparing')}
              </>
            ) : (
              <>
                <AppIcon name="download" size="button" />
                {t('account.export.download')}
              </>
            )}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t('account.deactivate.title')}
        description={t('account.deactivate.description')}
        icon="pause_circle"
        color="warning"
      >
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 sm:p-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
              <AppIcon name="pause_circle" size="button" className="text-warning" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-label-md text-on-surface">{t('account.deactivate.pauseTitle')}</p>
              <p className="font-body-md text-sm text-on-surface-variant">
                {t('account.deactivate.pauseDescription')}
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
                {t('account.deactivate.deactivating')}
              </>
            ) : (
              t('account.deactivate.button')
            )}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t('account.signOut.title')}
        description={t('account.signOut.description')}
        icon="logout"
        color="mode"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-4">
          <div className="space-y-1 min-w-0">
            <p className="font-label-md text-on-surface">{t('account.signOut.endSession')}</p>
            <p className="font-body-md text-sm text-on-surface-variant">
              {t('account.signOut.signedInAs')}{' '}
              <span className="font-medium text-on-surface">{user?.email}</span>
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
            {t('account.signOut.button')}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title={t('account.delete.title')}
        description={t('account.delete.description')}
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
              <p className="font-label-md text-on-surface">{t('account.delete.permanentTitle')}</p>
              <p className="font-body-md text-sm text-on-surface-variant">
                {t('account.delete.permanentDescription', { email: user?.email })}
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
            <span className="font-body-md text-sm text-on-surface">{t('account.delete.acknowledge')}</span>
          </label>

          {isLocalAccount ? (
            <PasswordField
              id="delete-account-password"
              label={t('account.delete.confirmPassword')}
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
                label={t('account.delete.confirmEmail')}
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
                label={t('account.delete.confirmPhrase')}
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
                {t('account.delete.phraseHint', { phrase: DELETE_ACCOUNT_CONFIRMATION_PHRASE })}
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
                ? t('account.delete.requirementsMet')
                : t('account.delete.requirementsPending')}
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
                  {t('account.delete.deleting')}
                </>
              ) : (
                <>
                  <AppIcon name="delete_forever" size="button" />
                  {t('account.delete.button')}
                </>
              )}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SettingsConfirmDialog
        open={logoutDialogOpen}
        title={t('account.signOut.dialogTitle')}
        description={t('account.signOut.dialogDescription')}
        confirmLabel={t('account.signOut.confirm')}
        cancelLabel={t('account.signOut.cancel')}
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => {
          if (!loggingOut) setLogoutDialogOpen(false);
        }}
      />

      <SettingsConfirmDialog
        open={deactivateDialogOpen}
        title={t('account.deactivate.dialogTitle')}
        description={t('account.deactivate.dialogDescription')}
        confirmLabel={t('account.deactivate.confirm')}
        cancelLabel={t('account.deactivate.cancel')}
        loading={deactivateAccount.isPending}
        onConfirm={handleDeactivateConfirm}
        onCancel={() => {
          if (!deactivateAccount.isPending) setDeactivateDialogOpen(false);
        }}
      />

      <SettingsConfirmDialog
        open={exportDialogOpen}
        title={t('account.export.dialogTitle')}
        description={t('account.export.dialogDescription')}
        confirmLabel={t('account.export.download')}
        cancelLabel={t('common:buttons.cancel')}
        loading={exportAccountData.isPending}
        onConfirm={handleExportConfirm}
        onCancel={() => {
          if (!exportAccountData.isPending) setExportDialogOpen(false);
        }}
      />
    </SettingsPageShell>
  );
}
