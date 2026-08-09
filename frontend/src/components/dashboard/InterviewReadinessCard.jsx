import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, Video } from 'lucide-react';

function InterviewReadinessCard({ interviewReadiness }) {
  const { t } = useTranslation('dashboard');

  if (!interviewReadiness) return null;

  const { score, weakAreas, strongArea } = interviewReadiness;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">{t('interviewReadiness.title')}</h4>
        <span className="text-2xl font-bold text-blue-600">{score}%</span>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-red-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-red-600">{t('interviewReadiness.weakAreas')}</p>
          <p className="mt-0.5 text-sm font-medium text-red-800">{weakAreas?.join(', ')}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-emerald-600">{t('interviewReadiness.strongArea')}</p>
          <p className="mt-0.5 text-sm font-medium text-emerald-800">{strongArea}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to="/interview-prep/mock"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Video className="h-4 w-4" aria-hidden />
          {t('interviewReadiness.videoMode')}
        </Link>
        <Link
          to="/interview-prep/mock"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Mic className="h-4 w-4" aria-hidden />
          {t('interviewReadiness.voiceAnalysis')}
        </Link>
      </div>
    </div>
  );
}

export default memo(InterviewReadinessCard);
