import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUICK_ACTIONS } from './dashboardConstants';
import SectionIcon from '../ui/SectionIcon';

function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="min-w-0">
      <div className="mb-sm flex items-center gap-2.5">
        <SectionIcon color="settings" icon="bolt" />
        <h3 className="font-headline-section text-headline-section">Accelerated Tools</h3>
      </div>
      <div className="grid w-full min-w-0 grid-cols-2 gap-xs sm:grid-cols-3 sm:gap-sm lg:grid-cols-3 xl:grid-cols-5">
        {QUICK_ACTIONS.map(({ id, label, icon, href, color = 'resume' }) => (
          <button
            key={id}
            type="button"
            onClick={() => href && navigate(href)}
            className="dashboard-card-hover flex min-h-[96px] min-w-0 flex-col items-center justify-center gap-xs rounded-2xl text-center transition-all dashboard-glass-card dashboard-card-padding"
          >
            {icon ? <SectionIcon color={color} icon={icon} size="sm" /> : null}
            <span className="min-w-0 break-words font-label-md">{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default memo(QuickActions);
