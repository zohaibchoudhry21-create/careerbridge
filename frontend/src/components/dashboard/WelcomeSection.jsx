import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Sparkles } from 'lucide-react';

function WelcomeSection({ welcome }) {
  const { t } = useTranslation('dashboard');

  if (!welcome) return null;

  return (
    <header className="min-w-0 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {t('welcome.title', { name: welcome.firstName })}
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">{t('welcome.subtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('welcome.lastActivity', { activity: welcome.lastActivity })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('welcome.aiStatus', { status: welcome.aiStatus })}
        </span>
      </div>
    </header>
  );
}

export default memo(WelcomeSection);
