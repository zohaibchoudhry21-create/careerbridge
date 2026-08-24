import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../lib/utils';
import {
  formatSeatLabel,
  seatDisplayName,
  seatInitial,
  seatTitle,
} from '../../utils/panelSeatDisplay';

/** Soft brand-aligned seat accents (no purple/glow kitsch). */
const SEAT_AVATAR = [
  'bg-secondary text-on-secondary',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
];

/**
 * Three interviewer tiles for the conference grid (top row).
 */
export default function PanelBoardroomStage({
  panelSeats = [],
  activeSeatIndex = 0,
  nextSeatIndex = null,
  aiSpeaking = false,
  showNextHint = false,
  className,
}) {
  const { t } = useTranslation('interviewPrep');
  const seats = Array.isArray(panelSeats) ? panelSeats : [];

  return (
    <div dir="ltr" className={cn('grid grid-cols-3 gap-3 sm:gap-4', className)}>
      {seats.map((seat, index) => {
        const active = index === activeSeatIndex;
        const speakingHere = active && aiSpeaking;
        const upNext = showNextHint && !aiSpeaking && nextSeatIndex === index;
        return (
          <motion.div
            key={formatSeatLabel(seat) || index}
            animate={{ scale: speakingHere ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={cn(
              'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border p-3 sm:p-4',
              'bg-white transition-all duration-300',
              speakingHere
                ? 'border-secondary shadow-[0_0_0_3px_rgba(0,88,190,0.14)] ring-1 ring-secondary/25'
                : upNext
                  ? 'border-secondary/40 ring-1 ring-secondary/15'
                  : 'border-outline-variant/50'
            )}
          >
            <div
              className={cn(
                'relative mb-2 flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold shadow-inner sm:h-16 sm:w-16',
                SEAT_AVATAR[index % SEAT_AVATAR.length]
              )}
            >
              {speakingHere ? (
                <span
                  className="absolute inset-0 animate-ping rounded-full bg-secondary/25"
                  aria-hidden
                />
              ) : null}
              <span className="relative">{seatInitial(seat)}</span>
            </div>
            <h3 className="line-clamp-1 font-label-md font-semibold text-on-surface">
              {seatDisplayName(seat)}
            </h3>
            <p className="line-clamp-2 text-center font-label-sm text-on-surface-variant">
              {seatTitle(seat)}
            </p>

            {speakingHere ? (
              <div className="absolute bottom-2.5 inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 font-label-sm text-secondary">
                <span className="h-3 w-1 animate-bounce rounded-full bg-secondary" />
                <span
                  className="h-4 w-1 animate-bounce rounded-full bg-secondary"
                  style={{ animationDelay: '100ms' }}
                />
                <span
                  className="h-2 w-1 animate-bounce rounded-full bg-secondary"
                  style={{ animationDelay: '200ms' }}
                />
                <span className="ml-0.5 font-medium">{t('panelRoom.live.speaking')}</span>
              </div>
            ) : (
              <p className="absolute bottom-2.5 font-label-sm text-on-surface-variant/70">
                {t('panelRoom.live.listening')}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
