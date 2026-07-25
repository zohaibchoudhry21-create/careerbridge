import AppIcon from '../../../components/icons/AppIcon';
import {
  DEFAULT_INTERVIEW_SETUP_MODE,
  INTERVIEW_FOCUS_AREAS,
  INTERVIEW_SETUP_MODE_OPTIONS,
} from '../constants/interviewPrepConstants';
import { cn } from '../../../lib/utils';

export const CARD_CLASS =
  'rounded-2xl border border-[#E7EBF0] bg-white p-5 space-y-3.5 min-w-0 transition-all duration-150 hover:border-[#D4DAE2]';

/** Soft per-section icon tints (background + darker icon shade). */
export const ICON_TINTS = {
  role: 'bg-blue-50 text-blue-600',
  difficulty: 'bg-orange-50 text-orange-600',
  time: 'bg-teal-50 text-teal-600',
  focus: 'bg-pink-50 text-pink-600',
  mode: 'bg-emerald-50 text-emerald-600',
};

/** Shared selected / unselected styling for option chips and buttons. */
export const SELECTED_OPTION_CLASS =
  'border-secondary bg-secondary/[0.06] text-secondary';
export const UNSELECTED_OPTION_CLASS =
  'border-[#E2E7EE] bg-white text-on-surface-variant hover:border-[#C3CBD6] hover:bg-[#FAFBFC]';

const MODE_ICONS = {
  video_voice: 'videocam',
  voice_only: 'mic',
  text_only: 'edit_note',
};

export function SectionHeader({ icon, iconClassName, title, description, optional = false }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              iconClassName
            )}
          >
            <AppIcon name={icon} size="sm" />
          </span>
          <h2 className="font-headline-section text-headline-section text-on-surface">{title}</h2>
        </div>
        {optional ? (
          <span className="shrink-0 rounded-full bg-[#F1F3F7] px-2.5 py-1 font-label-sm text-on-surface-variant">
            Optional
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="font-body-md text-on-surface-variant text-sm pl-[42px]">{description}</p>
      ) : null}
    </div>
  );
}

export function FocusAreasSection({ focusAreas, onFocusAreasChange }) {
  const toggleFocusArea = (area) => {
    if (focusAreas.includes(area)) {
      onFocusAreasChange(focusAreas.filter((item) => item !== area));
      return;
    }
    onFocusAreasChange([...focusAreas, area]);
  };

  return (
    <section className={CARD_CLASS}>
      <SectionHeader
        icon="target"
        iconClassName={ICON_TINTS.focus}
        title="Focus areas"
        description="Pick what the interview should emphasize."
      />
      <div className="flex flex-wrap gap-2">
        {INTERVIEW_FOCUS_AREAS.map((area) => {
          const selected = focusAreas.includes(area);
          return (
            <button
              key={area}
              type="button"
              onClick={() => toggleFocusArea(area)}
              className={cn(
                'rounded-full border-2 px-4 py-2 font-label-sm transition-all duration-150',
                selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
              )}
            >
              {area}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function InterviewModeSection({ interviewMode, onInterviewModeChange }) {
  return (
    <section className={CARD_CLASS}>
      <SectionHeader
        icon="mic"
        iconClassName={ICON_TINTS.mode}
        title="Interview mode"
        description="Choose how you want to respond."
      />
      <div className="grid gap-2.5 sm:grid-cols-3">
        {INTERVIEW_SETUP_MODE_OPTIONS.map((option) => {
          const selected = (interviewMode || DEFAULT_INTERVIEW_SETUP_MODE) === option.value;
          const disabled = Boolean(option.disabled);

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onInterviewModeChange(option.value)}
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 flex items-center gap-2.5',
                disabled && 'opacity-50 cursor-not-allowed',
                selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
              )}
            >
              <AppIcon
                name={MODE_ICONS[option.value] || 'mic'}
                size="sm"
                className={cn('shrink-0', selected ? 'text-secondary' : 'text-on-surface-variant')}
              />
              <span
                className={cn(
                  'font-label-md',
                  selected ? 'text-secondary' : 'text-on-surface'
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
