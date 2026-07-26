import { useTranslation } from 'react-i18next';
import {
  DEFAULT_INTERVIEW_SETUP_MODE,
  FOCUS_AREA_I18N_KEYS,
  INTERVIEW_FOCUS_AREAS,
  INTERVIEW_SETUP_MODE_OPTIONS,
} from '../constants/interviewPrepConstants';
import AppIcon from '../../../components/icons/AppIcon';
import SectionHeading from '../../../components/ui/SectionHeading';
import {
  accentCardClass,
  selectedOptionClass,
  unselectedOptionClass,
} from '../../../components/ui/colorAccentTokens';
import { cn } from '../../../lib/utils';

export { accentCardClass as CARD_CLASS };
export {
  selectedOptionClass as SELECTED_OPTION_CLASS,
  unselectedOptionClass as UNSELECTED_OPTION_CLASS,
};

const MODE_ICONS = {
  video_voice: 'videocam',
  voice_only: 'mic',
  text_only: 'edit_note',
};

const MODE_LABEL_KEYS = {
  video_voice: 'mockSetup.mode.videoVoice',
  voice_only: 'mockSetup.mode.voiceOnly',
  text_only: 'mockSetup.mode.textOnly',
};

/** @deprecated Use SectionHeading from components/ui instead. */
export function SectionHeader({ icon, iconClassName, title, description, optional = false }) {
  const colorFromTint = iconClassName?.includes('orange')
    ? 'difficulty'
    : iconClassName?.includes('teal')
      ? 'time'
      : iconClassName?.includes('pink')
        ? 'focus'
        : iconClassName?.includes('emerald')
          ? 'mode'
          : 'role';

  return (
    <SectionHeading
      color={colorFromTint}
      icon={icon}
      title={title}
      description={description}
      optional={optional}
    />
  );
}

export function FocusAreasSection({ focusAreas, onFocusAreasChange }) {
  const { t } = useTranslation('interviewPrep');

  const toggleFocusArea = (area) => {
    if (focusAreas.includes(area)) {
      onFocusAreasChange(focusAreas.filter((item) => item !== area));
      return;
    }
    onFocusAreasChange([...focusAreas, area]);
  };

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="focus"
        icon="target"
        title={t('mockSetup.focusAreas.title')}
        description={t('mockSetup.focusAreas.description')}
      />
      <div className="flex flex-wrap gap-2">
        {INTERVIEW_FOCUS_AREAS.map((area) => {
          const selected = focusAreas.includes(area);
          const i18nKey = FOCUS_AREA_I18N_KEYS[area];
          return (
            <button
              key={area}
              type="button"
              onClick={() => toggleFocusArea(area)}
              className={cn(
                'rounded-full border-2 px-4 py-2 font-label-sm transition-all duration-150',
                selected ? selectedOptionClass : unselectedOptionClass
              )}
            >
              {i18nKey ? t(`focusAreas.${i18nKey}`) : area}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function InterviewModeSection({ interviewMode, onInterviewModeChange }) {
  const { t } = useTranslation('interviewPrep');

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="mode"
        icon="mic"
        title={t('mockSetup.mode.title')}
        description={t('mockSetup.mode.description')}
      />
      <div className="grid gap-2.5 sm:grid-cols-3">
        {INTERVIEW_SETUP_MODE_OPTIONS.map((option) => {
          const selected = (interviewMode || DEFAULT_INTERVIEW_SETUP_MODE) === option.value;
          const disabled = Boolean(option.disabled);
          const labelKey = MODE_LABEL_KEYS[option.value];

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onInterviewModeChange(option.value)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150',
                disabled && 'cursor-not-allowed opacity-50',
                selected ? selectedOptionClass : unselectedOptionClass
              )}
            >
              <AppIcon
                name={MODE_ICONS[option.value] || 'mic'}
                size="sm"
                className={cn('shrink-0', selected ? 'text-secondary' : 'text-on-surface-variant')}
              />
              <span
                className={cn('font-label-md', selected ? 'text-secondary' : 'text-on-surface')}
              >
                {labelKey ? t(labelKey) : option.label}
                {disabled && option.hint ? ` (${t('mockSetup.mode.comingSoon')})` : ''}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
