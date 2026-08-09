import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, History, LayoutTemplate } from 'lucide-react';

const LINKS = [
  { id: 'upload', href: '/resume/upload', icon: FileText },
  { id: 'history', href: '/resume/history', icon: History },
  { id: 'templates', href: '/resume/templates', icon: LayoutTemplate },
];

function ResumeBuilderCard() {
  const { t } = useTranslation('dashboard');

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {LINKS.map(({ id, href, icon: Icon }) => (
        <Link
          key={id}
          to={href}
          className="group flex min-h-[88px] flex-col justify-center gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
        >
          <Icon className="h-5 w-5 text-blue-600" strokeWidth={2} aria-hidden />
          <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700">
            {t(`resumeBuilder.links.${id}`)}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default memo(ResumeBuilderCard);
