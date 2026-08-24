import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import AppIcon from '../../components/icons/AppIcon';
import InterviewHistoryList, {
  HistoryClearDialog,
  HistorySearchBar,
} from '../../features/interviewPrep/components/InterviewHistoryList';
import {
  useClearInterviewSessionHistory,
  useDeleteInterviewSession,
  useInterviewSessionHistory,
} from '../../features/interviewPrep/hooks/useMockInterview';
import {
  INTERVIEW_FORMATS,
  INTERVIEW_HISTORY_DEFAULT_LIMIT,
  INTERVIEW_HISTORY_DEFAULT_PAGE,
} from '../../features/interviewPrep/constants/interviewPrepConstants';
import { getApiErrorMessage } from '../../features/interviewPrep/utils/apiErrorUtils';
import { buttonGradientCtaClass } from '../../components/ui/buttonTokens';
import { cn } from '../../lib/utils';

export default function PanelInterviewHistoryPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();
  const [page, setPage] = useState(INTERVIEW_HISTORY_DEFAULT_PAGE);
  const [searchTerm, setSearchTerm] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const historyQuery = useInterviewSessionHistory(
    page,
    INTERVIEW_HISTORY_DEFAULT_LIMIT,
    INTERVIEW_FORMATS.PANEL
  );
  const deleteSession = useDeleteInterviewSession();
  const clearHistory = useClearInterviewSessionHistory();

  const totalHistoryCount = historyQuery.data?.pagination?.total ?? 0;
  const hasHistory = totalHistoryCount > 0;

  const handleDelete = useCallback(
    (item, onSettled) => {
      if (!item?.sessionId) return;
      const wasLastOnPage = (historyQuery.data?.items || []).length === 1 && page > 1;

      deleteSession.mutate(item.sessionId, {
        onSuccess: () => {
          toast.success(t('history.deleteSuccess'));
          if (wasLastOnPage) setPage(page - 1);
          onSettled?.();
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, t('history.deleteFailed')));
          onSettled?.();
        },
      });
    },
    [deleteSession, historyQuery.data?.items, page, t]
  );

  const handleClearHistory = useCallback(() => {
    clearHistory.mutate(INTERVIEW_FORMATS.PANEL, {
      onSuccess: () => {
        toast.success(t('history.clearSuccess'));
        setPage(INTERVIEW_HISTORY_DEFAULT_PAGE);
        setClearDialogOpen(false);
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err, t('history.clearFailed')));
      },
    });
  }, [clearHistory, t]);

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
        <BackLink to="/interview-prep/panel">{t('backLinks.backToSetup')}</BackLink>
        <PageHeader
          title={t('panelHistory.title')}
          description={t('panelHistory.description')}
          actions={
            <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <HistorySearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full sm:w-64"
              />
              <Link
                to="/interview-prep/panel"
                className={cn(buttonGradientCtaClass, 'shrink-0')}
              >
                <AppIcon name="groups" size="sm" className="text-white" />
                {t('panelHistory.startNew')}
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
          onDelete={handleDelete}
          isDeleting={deleteSession.isPending}
          deletingSessionId={deleteSession.variables || ''}
          totalCount={totalHistoryCount}
          onClearAll={hasHistory ? () => setClearDialogOpen(true) : undefined}
          isClearing={clearHistory.isPending}
          basePath="/interview-prep/panel"
          emptyCtaTo="/interview-prep/panel"
        />
        <HistoryClearDialog
          open={clearDialogOpen}
          totalCount={totalHistoryCount}
          loading={clearHistory.isPending}
          description={t('panelHistory.clearDescription', { count: totalHistoryCount })}
          onCancel={() => {
            if (!clearHistory.isPending) setClearDialogOpen(false);
          }}
          onConfirm={handleClearHistory}
        />
      </PageContainer>
    </DashboardLayout>
  );
}
