import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { DashboardLayout, PageContainer, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
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
        <div className="flex items-center justify-center py-xl">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer width="narrow">
        <BackLink to="/interview-prep/skills">{t('backLinks.newQuiz')}</BackLink>

        {isLoading ? (
          <div className="flex justify-center py-xl">
            <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
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
          <>
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
          </>
        ) : null}
      </PageContainer>
    </DashboardLayout>
  );
}
