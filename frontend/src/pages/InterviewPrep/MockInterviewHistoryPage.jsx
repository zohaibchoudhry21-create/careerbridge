import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import AppIcon from '../../components/icons/AppIcon';
import InterviewHistoryList, {
  HistorySearchBar,
} from '../../features/interviewPrep/components/InterviewHistoryList';
import { useInterviewSessionHistory } from '../../features/interviewPrep/hooks/useMockInterview';
import {
  INTERVIEW_HISTORY_DEFAULT_LIMIT,
  INTERVIEW_HISTORY_DEFAULT_PAGE,
} from '../../features/interviewPrep/constants/interviewPrepConstants';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';
import { buttonGradientCtaClass } from '../../components/ui/buttonTokens';
import { cn } from '../../lib/utils';

export default function MockInterviewHistoryPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();
  const [page, setPage] = useState(INTERVIEW_HISTORY_DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const historyQuery = useInterviewSessionHistory(page, INTERVIEW_HISTORY_DEFAULT_LIMIT);

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="wide">
          <Skeleton
            type="card"
            count={4}
            withMedia={false}
            lines={3}
            columnsGrid={4}
            label={t('history.loading')}
          />
        </PageContainer>
      </DashboardLayout>
    );
  }

  const errorMessage = historyQuery.error
    ? getApiErrorMessage(historyQuery.error, t('history.errorFallback'))
    : null;

  return (
    <DashboardLayout user={user}>
      <PageContainer width="wide">
        <BackLink to="/interview-prep/mock">{t('backLinks.backToSetup')}</BackLink>
        <PageHeader
          title={t('history.title')}
          description={t('history.description')}
          actions={
            <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <HistorySearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full sm:w-64"
              />
              <Link
                to="/interview-prep/mock"
                className={cn(buttonGradientCtaClass, 'shrink-0')}
              >
                <AppIcon name="sparkles" size="sm" className="text-white" />
                {t('history.startNew')}
              </Link>
            </div>
          }
        />
        <InterviewHistoryList
          items={historyQuery.data?.items || []}
          pagination={historyQuery.data?.pagination}
          isLoading={historyQuery.isLoading}
          error={errorMessage}
          searchTerm={searchTerm}
          onRetry={() => historyQuery.refetch()}
          onPageChange={setPage}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
