import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/Skeleton';
import { accentCardClass } from '../../../components/ui/colorAccentTokens';
import { buttonGradientCtaClass } from '../../../components/ui/buttonTokens';
import { cn } from '../../../lib/utils';
import RetryErrorPanel from './RetryErrorPanel';

const STATUS_BADGE_CLASS = {
  completed: 'bg-emerald-50 text-emerald-700',
  abandoned: 'bg-amber-50 text-amber-800',
  active: 'bg-blue-50 text-blue-700',
  processing: 'bg-blue-50 text-blue-700',
  setup: 'bg-surface-container-high text-on-surface-variant',
};

function formatInterviewDate(createdAt, language) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function HistoryMeta({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 font-body-md text-sm app-muted">
      <AppIcon name={icon} size="sm" className="text-on-surface-variant" />
      {children}
    </span>
  );
}

function itemMatchesSearch(item, query, t) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    item.role,
    item.roleLabel,
    item.difficulty,
    item.difficulty ? t(`difficulty.${item.difficulty}`) : '',
    item.status,
    item.status ? t(`history.status.${item.status}`, { defaultValue: item.status }) : '',
    item.overallScore != null ? String(item.overallScore) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

export function HistorySearchBar({ value, onChange, className }) {
  const { t } = useTranslation('interviewPrep');

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className={cn('relative min-w-0', className)}
      role="search"
    >
      <AppIcon
        name="search"
        size="button"
        className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-outline"
      />
      <label htmlFor="interview-history-search" className="sr-only">
        {t('history.searchLabel')}
      </label>
      <input
        id="interview-history-search"
        type="search"
        placeholder={t('history.searchPlaceholder')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-outline-variant bg-white ps-10 pe-3 py-2.5 text-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
      />
    </form>
  );
}

export default function InterviewHistoryList({
  items = [],
  pagination,
  isLoading,
  error,
  searchTerm = '',
  onRetry,
  onPageChange,
}) {
  const { t, i18n } = useTranslation('interviewPrep');

  const filteredItems = useMemo(
    () => items.filter((item) => itemMatchesSearch(item, searchTerm, t)),
    [items, searchTerm, t]
  );

  if (isLoading) {
    return (
      <Skeleton
        type="card"
        count={4}
        withMedia={false}
        lines={3}
        columnsGrid={4}
        label={t('history.loading')}
      />
    );
  }

  if (error) {
    return (
      <RetryErrorPanel
        title={t('history.errorTitle')}
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!items.length) {
    return (
      <section className={cn(accentCardClass, 'text-center py-10')}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-sm">
          <AppIcon name="history" size="dashboard" className="text-secondary" />
          <h2 className="font-headline-section text-headline-section app-heading">
            {t('history.emptyTitle')}
          </h2>
          <p className="font-body-md app-muted">{t('history.emptyDescription')}</p>
          <Link
            to="/interview-prep/mock"
            className={cn(buttonGradientCtaClass, 'mt-2')}
          >
            <AppIcon name="sparkles" size="sm" className="text-white" />
            {t('history.startNew')}
          </Link>
        </div>
      </section>
    );
  }

  if (!filteredItems.length) {
    return (
      <section className={cn(accentCardClass, 'text-center py-10')}>
        <div className="mx-auto flex max-w-md flex-col items-center gap-sm">
          <AppIcon name="search" size="dashboard" className="text-secondary" />
          <h2 className="font-headline-section text-headline-section app-heading">
            {t('history.noSearchResults')}
          </h2>
        </div>
      </section>
    );
  }

  return (
    <div className="min-w-0 space-y-sm">
      <section>
        <ul className="grid min-w-0 grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item) => {
              const title = item.roleLabel || item.role || t('session.defaultRole');
              const status = item.status || 'setup';
              const hasScore =
                item.reportAvailable && item.overallScore != null && Number.isFinite(Number(item.overallScore));

              return (
                <li key={item.sessionId} className="min-w-0">
                  <Link
                    to={`/interview-prep/mock/${item.sessionId}`}
                    state={{ fromHistory: true }}
                    className={cn(
                      accentCardClass,
                      'dashboard-card-hover flex h-full flex-col gap-3 hover:border-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40'
                    )}
                  >
                    <div className="flex w-full items-start justify-between gap-sm">
                      <h2 className="min-w-0 truncate font-headline-section text-headline-section app-heading">
                        {title}
                      </h2>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 font-label-sm',
                          STATUS_BADGE_CLASS[status] || STATUS_BADGE_CLASS.setup
                        )}
                      >
                        {t(`history.status.${status}`, { defaultValue: status })}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {item.createdAt ? (
                        <HistoryMeta icon="calendar_today">
                          {formatInterviewDate(item.createdAt, i18n.language)}
                        </HistoryMeta>
                      ) : null}
                      {item.durationMinutes != null ? (
                        <HistoryMeta icon="hourglass_top">
                          {t('live.minutesShort', { count: item.durationMinutes })}
                        </HistoryMeta>
                      ) : null}
                      {item.questionCount != null ? (
                        <HistoryMeta icon="rate_review">
                          {t('history.questionCount', { count: item.questionCount })}
                        </HistoryMeta>
                      ) : null}
                      {item.difficulty ? (
                        <HistoryMeta icon="tune">{t(`difficulty.${item.difficulty}`)}</HistoryMeta>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-sm pt-1">
                      {hasScore ? (
                        <p className="font-label-md text-secondary">
                          {t('history.score', { score: item.overallScore })}
                        </p>
                      ) : (
                        <p className="font-body-md text-sm app-muted">{t('history.scoreUnavailable')}</p>
                      )}
                      <span className="inline-flex items-center gap-1 font-label-md text-secondary">
                        {t('history.view')}
                        <AppIcon name="chevron_right" size="button" className="rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      {pagination?.totalPages > 1 ? (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
          <p className="font-body-md text-sm app-muted text-center sm:text-start">
            {t('history.pageOf', {
              current: pagination.currentPage,
              total: pagination.totalPages,
            })}
          </p>
          <div className="flex justify-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px] px-4 py-2.5"
              disabled={!pagination.hasPrev}
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
            >
              {t('history.previous')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px] px-4 py-2.5"
              disabled={!pagination.hasNext}
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
            >
              {t('history.next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
