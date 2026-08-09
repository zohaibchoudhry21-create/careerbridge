import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import SectionIcon from '../ui/SectionIcon';

function DashboardFeatureSection({
  title,
  description,
  href,
  icon,
  color = 'role',
  children,
}) {
  const { t } = useTranslation('dashboard');

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? <SectionIcon color={color} icon={icon} size="md" /> : null}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {href ? (
          <Link
            to={href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {t('features.open')}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default memo(DashboardFeatureSection);
