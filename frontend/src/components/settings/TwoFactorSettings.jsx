import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import SectionCard from './SectionCard';
import InputField from './InputField';
import useAuth from '../../hooks/useAuth';
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateTwoFactorBackupCodes,
  setupTwoFactor,
} from '../../services/authService';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';

const RECOVERY_MESSAGE =
  'If you lose your authenticator and all backup codes, contact support from your registered email so we can verify your identity and manually disable two-factor authentication on your account.';

function BackupCodesList({ codes }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
      <p className="font-label-md text-on-surface mb-3">Save these backup codes now</p>
      <p className="font-body-md text-on-surface-variant text-sm mb-4">
        Each code works once. Store them somewhere safe — they will not be shown again.
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
      toast.success('Scan the QR code with your authenticator app.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to start two-factor setup.'));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmSetup = async () => {
    if (!/^\d{6}$/.test(confirmCode)) {
      toast.error('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await confirmTwoFactorSetup(confirmCode);
      setBackupCodes(data.backupCodes || []);
      setSetupData(null);
      setConfirmCode('');
      await refreshUser();
      toast.success('Two-factor authentication is now enabled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to confirm two-factor setup.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode.trim()) {
      toast.error('Enter your authenticator code to disable 2FA.');
      return;
    }

    if (isLocalAccount && !disablePassword) {
      toast.error('Enter your password to disable 2FA.');
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
      toast.success('Two-factor authentication disabled.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to disable two-factor authentication.'));
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    if (!/^\d{6}$/.test(regenCode)) {
      toast.error('Enter your current 6-digit authenticator code.');
      return;
    }

    if (isLocalAccount && !regenPassword) {
      toast.error('Enter your password to regenerate backup codes.');
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
      toast.success('New backup codes generated.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to regenerate backup codes.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 font-body-md text-sm text-on-surface-variant">
        {RECOVERY_MESSAGE}
      </p>

      {twoFactorEnabled ? (
        <div className="space-y-4">
          <p className="font-body-md text-on-surface">
            Two-factor authentication is <strong>enabled</strong> on your account.
          </p>

          <div className="space-y-3 max-w-xl">
            <p className="font-label-md text-on-surface">Regenerate backup codes</p>
            {isLocalAccount ? (
              <InputField
                id="regen-password"
                label="Current Password"
                type="password"
                value={regenPassword}
                onChange={(event) => setRegenPassword(event.target.value)}
              />
            ) : null}
            <InputField
              id="regen-code"
              label="Authenticator Code"
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
              className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-50"
            >
              Regenerate backup codes
            </button>
          </div>

          <div className="space-y-3 max-w-xl border-t border-outline-variant/20 pt-4">
            <p className="font-label-md text-on-surface">Disable two-factor authentication</p>
            {isLocalAccount ? (
              <InputField
                id="disable-password"
                label="Current Password"
                type="password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
              />
            ) : null}
            <InputField
              id="disable-code"
              label="Authenticator Code"
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
              Disable 2FA
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
              Enable two-factor authentication
            </button>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="rounded-xl border border-outline-variant/40 bg-white p-4">
                  <QRCodeSVG value={setupData.otpauthUrl} size={180} />
                </div>
                <div className="space-y-2">
                  <p className="font-label-md text-on-surface">Manual entry key</p>
                  <p className="font-mono text-sm break-all text-on-surface-variant">
                    {setupData.manualEntryKey}
                  </p>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    Scan the QR code or enter the key in Google Authenticator, Authy, or a
                    compatible app.
                  </p>
                </div>
              </div>
              <InputField
                id="confirm-2fa-code"
                label="Verification Code"
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
                Confirm and enable
              </button>
            </div>
          )}
        </div>
      )}

      {backupCodes?.length ? <BackupCodesList codes={backupCodes} /> : null}
    </div>
  );
}
