import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from '../icons/AppIcon';
import SectionIcon from '../ui/SectionIcon';

export default function SettingCard({ title, description, icon, to, color = 'settings' }) {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="dashboard-card-hover app-surface-card group flex h-full w-full flex-col items-start p-sm text-start transition-all duration-200 hover:border-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 sm:p-md"
    >
      <SectionIcon color={color} icon={icon} size="md" />
      <h2 className="mt-4 font-headline-section text-headline-section app-heading">{title}</h2>
      <p className="mt-3 flex-1 font-body-md text-sm leading-relaxed app-muted">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-label-md text-secondary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {t('hub.manage')}
        <AppIcon name="chevron_right" size="button" className="rtl:rotate-180" />
      </span>
    </button>
  );
}
