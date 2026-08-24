import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../../../lib/utils';
import {
  formatSeatLabel,
  seatDisplayName,
  seatInitial,
  seatTitle,
} from '../../utils/panelSeatDisplay';
import { playRoomEnterChime, prefersReducedMotion } from '../../utils/panelRoomSound';

const STATUS_KEYS = ['openingDoor', 'seatingPanel', 'youreIn'];

/**
 * Overlay while Vapi connects — seats appear one-by-one.
 */
export default function PanelEnterTransition({
  panelSeats = [],
  roomSoundEnabled = false,
  visible = true,
}) {
  const { t } = useTranslation('interviewPrep');
  const seats = Array.isArray(panelSeats) && panelSeats.length ? panelSeats : [{}, {}, {}];
  const reduced = prefersReducedMotion();
  const [statusIndex, setStatusIndex] = useState(0);
  const [revealed, setRevealed] = useState(() => (reduced ? seats.map(() => true) : seats.map(() => false)));

  useEffect(() => {
    if (!visible) return undefined;

    if (roomSoundEnabled && !reduced) {
      playRoomEnterChime();
    }

    if (reduced) {
      setRevealed(seats.map(() => true));
      setStatusIndex(STATUS_KEYS.length - 1);
      return undefined;
    }

    setRevealed(seats.map(() => false));
    setStatusIndex(0);

    const revealTimers = seats.map((_, index) =>
      setTimeout(() => {
        setRevealed((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, 350 + index * 450)
    );

    const statusTimers = [
      setTimeout(() => setStatusIndex(1), 700),
      setTimeout(() => setStatusIndex(2), 1600),
    ];

    return () => {
      revealTimers.forEach(clearTimeout);
      statusTimers.forEach(clearTimeout);
    };
  }, [visible, roomSoundEnabled, seats.length, reduced]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/90 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl space-y-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={STATUS_KEYS[statusIndex]}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -6 }}
            className="font-label-md font-semibold text-white"
          >
            {t(`panelRoom.enter.${STATUS_KEYS[statusIndex]}`)}
          </motion.p>
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-3">
          {seats.map((seat, index) => (
            <motion.div
              key={formatSeatLabel(seat) || index}
              initial={reduced ? false : { opacity: 0, scale: 0.88 }}
              animate={
                revealed[index]
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0.15, scale: 0.92 }
              }
              transition={{ duration: 0.35 }}
              className={cn(
                'flex flex-col items-center rounded-2xl border border-white/15 bg-white/10 px-2 py-4 text-white'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-base font-semibold text-on-secondary sm:h-14 sm:w-14">
                {seatInitial(seat)}
              </div>
              <p className="mt-2 line-clamp-1 font-label-md font-semibold">
                {seatDisplayName(seat) || '…'}
              </p>
              <p className="line-clamp-2 font-label-sm text-white/70">{seatTitle(seat)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
