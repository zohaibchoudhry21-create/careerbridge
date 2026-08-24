import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import SkillQuizMcq, {
  SkillQuizNavButtons,
  SkillQuizProgress,
} from '../../features/interviewPrep/components/SkillQuizMcq';
import SkillQuizResults from '../../features/interviewPrep/components/SkillQuizResults';
import RetryErrorPanel from '../../features/interviewPrep/components/RetryErrorPanel';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';
import { useSkillQuiz, useSubmitSkillQuiz } from '../../features/interviewPrep/hooks/useSkillAssessment';

export default function SkillAssessmentQuizPage() {
  const { t } = useTranslation('interviewPrep');
  const { quizId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { data: quiz, isLoading, isError, error, refetch } = useSkillQuiz(quizId);
  const submitQuiz = useSubmitSkillQuiz();

  const [submitError, setSubmitError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = quiz?.questions || [];
  const total = questions.length;

  const currentQuestion = questions[currentIndex];

  const selectedIndex = currentQuestion
    ? answers[currentQuestion.questionId]
    : undefined;

  const allAnswered = useMemo(() => {
    if (!total) return false;
    return questions.every((q) => answers[q.questionId] !== undefined);
  }, [answers, questions, total]);

  const quizTitle = quiz?.topicLabel || quiz?.topic || t('skillSetup.title');
  const quizDescription = quiz
    ? [
        t(`difficulty.${quiz.difficulty}`),
        t('skillSetup.length.questions', { count: total || quiz.questionCount || 0 }),
      ]
        .filter(Boolean)
        .join(' · ')
    : t('skillSetup.description');

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
  }, [quizId]);

  const handleSelect = (index) => {
    if (!currentQuestion || result) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: index,
    }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.error(t('quiz.answerAll'));
      return;
    }

    const payload = {
      quizId,
      answers: questions.map((q) => ({
        questionId: q.questionId,
        selectedIndex: answers[q.questionId],
      })),
    };

    try {
      setSubmitError(null);
      const data = await submitQuiz.mutateAsync(payload);
      setResult(data);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, t('quiz.submitFailedMessage')));
    }
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="standard">
          <Skeleton type="card" count={1} withMedia={false} lines={2} label="Loading quiz" />
          <div className="mt-4">
            <Skeleton type="list" count={4} />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer width="standard">
        <BackLink to="/interview-prep/skills">{t('backLinks.newQuiz')}</BackLink>
        <PageHeader title={quizTitle} description={quizDescription} />

        {isLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton type="text" lines={1} label="Loading skill quiz" />
            <Skeleton type="card" count={1} withMedia={false} lines={2} />
            <Skeleton type="list" count={4} />
          </div>
        ) : null}

        {isError ? (
          <RetryErrorPanel
            title={t('quiz.unavailable')}
            message={getApiErrorMessage(error, t('quiz.loadFailed'))}
            onRetry={() => refetch()}
            retryLabel={t('quiz.reload')}
          />
        ) : null}

        {result ? <SkillQuizResults result={result} /> : null}

        {!isLoading && !isError && quiz && !result ? (
          <div className="min-w-0 space-y-4">
            <SkillQuizProgress current={currentIndex} total={total} />
            <SkillQuizMcq
              question={currentQuestion}
              questionIndex={currentIndex}
              totalQuestions={total}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
              disabled={submitQuiz.isPending}
            />
            <SkillQuizNavButtons
              canPrev={currentIndex > 0}
              canNext={selectedIndex !== undefined}
              isLast={currentIndex === total - 1}
              onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              onNext={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
              onSubmit={handleSubmit}
              submitting={submitQuiz.isPending}
            />
            <RetryErrorPanel
              title={t('quiz.submitFailed')}
              message={submitError}
              onRetry={handleSubmit}
              retryLabel={t('quiz.retrySubmit')}
            />
          </div>
        ) : null}
      </PageContainer>
    </DashboardLayout>
  );
}
