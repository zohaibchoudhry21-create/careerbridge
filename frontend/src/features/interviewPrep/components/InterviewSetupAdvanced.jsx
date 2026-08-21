import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_INTERVIEW_SETUP_MODE,
  FOCUS_AREA_I18N_KEYS,
  INTERVIEW_FOCUS_AREAS,
  INTERVIEW_SETUP_MODE_OPTIONS,
  MAX_MOCK_INTERVIEW_DURATION_MINUTES,
  MIN_MOCK_INTERVIEW_DURATION_MINUTES,
  MOCK_INTERVIEW_DURATION_OPTIONS,
  clampDurationMinutes,
  durationMinutesToQuestionCount,
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
};

const MODE_LABEL_KEYS = {
  video_voice: 'mockSetup.mode.videoVoice',
  voice_only: 'mockSetup.mode.voiceOnly',
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

export function DurationSection({ durationMinutes, onDurationMinutesChange }) {
  const { t } = useTranslation('interviewPrep');
  const customInputRef = useRef(null);
  const minutes = clampDurationMinutes(durationMinutes);
  const questionCount = durationMinutesToQuestionCount(minutes);
  const isCustom = !MOCK_INTERVIEW_DURATION_OPTIONS.includes(minutes);
  const [draft, setDraft] = useState(isCustom ? String(minutes) : '');

  const selectPreset = (preset) => {
    onDurationMinutesChange(preset);
    setDraft('');
  };

  const applyDraft = (raw) => {
    setDraft(raw);
    const parsed = Number.parseInt(String(raw).trim(), 10);
    if (
      Number.isInteger(parsed) &&
      parsed >= MIN_MOCK_INTERVIEW_DURATION_MINUTES &&
      parsed <= MAX_MOCK_INTERVIEW_DURATION_MINUTES
    ) {
      onDurationMinutesChange(parsed);
    }
  };

  const commitDraft = () => {
    const parsed = Number.parseInt(String(draft).trim(), 10);
    if (!Number.isFinite(parsed)) {
      setDraft(isCustom ? String(minutes) : '');
      return;
    }
    const clamped = clampDurationMinutes(parsed);
    onDurationMinutesChange(clamped);
    setDraft(MOCK_INTERVIEW_DURATION_OPTIONS.includes(clamped) ? '' : String(clamped));
  };

  return (
    <section className={cn(accentCardClass, 'h-full')}>
      <SectionHeading
        color="time"
        icon="hourglass_top"
        title={t('mockSetup.time.title')}
        description={t('mockSetup.time.description', {
          min: MIN_MOCK_INTERVIEW_DURATION_MINUTES,
          max: MAX_MOCK_INTERVIEW_DURATION_MINUTES,
        })}
      />

      <div className="space-y-2">
        {MOCK_INTERVIEW_DURATION_OPTIONS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => selectPreset(preset)}
            className={cn(
              'w-full rounded-xl border-2 px-4 py-2.5 text-left font-label-md transition-all duration-150',
              !isCustom && minutes === preset ? selectedOptionClass : unselectedOptionClass
            )}
          >
            {t('mockSetup.time.minutes', { count: preset })}
          </button>
        ))}

        <div
          className={cn(
            'flex items-center gap-2 rounded-xl border-2 px-4 py-2 transition-all duration-150',
            isCustom ? selectedOptionClass : unselectedOptionClass
          )}
        >
          <button
            type="button"
            className={cn(
              'shrink-0 font-label-md',
              isCustom ? 'text-secondary' : 'text-on-surface-variant'
            )}
            onClick={() => customInputRef.current?.focus()}
          >
            {t('mockSetup.time.custom')}
          </button>
          <input
            ref={customInputRef}
            type="number"
            inputMode="numeric"
            min={MIN_MOCK_INTERVIEW_DURATION_MINUTES}
            max={MAX_MOCK_INTERVIEW_DURATION_MINUTES}
            value={draft}
            placeholder={t('mockSetup.time.placeholder')}
            aria-label={t('mockSetup.time.customAria')}
            onChange={(event) => applyDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            className={cn(
              'min-w-0 flex-1 rounded-lg border border-[#E2E7EE] bg-white px-3 py-1',
              'font-label-md tabular-nums text-on-surface outline-none',
              'placeholder:text-on-surface-variant/50',
              'focus:border-secondary focus:ring-2 focus:ring-secondary/15',
              '[appearance:textfield]',
              '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            )}
          />
          <span className="shrink-0 font-label-sm text-on-surface-variant">
            {t('mockSetup.time.minutesUnit')}
          </span>
        </div>
        <p className="font-body-md text-sm app-muted">
          {t('mockSetup.time.questionPreview', { count: questionCount })}
        </p>
      </div>
    </section>
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
      <div className="grid gap-2.5 sm:grid-cols-2">
        {INTERVIEW_SETUP_MODE_OPTIONS.map((option) => {
          const selected = (interviewMode || DEFAULT_INTERVIEW_SETUP_MODE) === option.value;
          const labelKey = MODE_LABEL_KEYS[option.value];

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onInterviewModeChange(option.value)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150',
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
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
