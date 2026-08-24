import { useTranslation } from 'react-i18next';

export default function LiveVideoIndicator({
  metrics,
  isRecording,
  modelsReady,
  compact = false,
  hasSample = false,
}) {
  const { t } = useTranslation('interviewPrep');

  if (!isRecording) return null;

  if (!modelsReady || !hasSample) {
    return <p className="font-label-sm text-white/90 drop-shadow-sm">{t('live.analyzingCamera')}</p>;
  }

  const eye = metrics?.eyeContactPercent ?? 0;
  const attentive = eye >= 55;
  const label = attentive ? t('live.eyeContactGood') : t('live.eyeContactLow');

  return (
    <p
      className={`font-label-sm text-white/95 drop-shadow-sm flex items-center gap-2 ${
        compact ? 'text-xs' : ''
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${attentive ? 'bg-secondary' : 'bg-white/50'}`}
        aria-hidden
      />
      {label}
    </p>
  );
}
