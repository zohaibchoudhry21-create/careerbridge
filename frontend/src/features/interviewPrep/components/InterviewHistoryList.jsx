import { useEffect, useMemo, useState } from 'react';
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

function HistoryClearDialog({ open, totalCount, loading, description, onConfirm, onCancel }) {
  const { t } = useTranslation('interviewPrep');

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };

    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t('history.clearCancel')}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-clear-dialog-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
      >
        <div className="px-6 pb-4 pt-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 ring-8 ring-rose-50/60">
            <AppIcon name="delete_forever" size="dashboard" className="text-rose-600" />
          </div>
          <h2
            id="history-clear-dialog-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            {t('history.clearTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {description ||
              t('history.clearDescription', {
                count: totalCount,
              })}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 px-6 pb-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] w-full px-4 py-2.5 sm:w-auto"
          >
            {t('history.clearCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] w-full gap-2 px-4 py-2.5 sm:w-auto"
          >
            {loading ? (
              <>
                <AppIcon name="progress_activity" size="button" spin className="text-white" />
                {t('history.clearing')}
              </>
            ) : (
              <>
                <AppIcon name="delete_forever" size="button" className="text-white" />
                {t('history.clearConfirm')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HistoryDeleteDialog({ item, loading, onConfirm, onCancel }) {
  const { t } = useTranslation('interviewPrep');
  const roleLabel = item?.roleLabel || item?.role || t('session.defaultRole');

  useEffect(() => {
    if (!item) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };

    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [item, loading, onCancel]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t('history.deleteCancel')}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[3px]"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-delete-dialog-title"
        className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
      >
        <div className="px-6 pb-4 pt-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 ring-8 ring-rose-50/60">
            <AppIcon name="delete" size="dashboard" className="text-rose-600" />
          </div>
          <h2
            id="history-delete-dialog-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            {t('history.deleteTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {t('history.deleteDescription', { role: roleLabel })}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 px-6 pb-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] w-full px-4 py-2.5 sm:w-auto"
          >
            {t('history.deleteCancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] w-full gap-2 px-4 py-2.5 sm:w-auto"
          >
            {loading ? (
              <>
                <AppIcon name="progress_activity" size="button" spin className="text-white" />
                {t('history.deleting')}
              </>
            ) : (
              <>
                <AppIcon name="delete" size="button" className="text-white" />
                {t('history.deleteConfirm')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
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

function HistoryListToolbar({ totalCount, onClearAll, isClearing }) {
  const { t } = useTranslation('interviewPrep');

  if (!onClearAll || totalCount <= 0) return null;

  return (
    <div className="flex items-center justify-end border-b border-outline-variant/30 pb-3">
      <button
        type="button"
        onClick={onClearAll}
        disabled={isClearing}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-label-sm text-on-surface-variant transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:pointer-events-none disabled:opacity-50"
      >
        {isClearing ? (
          <AppIcon name="progress_activity" size="sm" spin />
        ) : (
          <AppIcon name="delete_forever" size="sm" />
        )}
        {isClearing ? t('history.clearing') : t('history.clearAll')}
      </button>
    </div>
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
  onDelete,
  isDeleting = false,
  deletingSessionId = '',
  onClearAll,
  isClearing = false,
  totalCount = 0,
  basePath = '/interview-prep/mock',
  emptyCtaTo,
}) {
  const { t, i18n } = useTranslation('interviewPrep');
  const [pendingDelete, setPendingDelete] = useState(null);
  const setupPath = emptyCtaTo || basePath;

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
            to={setupPath}
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
      <div className="min-w-0 space-y-sm">
        <HistoryListToolbar
          totalCount={totalCount || items.length}
          onClearAll={onClearAll}
          isClearing={isClearing}
        />
        <section className={cn(accentCardClass, 'text-center py-10')}>
          <div className="mx-auto flex max-w-md flex-col items-center gap-sm">
            <AppIcon name="search" size="dashboard" className="text-secondary" />
            <h2 className="font-headline-section text-headline-section app-heading">
              {t('history.noSearchResults')}
            </h2>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-sm">
      <HistoryListToolbar
        totalCount={totalCount || items.length}
        onClearAll={onClearAll}
        isClearing={isClearing}
      />
      <section>
        <ul className="grid min-w-0 grid-cols-1 gap-sm sm:grid-cols-2 lg:grid-cols-4">
          {filteredItems.map((item) => {
            const title = item.roleLabel || item.role || t('session.defaultRole');
            const status = item.status || 'setup';
            const hasScore =
              item.reportAvailable && item.overallScore != null && Number.isFinite(Number(item.overallScore));

            return (
              <li key={item.sessionId} className="min-w-0">
                <article
                  className={cn(
                    'app-surface-card dashboard-card-hover relative flex h-full flex-col gap-3 p-5',
                    'transition-all duration-200 hover:border-secondary/30'
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <h2 className="min-w-0 truncate pe-1 font-headline-section text-headline-section app-heading">
                      <Link
                        to={`${basePath}/${item.sessionId}`}
                        state={{ fromHistory: true }}
                        className="block truncate hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded-sm"
                      >
                        {title}
                      </Link>
                    </h2>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 font-label-sm',
                          STATUS_BADGE_CLASS[status] || STATUS_BADGE_CLASS.setup
                        )}
                      >
                        {t(`history.status.${status}`, { defaultValue: status })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item)}
                        disabled={isDeleting}
                        aria-label={t('history.deleteAria', { role: title })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 disabled:pointer-events-none disabled:opacity-50"
                      >
                        {isDeleting && deletingSessionId === item.sessionId ? (
                          <AppIcon name="progress_activity" size="sm" spin />
                        ) : (
                          <AppIcon name="delete" size="sm" />
                        )}
                      </button>
                    </div>
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
                    <Link
                      to={`${basePath}/${item.sessionId}`}
                      state={{ fromHistory: true }}
                      className="inline-flex items-center gap-1 rounded-lg px-1 py-0.5 font-label-md text-secondary transition-colors hover:text-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
                    >
                      {t('history.view')}
                      <AppIcon name="chevron_right" size="button" className="rtl:rotate-180" />
                    </Link>
                  </div>
                </article>
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

      <HistoryDeleteDialog
        item={pendingDelete}
        loading={isDeleting && pendingDelete?.sessionId === deletingSessionId}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (!pendingDelete?.sessionId) return;
          onDelete?.(pendingDelete, () => setPendingDelete(null));
        }}
      />
    </div>
  );
}

export { HistoryClearDialog };
