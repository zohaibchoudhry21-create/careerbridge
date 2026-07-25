import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUICK_ACTIONS } from './dashboardConstants';
import AppIcon from '../icons/AppIcon';

function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="min-w-0">
      <h3 className="font-headline-section text-headline-section mb-sm">Accelerated Tools</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-xs sm:gap-sm min-w-0 w-full">
        {QUICK_ACTIONS.map(({ id, label, icon, href }) => (
          <button
            key={id}
            type="button"
            onClick={() => href && navigate(href)}
            className="dashboard-card-hover dashboard-card-padding dashboard-glass-card rounded-2xl flex flex-col items-center justify-center gap-xs transition-all text-center min-h-[96px] min-w-0"
          >
            {icon ? (
              <AppIcon name={icon} size="dashboard" className="text-secondary" />
            ) : null}
            <span className="font-label-md min-w-0 break-words">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(QuickActions);
