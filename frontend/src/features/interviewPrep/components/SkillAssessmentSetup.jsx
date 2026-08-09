import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import RadioGroup from '../../../components/settings/RadioGroup';
import SectionHeading from '../../../components/ui/SectionHeading';
import Button from '../../../components/ui/Button';
import AppIcon from '../../../components/icons/AppIcon';
import { accentCardClass } from '../../../components/ui/colorAccentTokens';
import { MOCK_INTERVIEW_DIFFICULTIES } from '../constants/interviewPrepConstants';
import { useGenerateSkillQuiz } from '../hooks/useSkillAssessment';
import RetryErrorPanel from './RetryErrorPanel';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

const LENGTH_OPTIONS = ['10', '12', '15'];

export default function SkillAssessmentSetup() {
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();
  const generateQuiz = useGenerateSkillQuiz();
  const [generateError, setGenerateError] = useState(null);

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [length, setLength] = useState('12');

  const difficultyOptions = MOCK_INTERVIEW_DIFFICULTIES.map((value) => ({
    value,
    label: t(`difficulty.${value}`),
  }));

  const lengthOptions = LENGTH_OPTIONS.map((value) => ({
    value,
    label: t('skillSetup.length.questions', { count: Number(value) }),
  }));

  const handleStart = async () => {
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

  return (
    <div className="min-w-0 space-y-md">
      <header className="min-w-0">
        <h1 className="font-headline-dashboard text-headline-dashboard app-heading">
          {t('skillSetup.title')}
        </h1>
        <p className="mt-base font-body-md app-muted">{t('skillSetup.description')}</p>
      </header>

      <RetryErrorPanel
        message={generateError}
        onRetry={handleStart}
        retryLabel={t('skillSetup.retryGenerate')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <section className={`${accentCardClass} hover:shadow-sm`}>
          <SectionHeading
            color="skills"
            icon="school"
            title={t('skillSetup.topic.title')}
            description={t('skillSetup.topic.description')}
          />
          <label htmlFor="skill-topic" className="sr-only">
            {t('skillSetup.topic.title')}
          </label>
          <input
            id="skill-topic"
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={t('skillSetup.topic.placeholder')}
            autoComplete="off"
            className="w-full rounded-xl border border-[#E2E7EE] bg-white px-4 py-3 text-sm text-on-surface transition-colors duration-150 placeholder:text-on-surface-variant/70 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </section>

        <section className={`${accentCardClass} hover:shadow-sm`}>
          <SectionHeading
            color="difficulty"
            icon="tune"
            title={t('skillSetup.difficulty.title')}
            description={t('skillSetup.difficulty.description')}
          />
          <RadioGroup
            name="skill-difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={difficultyOptions}
          />
        </section>

        <section className={`${accentCardClass} hover:shadow-sm md:col-span-2 lg:col-span-1`}>
          <SectionHeading
            color="time"
            icon="hourglass_top"
            title={t('skillSetup.length.title')}
            description={t('skillSetup.length.description')}
          />
          <RadioGroup
            name="skill-length"
            value={length}
            onChange={setLength}
            options={lengthOptions}
          />
        </section>
      </div>

      <Button
        type="button"
        variant="primary"
        onClick={handleStart}
        disabled={generateQuiz.isPending}
        className="min-h-[44px] w-full gap-2 px-6 py-3 sm:w-auto"
      >
        {generateQuiz.isPending ? (
          <>
            <AppIcon name="progress_activity" size="sm" spin />
            {t('skillSetup.generating')}
          </>
        ) : (
          t('skillSetup.generateStart')
        )}
      </Button>
    </div>
  );
}
