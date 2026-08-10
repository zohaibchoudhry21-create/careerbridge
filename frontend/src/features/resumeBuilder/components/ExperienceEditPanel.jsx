import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Check, Eye, Lightbulb, Link2, Loader2, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { resolveApiError } from '../../../utils/apiError';
import RichTextAiField from './RichTextAiField';
import { ResumeTextInput } from './ResumeFormFields';

const EMPTY_EXP = {
  position: '',
  company: '',
  companyLink: '',
  location: '',
  startDate: '',
  endDate: '',
  description: '',
  isCurrent: false,
};

export default function ExperienceEditPanel({
  entry = EMPTY_EXP,
  index = 0,
  onChange,
  onRemove,
  onDone,
  onPreview,
  onAiAction,
}) {
  const { t } = useTranslation('resumeBuilder');
  const [tips, setTips] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [tipsBusy, setTipsBusy] = useState(false);
  const [showEmployerLink, setShowEmployerLink] = useState(Boolean(entry.companyLink));

  const patch = (field, value) => {
    onChange?.({ ...entry, [field]: value });
  };

  const handleDelete = () => {
    if (!window.confirm(t('editEntry.deleteExperienceConfirm'))) return;
    onRemove?.();
  };

  const handleGetTips = async () => {
    if (!onAiAction) return;
    setTipsBusy(true);
    try {
      const result = await onAiAction('tips', entry.description || '', {
        jobTitle: entry.position,
        employer: entry.company,
        location: entry.location,
      });
      setTips(result?.text || '');
      setShowTips(true);
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.aiUnavailable')));
    } finally {
      setTipsBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-sm font-semibold text-on-surface">
          {t('editEntry.title')}
          <span className="ml-2 text-xs font-normal text-on-surface-variant">
            ({t('editEntry.experienceIndex', { index: index + 1 })})
          </span>
        </h3>
        <div className="flex items-center gap-1.5">
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
            {t('editEntry.getTips')}
          </button>
          <button
            type="button"
            onClick={onPreview}
            title={t('editEntry.preview')}
            aria-label={t('editEntry.preview')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-secondary"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            title={t('editEntry.deleteExperience')}
            aria-label={t('editEntry.deleteExperience')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ResumeTextInput
        label={t('editEntry.fields.jobTitle')}
        value={entry.position || ''}
        placeholder={t('editEntry.placeholders.jobTitle')}
        onChange={(e) => patch('position', e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-on-surface mb-1">
          {t('editEntry.fields.employer')}
        </label>
        <div className="relative">
          <input
            type="text"
            value={entry.company || ''}
            placeholder={t('editEntry.placeholders.employer')}
            onChange={(e) => patch('company', e.target.value)}
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 pr-20 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
          <button
            type="button"
            onClick={() => setShowEmployerLink((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-secondary hover:bg-secondary/10"
          >
            <Link2 className="h-3.5 w-3.5" />
            {t('editEntry.link')}
          </button>
        </div>
        {showEmployerLink ? (
          <input
            type="url"
            value={entry.companyLink || ''}
            placeholder={t('editEntry.placeholders.employerLink')}
            onChange={(e) => patch('companyLink', e.target.value)}
            className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <ResumeTextInput
          label={t('editEntry.fields.startDate')}
          value={entry.startDate || ''}
          placeholder={t('editEntry.placeholders.date')}
          onChange={(e) => patch('startDate', e.target.value)}
        />
        <ResumeTextInput
          label={t('editEntry.fields.endDate')}
          value={entry.endDate || ''}
          placeholder={t('editEntry.placeholders.date')}
          onChange={(e) => patch('endDate', e.target.value)}
        />
        <ResumeTextInput
          label={t('editEntry.fields.location')}
          value={entry.location || ''}
          placeholder={t('editEntry.placeholders.location')}
          onChange={(e) => patch('location', e.target.value)}
        />
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

      <RichTextAiField
        label={t('editEntry.fields.description')}
        placeholder={t('editEntry.placeholders.experienceDescription')}
        value={entry.description || ''}
        showSuggestPill
        aiContext={{
          jobTitle: entry.position,
          employer: entry.company,
          location: entry.location,
        }}
        onChange={(html) => patch('description', html)}
        onAiAction={onAiAction}
      />

      <Button variant="primary" className="w-full gap-2 py-2.5 text-sm" onClick={onDone}>
        <Check className="h-4 w-4" />
        {t('editEntry.done')}
      </Button>
    </div>
  );
}
