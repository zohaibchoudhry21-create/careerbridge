import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import SectionHeading from '../../../components/ui/SectionHeading';
import Button from '../../../components/ui/Button';
import AppIcon from '../../../components/icons/AppIcon';
import { MOCK_INTERVIEW_DIFFICULTIES } from '../constants/interviewPrepConstants';
import { useGenerateSkillQuiz } from '../hooks/useSkillAssessment';
import RoleAutocompleteInput from './RoleAutocompleteInput';
import RetryErrorPanel from './RetryErrorPanel';
import {
  CARD_CLASS,
  SELECTED_OPTION_CLASS,
  UNSELECTED_OPTION_CLASS,
} from './InterviewSetupAdvanced';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { cn } from '../../../lib/utils';

const LENGTH_OPTIONS = ['10', '12', '15'];

function OptionButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border-2 px-4 py-2.5 text-left font-label-md transition-all duration-150',
        selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
      )}
    >
      {children}
    </button>
  );
}

function QuizSummaryCard({
  topicTrimmed,
  difficulty,
  length,
  canStart,
  isGenerating,
  showTopicHint,
  onStart,
}) {
  const { t } = useTranslation('interviewPrep');

  return (
    <aside
      className={cn(
        'app-surface-card dashboard-card-hover flex h-fit w-full flex-col gap-2 p-3',
        'transition-all duration-200 hover:border-secondary/30'
      )}
    >
      <div>
        <p className="font-label-sm text-secondary leading-tight">
          {t('skillSetup.summary.eyebrow')}
        </p>
        <h2 className="mt-0.5 font-headline-section text-base font-semibold leading-tight app-heading">
          {t('skillSetup.summary.title')}
        </h2>
      </div>

      <dl className="space-y-1.5 rounded-xl bg-surface-container-low/80 p-2.5">
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">{t('skillSetup.summary.topic')}</dt>
          <dd className="max-w-[60%] text-end font-label-md text-on-surface truncate leading-snug">
            {topicTrimmed || t('skillSetup.summary.topicMissing')}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">
            {t('skillSetup.summary.difficulty')}
          </dt>
          <dd className="font-label-md text-on-surface leading-snug">
            {t(`difficulty.${difficulty}`)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-2">
          <dt className="font-label-sm app-muted leading-snug">
            {t('skillSetup.summary.questions')}
          </dt>
          <dd className="font-label-md text-on-surface leading-snug">
            {t('skillSetup.length.questions', { count: Number(length) })}
          </dd>
        </div>
      </dl>

      {showTopicHint ? (
        <p className="font-label-sm text-error">{t('skillSetup.selectTopic')}</p>
      ) : null}

      <Button
        type="button"
        variant="gradient"
        onClick={onStart}
        disabled={!canStart}
        className="w-full gap-1.5 !rounded-xl !py-2"
      >
        {isGenerating ? (
          <>
            <AppIcon name="progress_activity" size="sm" spin className="text-white" />
            {t('skillSetup.generating')}
          </>
        ) : (
          <>
            <AppIcon name="school" size="sm" className="text-white" />
            {t('skillSetup.generateStart')}
          </>
        )}
      </Button>
    </aside>
  );
}

export default function SkillAssessmentSetup() {
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();
  const generateQuiz = useGenerateSkillQuiz();
  const [generateError, setGenerateError] = useState(null);

  const [topic, setTopic] = useState('');
  const [topicTouched, setTopicTouched] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [length, setLength] = useState('12');

  const topicTrimmed = topic.trim();
  const showTopicError = topicTouched && !topicTrimmed;
  const canStart = Boolean(topicTrimmed) && !generateQuiz.isPending;

  const handleStart = async () => {
    setTopicTouched(true);
    const trimmedTopic = topic.trim();

    if (!trimmedTopic) {
      toast.error(t('skillSetup.selectTopic'));
      return;
    }

    const payload = {
      topic: trimmedTopic,
      difficulty,
      length: Number(length),
    };

    try {
      setGenerateError(null);
      const result = await generateQuiz.mutateAsync(payload);

      const quizId = result.quiz?.quizId;

      if (!quizId) {
        toast.error(t('skillSetup.startFailed'));
        return;
      }

      navigate(`/interview-prep/skills/${quizId}`);
    } catch (err) {
      setGenerateError(getApiErrorMessage(err, t('skillSetup.generateFailed')));
    }
  };

  const summaryProps = {
    topicTrimmed,
    difficulty,
    length,
    canStart,
    isGenerating: generateQuiz.isPending,
    showTopicHint: showTopicError,
    onStart: handleStart,
  };

  return (
    <div className="min-w-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(220px,25%)] lg:items-start lg:gap-5">
      <div className="min-w-0 space-y-4 pb-28 lg:pb-0">
        <RetryErrorPanel
          message={generateError}
          onRetry={handleStart}
          retryLabel={t('skillSetup.retryGenerate')}
        />

        <section className={cn(CARD_CLASS, 'relative overflow-visible')}>
          <SectionHeading
            color="skills"
            icon="school"
            title={t('skillSetup.topic.title')}
            description={t('skillSetup.topic.description')}
          />
          <label htmlFor="skill-topic-input" className="sr-only">
            {t('skillSetup.topic.title')}
          </label>
          <RoleAutocompleteInput
            inputId="skill-topic-input"
            value={topic}
            onChange={setTopic}
            onBlur={() => setTopicTouched(true)}
            hasError={showTopicError}
            placeholder={t('skillSetup.topic.placeholder')}
          />
          {showTopicError ? (
            <p className="mt-1 font-label-sm text-error">{t('skillSetup.selectTopic')}</p>
          ) : null}
        </section>

        <div className="grid items-stretch gap-4 sm:grid-cols-2">
          <section className={cn(CARD_CLASS, 'flex h-full flex-col')}>
            <SectionHeading
              color="difficulty"
              icon="tune"
              title={t('skillSetup.difficulty.title')}
              description={t('skillSetup.difficulty.description')}
            />
            <div className="mt-auto space-y-2">
              {MOCK_INTERVIEW_DIFFICULTIES.map((value) => (
                <OptionButton
                  key={value}
                  selected={difficulty === value}
                  onClick={() => setDifficulty(value)}
                >
                  <span className="block">{t(`difficulty.${value}`)}</span>
                  <span className="mt-0.5 block font-body-md text-sm app-muted">
                    {t(`skillSetup.difficulty.${value}`)}
                  </span>
                </OptionButton>
              ))}
            </div>
          </section>

          <section className={cn(CARD_CLASS, 'flex h-full flex-col')}>
            <SectionHeading
              color="time"
              icon="hourglass_top"
              title={t('skillSetup.length.title')}
              description={t('skillSetup.length.description')}
            />
            <div className="mt-auto space-y-2">
              {LENGTH_OPTIONS.map((value) => (
                <OptionButton
                  key={value}
                  selected={length === value}
                  onClick={() => setLength(value)}
                >
                  <span className="block">
                    {t('skillSetup.length.questions', { count: Number(value) })}
                  </span>
                  <span className="mt-0.5 block font-body-md text-sm app-muted">
                    {t(`skillSetup.length.hint.${value}`)}
                  </span>
                </OptionButton>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="hidden w-full lg:block lg:h-fit lg:self-start">
        <QuizSummaryCard {...summaryProps} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/60 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-label-md text-on-surface">
              {topicTrimmed || t('skillSetup.summary.topicMissing')}
            </p>
            <p className="truncate font-body-md text-sm app-muted">
              {[
                t(`difficulty.${difficulty}`),
                t('skillSetup.length.questions', { count: Number(length) }),
              ].join(' · ')}
            </p>
          </div>
          <Button
            type="button"
            variant="gradient"
            onClick={handleStart}
            disabled={!canStart}
            className="shrink-0 px-4 py-2.5"
          >
            {generateQuiz.isPending ? (
              <AppIcon name="progress_activity" size="sm" spin className="text-white" />
            ) : (
              t('skillSetup.generateStartShort')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
