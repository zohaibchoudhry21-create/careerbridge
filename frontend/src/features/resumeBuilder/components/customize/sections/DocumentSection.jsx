import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import CustomizeSectionCard from '../CustomizeSectionCard';
import {
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  PAGE_FORMAT_OPTIONS,
} from '../constants';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

const selectClassName =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-on-surface outline-none focus:border-secondary font-body-sm';

export default function DocumentSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();
  const { register, watch, reset } = useForm({
    defaultValues: {
      language: customize.language,
      dateFormat: customize.dateFormat,
      pageFormat: customize.pageFormat,
    },
  });

  useEffect(() => {
    reset({
      language: customize.language,
      dateFormat: customize.dateFormat,
      pageFormat: customize.pageFormat,
    });
  }, [customize.language, customize.dateFormat, customize.pageFormat, reset]);

  const language = watch('language');
  const dateFormat = watch('dateFormat');
  const pageFormat = watch('pageFormat');

  useEffect(() => {
    if (language !== customize.language) updateCustomize('language', language);
  }, [language, customize.language, updateCustomize]);

  useEffect(() => {
    if (dateFormat !== customize.dateFormat) updateCustomize('dateFormat', dateFormat);
  }, [dateFormat, customize.dateFormat, updateCustomize]);

  useEffect(() => {
    if (pageFormat !== customize.pageFormat) updateCustomize('pageFormat', pageFormat);
  }, [pageFormat, customize.pageFormat, updateCustomize]);

  return (
    <CustomizeSectionCard
      title={t('customize.document.title')}
      description={t('customize.document.description')}
    >
      <div className="space-y-md">
        <label className="block space-y-1">
          <span className="text-on-surface-variant text-sm">{t('customize.document.language')}</span>
          <select className={selectClassName} {...register('language')}>
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-on-surface-variant text-sm">{t('customize.document.dateFormat')}</span>
          <select className={selectClassName} {...register('dateFormat')}>
            {DATE_FORMAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-on-surface-variant text-sm">{t('customize.document.pageFormat')}</span>
          <select className={selectClassName} {...register('pageFormat')}>
            {PAGE_FORMAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </CustomizeSectionCard>
  );
}
