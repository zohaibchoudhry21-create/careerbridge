import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import AppIcon from '../../../../components/icons/AppIcon';

/**
 * Brief beat after leaving the conference room before report submit UI.
 */
export default function PanelLeaveInterstitial() {
  const { t } = useTranslation('interviewPrep');

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10"
      >
        <AppIcon name="groups" size="button" className="text-secondary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
      >
        <h2 className="font-headline-section text-xl font-semibold text-on-surface">
          {t('panelRoom.leave.title')}
        </h2>
        <p className="mt-1.5 max-w-sm font-body-md text-sm text-on-surface-variant">
          {t('panelRoom.leave.description')}
        </p>
      </motion.div>
    </div>
  );
}
