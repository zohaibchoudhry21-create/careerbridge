import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Camera, Check, GripVertical, Lightbulb, Loader2, Plus, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { resolveApiError } from '../../../utils/apiError';
import {
  PHOTO_ACCEPT,
  getPersonalPhoto,
  readProfilePhotoAsBase64,
} from '../utils/personalDetailsPhoto';

const OPTIONAL_FIELDS = [
  { key: 'linkedinLink', labelKey: 'personalDetails.linkedin' },
  { key: 'website', labelKey: 'personalDetails.website' },
  { key: 'nationality', labelKey: 'personalDetails.nationality' },
  { key: 'dateOfBirth', labelKey: 'personalDetails.dateOfBirth' },
  { key: 'visa', labelKey: 'personalDetails.visa' },
  { key: 'passportOrId', labelKey: 'personalDetails.passportOrId' },
  { key: 'availability', labelKey: 'personalDetails.availability' },
  { key: 'githubLink', labelKey: 'personalDetails.github', moreOnly: true },
];

const inputClass =
  'w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-secondary/40';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function HeaderPersonalDetailsPanel({
  value = {},
  onChange,
  onDone,
  onAiTips,
}) {
  const { t } = useTranslation('resumeBuilder');
  const photoInputRef = useRef(null);
  const [tips, setTips] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [tipsBusy, setTipsBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [showMoreOptional, setShowMoreOptional] = useState(false);
  const [enabledOptional, setEnabledOptional] = useState(() => {
    const initial = {};
    for (const field of OPTIONAL_FIELDS) {
      if (value?.[field.key]) initial[field.key] = true;
    }
    return initial;
  });

  const photoSrc = getPersonalPhoto(value);

  const patch = (field, nextValue) => {
    onChange?.({ ...value, [field]: nextValue });
  };

  const visibleOptional = useMemo(
    () =>
      OPTIONAL_FIELDS.filter((field) => {
        if (enabledOptional[field.key] || value?.[field.key]) return true;
        return false;
      }),
    [enabledOptional, value]
  );

  const availablePills = useMemo(
    () =>
      OPTIONAL_FIELDS.filter((field) => {
        if (enabledOptional[field.key] || value?.[field.key]) return false;
        if (field.moreOnly && !showMoreOptional) return false;
        return true;
      }),
    [enabledOptional, value, showMoreOptional]
  );

  const handleGetTips = async () => {
    if (!onAiTips) return;
    setTipsBusy(true);
    try {
      const result = await onAiTips();
      setTips(result?.text || '');
      setShowTips(true);
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.aiUnavailable')));
    } finally {
      setTipsBusy(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      const dataUrl = await readProfilePhotoAsBase64(file);
      patch('photo', dataUrl);
      toast.success(t('personalDetails.photoUpdated'));
    } catch (error) {
      toast.error(error.message || t('personalDetails.photoFailed'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const enableOptional = (key) => {
    setEnabledOptional((prev) => ({ ...prev, [key]: true }));
  };

  const clearOptional = (key) => {
    setEnabledOptional((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    patch(key, '');
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 sm:p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-on-surface">{t('personalDetails.title')}</h3>
        <button
          type="button"
          onClick={handleGetTips}
          disabled={tipsBusy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
        >
          {tipsBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-secondary" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 text-secondary" />
          )}
          {t('personalDetails.getTips')}
        </button>
      </div>

      {showTips && tips ? (
        <div className="rounded-lg border border-secondary/20 bg-secondary-fixed/40 px-3 py-2 text-xs text-on-secondary-fixed-variant whitespace-pre-wrap leading-relaxed">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-secondary">{t('editEntry.tipsTitle')}</span>
            <button
              type="button"
              className="text-on-surface-variant hover:text-on-surface"
              onClick={() => setShowTips(false)}
            >
              {t('modal.close')}
            </button>
          </div>
          {tips}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <Field label={t('personalDetails.fullName')}>
            <input
              className={inputClass}
              value={value.fullName || ''}
              placeholder={t('personalDetails.placeholders.fullName')}
              onChange={(e) => patch('fullName', e.target.value)}
            />
          </Field>
          <Field label={t('personalDetails.professionalTitle')}>
            <input
              className={inputClass}
              value={value.professionalTitle || ''}
              placeholder={t('personalDetails.placeholders.professionalTitle')}
              onChange={(e) => patch('professionalTitle', e.target.value)}
            />
          </Field>
        </div>

        <div className="justify-self-center sm:justify-self-end">
          <p className="text-sm font-medium text-on-surface mb-1.5 text-center">{t('personalDetails.photo')}</p>
          <input
            ref={photoInputRef}
            type="file"
            accept={PHOTO_ACCEPT}
            className="hidden"
            onChange={handlePhotoChange}
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoBusy}
            className="relative h-24 w-24 rounded-full border border-outline-variant bg-surface-container-low overflow-hidden hover:border-secondary transition-colors disabled:opacity-50"
            aria-label={t('personalDetails.uploadPhoto')}
          >
            {photoSrc ? (
              <img src={photoSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-on-surface-variant">
                {photoBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-7 w-7" />}
              </span>
            )}
          </button>
          {photoSrc ? (
            <button
              type="button"
              onClick={() => patch('photo', '')}
              className="mt-1.5 block mx-auto text-[11px] text-error hover:underline"
            >
              {t('personalDetails.removePhoto')}
            </button>
          ) : (
            <p className="mt-1.5 text-[11px] text-on-surface-variant text-center max-w-[7rem]">
              {t('personalDetails.uploadPhotoHint')}
            </p>
          )}
        </div>
      </div>

      {[
        {
          key: 'email',
          label: t('personalDetails.email'),
          placeholder: t('personalDetails.placeholders.email'),
          type: 'email',
        },
        {
          key: 'phone',
          label: t('personalDetails.phone'),
          placeholder: t('personalDetails.placeholders.phone'),
          type: 'tel',
        },
        {
          key: 'address',
          label: t('personalDetails.location'),
          placeholder: t('personalDetails.placeholders.location'),
          type: 'text',
        },
      ].map((field) => (
        <Field key={field.key} label={field.label}>
          <div className="relative">
            <input
              type={field.type}
              className={`${inputClass} pr-10`}
              value={value[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(e) => patch(field.key, e.target.value)}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
              <GripVertical className="h-4 w-4" />
            </span>
          </div>
        </Field>
      ))}

      {visibleOptional.map((field) => (
        <Field key={field.key} label={t(field.labelKey)}>
          <div className="relative">
            <input
              type="text"
              className={`${inputClass} pr-10`}
              value={value[field.key] || ''}
              placeholder={t(`personalDetails.placeholders.${field.key}`, {
                defaultValue: t(field.labelKey),
              })}
              onChange={(e) => patch(field.key, e.target.value)}
            />
            <button
              type="button"
              onClick={() => clearOptional(field.key)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-on-surface-variant hover:text-error"
              aria-label={t('editEntry.clearField', { label: t(field.labelKey) })}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </Field>
      ))}

      <div>
        <p className="text-sm font-medium text-on-surface mb-2">{t('personalDetails.addDetails')}</p>
        <div className="flex flex-wrap gap-2">
          {availablePills.map((field) => (
            <button
              key={field.key}
              type="button"
              onClick={() => enableOptional(field.key)}
              className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container"
            >
              <Plus className="h-3 w-3 text-secondary" />
              {t(field.labelKey)}
            </button>
          ))}
          {!showMoreOptional ? (
            <button
              type="button"
              onClick={() => setShowMoreOptional(true)}
              className="inline-flex items-center rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container"
            >
              {t('personalDetails.showMore')}
            </button>
          ) : null}
        </div>
      </div>

      <Button variant="primary" className="w-full gap-2 py-2.5 text-sm" onClick={onDone}>
        <Check className="h-4 w-4" />
        {t('personalDetails.done')}
      </Button>
    </div>
  );
}
