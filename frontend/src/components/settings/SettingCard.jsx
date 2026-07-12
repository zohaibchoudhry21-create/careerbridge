import { useNavigate } from 'react-router-dom';
import AppIcon from '../icons/AppIcon';

export default function SettingCard({ title, description, icon, to, accent = 'secondary' }) {
  const navigate = useNavigate();
  const iconColorClass = accent === 'error' ? 'text-error' : 'text-secondary';

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="dashboard-card-hover dashboard-glass-card group flex h-full w-full flex-col items-start rounded-2xl border border-outline-variant/40 bg-white p-sm sm:p-md text-left transition-all duration-200 hover:border-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40"
    >
      <AppIcon name={icon} size="settings" className={iconColorClass} aria-hidden />
      <h2 className="font-headline-section text-headline-section text-on-surface mt-4">{title}</h2>
      <p className="font-body-md text-on-surface-variant text-sm mt-3 leading-relaxed flex-1">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-label-md text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Manage
        <AppIcon name="chevron_right" size="button" />
      </span>
    </button>
  );
}
