import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import AppIcon from '../../components/icons/AppIcon';
import MockInterviewSetup from '../../features/interviewPrep/components/MockInterviewSetup';

export default function MockInterviewSetupPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();

  // Desktop: lock outer main scroll so only the left form column scrolls.
  useEffect(() => {
    const main = document.querySelector('.dashboard-main');
    if (!main || !(main instanceof HTMLElement)) return undefined;

    const previousOverflowY = main.style.overflowY;
    const mq = window.matchMedia('(min-width: 1024px)');

    const apply = () => {
      main.style.overflowY = mq.matches ? 'hidden' : previousOverflowY || '';
    };

    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      main.style.overflowY = previousOverflowY;
    };
  }, []);

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="wide">
          <Skeleton
            type="card"
            count={3}
            withMedia={false}
            lines={4}
            columnsGrid={1}
            label="Loading mock interview setup"
          />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer
        width="wide"
        className="lg:flex lg:h-[calc(100dvh-8rem)] lg:max-h-[calc(100dvh-8rem)] lg:min-h-0 lg:flex-col lg:gap-3 lg:overflow-hidden lg:!space-y-0"
      >
        <div className="shrink-0 space-y-3">
          <BackLink to="/interview-prep">{t('backLinks.interviewPrep')}</BackLink>
          <PageHeader
            title={t('mockSetup.title')}
            description={t('mockSetup.description')}
            actions={
              <Link
                to="/interview-prep/mock/history"
                className="inline-flex shrink-0 items-center gap-1 font-label-md text-secondary hover:underline"
              >
                <AppIcon name="history" size="sm" />
                {t('history.navLabel')}
              </Link>
            }
          />
        </div>
        <div className="min-h-0 min-w-0 flex-1 lg:overflow-hidden">
          <MockInterviewSetup />
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
