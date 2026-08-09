import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

const FLOATING_LABELS = [
  { key: 'skills', icon: 'psychology_alt', className: 'top-[20%] end-[10%]' },
  { key: 'experience', icon: 'history', className: 'top-[40%] start-[5%]' },
  { key: 'education', icon: 'school', className: 'bottom-[30%] end-[5%]' },
];

const getStatusTitleKey = (status) => {
  switch (status) {
    case 'pending':
      return 'overlay.queued';
    case 'extracting':
      return 'overlay.extracting';
    case 'analyzing':
      return 'overlay.analyzing';
    case 'completed':
      return 'overlay.complete';
    case 'failed':
      return 'overlay.failed';
    default:
      return 'overlay.processing';
  }
};

export default function AnalyzeOverlay({
  open,
  progress = 0,
  status = 'pending',
  statusMessage = '',
  extractedSkills = [],
}) {
  const { t } = useTranslation('resumeScanner');
  const title = t(getStatusTitleKey(status));
  const showSuccessTags = status === 'completed' && extractedSkills.length > 0;

  const displayProgress = useMemo(() => {
    if (status === 'completed') return 100;
    if (status === 'failed') return progress || 0;
    return Math.max(0, Math.min(100, progress || 0));
  }, [progress, status]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md px-sm"
        >
          <div className="relative w-full max-w-2xl flex flex-col items-center">
            <div className="relative w-[320px] h-[440px] rounded-xl shadow-2xl mb-xl overflow-hidden flex flex-col p-md bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30">
              <div className="space-y-4 opacity-30">
                <div className="h-4 w-3/4 bg-on-surface-variant/20 rounded" />
                <div className="h-2 w-full bg-on-surface-variant/10 rounded" />
                <div className="h-2 w-full bg-on-surface-variant/10 rounded" />
                <div className="h-2 w-2/3 bg-on-surface-variant/10 rounded" />
                <div className="h-4 w-1/2 bg-on-surface-variant/20 rounded mt-md" />
                <div className="h-2 w-full bg-on-surface-variant/10 rounded" />
                <div className="h-2 w-5/6 bg-on-surface-variant/10 rounded" />
              </div>

              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_15px_#0058be]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {FLOATING_LABELS.map((label, index) => (
                <motion.div
                  key={label.key}
                  className={cn(
                    'absolute bg-surface-container-lowest px-4 py-2 rounded-full shadow-lg border border-outline-variant/30 text-label-md text-secondary flex items-center gap-2',
                    label.className
                  )}
                  animate={{ y: [0, -10, 0, 10, 0], x: [0, 5, 10, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
                >
                  <AppIcon name={label.icon} size="h-[18px] w-[18px]" />
                  {t(`overlay.labels.${label.key}`)}
                </motion.div>
              ))}
            </div>

            <div className="text-center w-full max-w-md">
              <p className="font-label-md text-label-md text-secondary mb-2 uppercase tracking-wide">
                {t('overlay.phaseLabel')}
              </p>
              <h2
                className={cn(
                  'font-headline-md text-headline-md text-primary mb-md',
                  status === 'completed' && 'text-secondary'
                )}
              >
                {title}
              </h2>
              {statusMessage ? (
                <p className="font-body-md text-on-surface-variant mb-sm">{statusMessage}</p>
              ) : null}
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-sm border border-outline-variant/20">
                <motion.div
                  className="h-full bg-secondary"
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {t('overlay.progressComplete', { progress: displayProgress })}
              </p>
            </div>

            {showSuccessTags ? (
              <div className="flex flex-wrap justify-center gap-sm mt-lg">
                {extractedSkills.slice(0, 6).map((skill, index) => (
                  <motion.span
                    key={skill.id || skill.name}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 18,
                      delay: index * 0.08,
                    }}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-full font-label-md shadow-md"
                  >
                    {skill.name}
                  </motion.span>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
