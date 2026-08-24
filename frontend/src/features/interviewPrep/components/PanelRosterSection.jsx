import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import SectionHeading from '../../../components/ui/SectionHeading';
import { CARD_CLASS } from './InterviewSetupAdvanced';
import { cn } from '../../../lib/utils';
import { seatDisplayName, seatInitial, seatTitle } from '../utils/panelSeatDisplay';

const PANEL_SEAT_COUNT = 3;

const SEAT_ACCENTS = [
  'from-secondary/15 to-secondary-container/10 text-secondary',
  'from-amber-100 to-amber-50 text-amber-700',
  'from-emerald-100 to-emerald-50 text-emerald-700',
];

/**
 * Role-matched panel seats. Always renders exactly three seats — placeholders
 * when empty, or the first three server seats when a role is matched.
 */
export default function PanelRosterSection({ seats = [], isLoading = false, roleLabel = '' }) {
  const { t } = useTranslation('interviewPrep');
  const list = (Array.isArray(seats) ? seats : []).slice(0, PANEL_SEAT_COUNT);
  const hasSeats = list.length > 0;
  const rows = hasSeats
    ? list
    : Array.from({ length: PANEL_SEAT_COUNT }, () => ({}));

  return (
    <section className={cn(CARD_CLASS, 'space-y-3')}>
      <SectionHeading
        color="interview"
        icon="groups"
        title={t('panelSetup.roster.title')}
        description={
          roleLabel
            ? t('panelSetup.roster.descriptionWithRole', { role: roleLabel })
            : t('panelSetup.roster.description')
        }
      />

      {isLoading && !hasSeats ? (
        <p className="font-body-md text-sm app-muted">{t('panelSetup.roster.loading')}</p>
      ) : null}

      <ol className="grid gap-3 sm:grid-cols-3">
        {rows.map((seat, index) => {
          const name = seatDisplayName(seat);
          const title = seatTitle(seat);
          const filled = Boolean(name || title);

          return (
            <li
              key={filled ? `${name || title}-${index}` : `empty-seat-${index}`}
              className={cn(
                'relative flex flex-col rounded-2xl border border-outline-variant/50 p-3',
                'bg-gradient-to-br',
                filled
                  ? SEAT_ACCENTS[index % SEAT_ACCENTS.length]
                  : 'from-surface-container-low to-surface-container-low'
              )}
            >
              <span className="absolute right-3 top-3 font-label-sm text-on-surface-variant/70">
                {index + 1}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-sm font-semibold shadow-sm">
                {filled ? seatInitial(seat) : <AppIcon name="person" size="sm" />}
              </span>
              <p className="mt-2 font-label-md text-on-surface">
                {name || t('panelSetup.roster.placeholderTitle')}
              </p>
              <p className="mt-0.5 font-label-sm text-on-surface-variant">
                {title || t('panelSetup.roster.placeholderFocus')}
              </p>
              {seat.focus && name ? (
                <p className="mt-1 font-body-md text-sm leading-snug text-on-surface-variant">
                  {t('panelRoom.lobby.seatPreview', { name, focus: seat.focus })}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="font-body-md text-sm app-muted">{t('panelSetup.roster.hint')}</p>
    </section>
  );
}
