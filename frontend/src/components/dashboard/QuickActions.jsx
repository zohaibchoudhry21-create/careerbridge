import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuickActions } from '../../hooks/useDashboardNav';
import SectionIcon from '../ui/SectionIcon';

function QuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const quickActions = useQuickActions();

  return (
    <section className="min-w-0">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
        {t('quickActions.sectionTitle')}
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {quickActions.map(({ id, label, icon, href, color = 'resume' }) => (
          <button
            key={id}
            type="button"
            onClick={() => href && navigate(href)}
            disabled={!href}
            className="flex min-h-[72px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-start transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
          >
            {icon ? <SectionIcon color={color} icon={icon} size="sm" /> : null}
            <span className="text-sm font-medium text-slate-800">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(QuickActions);
