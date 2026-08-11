import { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

export default function SignOutDialog({
  open,
  loading = false,
  userEmail,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation(['settings', 'common']);

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t('buttons.closeDialog', { ns: 'common' })}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px] transition-opacity"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-out-dialog-title"
        className={[
          'relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/80',
          'bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] transition-shadow duration-200',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className={[
            'absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl',
            'text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600',
            'disabled:pointer-events-none disabled:opacity-50',
          ].join(' ')}
          aria-label={t('buttons.closeDialog', { ns: 'common' })}
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>

        <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 pb-5 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-8 ring-red-50/60">
            <LogOut className="h-6 w-6 text-red-600" strokeWidth={2} aria-hidden />
          </div>
          <h2
            id="sign-out-dialog-title"
            className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
          >
            {t('account.signOut.dialogTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {t('account.signOut.dialogDescription')}
          </p>
          {userEmail ? (
            <p className="mt-4 inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span className="truncate">{t('account.signOut.signedInAs')} {userEmail}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] w-full px-4 py-2.5 sm:w-auto"
          >
            {t('account.signOut.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] w-full gap-2 px-4 py-2.5 sm:w-auto"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('account.signOut.confirm')}...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden />
                {t('account.signOut.confirm')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
