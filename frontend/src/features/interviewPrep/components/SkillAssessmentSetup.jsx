import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import RadioGroup from '../../../components/settings/RadioGroup';
import SectionHeading from '../../../components/ui/SectionHeading';
import Button from '../../../components/ui/Button';
import { accentCardClass } from '../../../components/ui/colorAccentTokens';
import {
  DEFAULT_SKILL_QUIZ_QUESTION_COUNT,
  MOCK_INTERVIEW_DIFFICULTIES,
} from '../constants/interviewPrepConstants';
import { useGenerateSkillQuiz, useSkillTopics } from '../hooks/useSkillAssessment';
import AppIcon from '../../../components/icons/AppIcon';
import RetryErrorPanel from './RetryErrorPanel';
import { getApiErrorMessage } from '../utils/apiErrorUtils';

const QUESTION_COUNTS = [10, 12, 15];

export default function SkillAssessmentSetup() {
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();
  const { data: topics = [], isLoading: topicsLoading, isError: topicsError, refetch: refetchTopics } =
    useSkillTopics();
  const generateQuiz = useGenerateSkillQuiz();
  const [generateError, setGenerateError] = useState(null);

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(String(DEFAULT_SKILL_QUIZ_QUESTION_COUNT));

  const handleStart = async () => {
    if (!topic) {
      toast.error(t('skillSetup.selectTopic'));
      return;
    }

    try {
      setGenerateError(null);
      const result = await generateQuiz.mutateAsync({
        topic,
        difficulty,
        questionCount: Number(questionCount),
      });

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

  if (topicsError) {
    return (
      <RetryErrorPanel
        title={t('skillSetup.topicsLoadFailed')}
        message={t('skillSetup.topicsLoadMessage')}
        onRetry={() => refetchTopics()}
        retryLabel={t('skillSetup.reloadTopics')}
      />
    );
  }

  if (topicsLoading) {
    return (
      <div className="flex justify-center py-xl">
        <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
      </div>
    );
  }

  const topicOptions = topics.map((topicItem) => ({
    value: topicItem.id,
    label: t(`topics.${topicItem.id}`, { defaultValue: topicItem.label }),
  }));

  const difficultyOptions = MOCK_INTERVIEW_DIFFICULTIES.map((value) => ({
    value,
    label: t(`difficulty.${value}`),
  }));

  const questionCountOptions = QUESTION_COUNTS.map((value) => ({
    value: String(value),
    label: t('skillSetup.length.questions', { count: value }),
  }));

  return (
    <div className="min-w-0 space-y-md">
      <header className="min-w-0">
        <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          {t('skillSetup.title')}
        </h1>
        <p className="font-body-md text-on-surface-variant mt-base">{t('skillSetup.description')}</p>
      </header>

      <RetryErrorPanel
        message={generateError}
        onRetry={handleStart}
        retryLabel={t('skillSetup.retryGenerate')}
      />

      <section className={accentCardClass}>
        <SectionHeading
          color="skills"
          icon="school"
          title={t('skillSetup.topic.title')}
          description={t('skillSetup.topic.description')}
        />
        <RadioGroup name="skill-topic" value={topic} onChange={setTopic} options={topicOptions} />
      </section>

      <section className={accentCardClass}>
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

      <section className={accentCardClass}>
        <SectionHeading
          color="time"
          icon="hourglass_top"
          title={t('skillSetup.length.title')}
          description={t('skillSetup.length.description')}
        />
        <RadioGroup
          name="skill-length"
          value={questionCount}
          onChange={setQuestionCount}
          options={questionCountOptions}
        />
      </section>

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
