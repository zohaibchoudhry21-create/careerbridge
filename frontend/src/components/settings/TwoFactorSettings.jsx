import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import InputField from './InputField';
import useAuth from '../../hooks/useAuth';
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateTwoFactorBackupCodes,
  setupTwoFactor,
} from '../../services/authService';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

function BackupCodesList({ codes }) {
  const { t } = useTranslation('settings');

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
      <p className="font-label-md text-on-surface mb-3">{t('twoFactor.backupCodesTitle')}</p>
      <p className="font-body-md text-on-surface-variant text-sm mb-4">
        {t('twoFactor.backupCodesDescription')}
      </p>
      <div className="grid grid-cols-2 gap-2 font-mono text-sm text-on-surface">
        {codes.map((code) => (
          <div key={code} className="rounded-lg bg-surface-container px-3 py-2">
            {code}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TwoFactorSettings() {
  const { t } = useTranslation('settings');
  const { user, refreshUser } = useAuth();
  const isLocalAccount = (user?.provider || user?.authProvider || 'local') === 'local';
  const twoFactorEnabled = user?.twoFactorEnabled === true;

  const [setupData, setSetupData] = useState(null);
  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regenPassword, setRegenPassword] = useState('');
  const [regenCode, setRegenCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleStartSetup = async () => {
    setBusy(true);
    try {
      const { data } = await setupTwoFactor();
      setSetupData(data);
      setBackupCodes(null);
      setConfirmCode('');
      toast.success(t('twoFactor.toasts.setupStarted'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('twoFactor.toasts.setupStartError')));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!/^\d{6}$/.test(confirmCode)) {
      toast.error(t('twoFactor.toasts.invalidCode'));
      return;
    }

    setBusy(true);
    try {
      const { data } = await confirmTwoFactorSetup(confirmCode);
      setBackupCodes(data.backupCodes || []);
      setSetupData(null);
      setConfirmCode('');
      await refreshUser();
      toast.success(t('twoFactor.toasts.enabled'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('twoFactor.toasts.confirmError')));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode.trim()) {
      toast.error(t('twoFactor.toasts.disableCodeRequired'));
      return;
    }

    if (isLocalAccount && !disablePassword) {
      toast.error(t('twoFactor.toasts.disablePasswordRequired'));
      return;
    }

    setBusy(true);
    try {
      await disableTwoFactor({
        password: isLocalAccount ? disablePassword : undefined,
        code: disableCode,
      });
      setDisablePassword('');
      setDisableCode('');
      setBackupCodes(null);
      await refreshUser();
      toast.success(t('twoFactor.toasts.disabled'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('twoFactor.toasts.disableError')));
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (!/^\d{6}$/.test(regenCode)) {
      toast.error(t('twoFactor.toasts.regenCodeRequired'));
      return;
    }

    if (isLocalAccount && !regenPassword) {
      toast.error(t('twoFactor.toasts.regenPasswordRequired'));
      return;
    }

    setBusy(true);
    try {
      const { data } = await regenerateTwoFactorBackupCodes({
        password: isLocalAccount ? regenPassword : undefined,
        code: regenCode,
      });
      setBackupCodes(data.backupCodes || []);
      setRegenPassword('');
      setRegenCode('');
      toast.success(t('twoFactor.toasts.regenSuccess'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('twoFactor.toasts.regenError')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-body-md text-sm text-on-surface-variant">
        {t('twoFactor.recoveryMessage')}
      </p>

      {twoFactorEnabled ? (
        <div className="space-y-4">
          <p className="font-body-md app-heading">
            <Trans i18nKey="twoFactor.enabled" ns="settings" components={{ strong: <strong /> }} />
          </p>

          <div className="space-y-3 max-w-xl">
            <p className="font-label-md app-heading">{t('twoFactor.regenerateTitle')}</p>
            {isLocalAccount ? (
              <InputField
                id="regen-password"
                label={t('twoFactor.currentPassword')}
                type="password"
                value={regenPassword}
                onChange={(event) => setRegenPassword(event.target.value)}
              />
            ) : null}
            <InputField
              id="regen-code"
              label={t('twoFactor.authenticatorCode')}
              value={regenCode}
              onChange={(event) => setRegenCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
            />
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md app-heading hover:bg-surface-container dark:hover:bg-[#243044] transition-colors min-h-[44px] disabled:opacity-50"
            >
              {t('twoFactor.regenerateButton')}
            </button>
          </div>

          <div className="space-y-3 max-w-xl border-t border-outline-variant/20 pt-4">
            <p className="font-label-md app-heading">{t('twoFactor.disableTitle')}</p>
            {isLocalAccount ? (
              <InputField
                id="disable-password"
                label={t('twoFactor.currentPassword')}
                type="password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
              />
            ) : null}
            <InputField
              id="disable-code"
              label={t('twoFactor.authenticatorCode')}
              value={disableCode}
              onChange={(event) => setDisableCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
            />
            <button
              type="button"
              onClick={handleDisable}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-error/40 font-label-md text-error hover:bg-error/5 transition-colors min-h-[44px] disabled:opacity-50"
            >
              {t('twoFactor.disableButton')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!setupData ? (
            <button
              type="button"
              onClick={handleStartSetup}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-secondary text-on-secondary font-label-md hover:opacity-95 transition-colors min-h-[44px] disabled:opacity-50"
            >
              {t('twoFactor.enableButton')}
            </button>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="rounded-xl border border-outline-variant/40 bg-white p-4">
                  <QRCodeSVG value={setupData.otpauthUrl} size={180} />
                </div>
                <div className="space-y-2">
                  <p className="font-label-md app-heading">{t('twoFactor.manualEntryKey')}</p>
                  <p className="font-mono text-sm break-all app-muted">
                    {setupData.manualEntryKey}
                  </p>
                  <p className="font-body-md app-muted text-sm">{t('twoFactor.scanQr')}</p>
                </div>
              </div>
              <InputField
                id="confirm-2fa-code"
                label={t('twoFactor.verificationCode')}
                value={confirmCode}
                onChange={(event) => setConfirmCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
              />
              <button
                type="button"
                onClick={handleConfirmSetup}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-secondary text-on-secondary font-label-md hover:opacity-95 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {t('twoFactor.confirmEnable')}
              </button>
            </div>
          )}
        </div>
      )}

      {backupCodes?.length ? <BackupCodesList codes={backupCodes} /> : null}
    </div>
  );
}
