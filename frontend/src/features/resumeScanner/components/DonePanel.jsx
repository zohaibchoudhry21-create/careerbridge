import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Download } from 'lucide-react';

/**
 * Done phase — resume finalized.
 * Download PDF only when analysis.canDownloadPdf is true.
 */
export default function DonePanel({
  analysis,
  onBackToFinalize,
  onDownloadPdf,
  canDownloadPdf = false,
  isDownloadingPdf = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const jobTitle =
    analysis?.jobDescription?.title ||
    analysis?.jobTitle ||
    t('analysis.defaultJobTitle');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-slate-50 min-h-0 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{t('analysis.done.title')}</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {t('analysis.done.description', { jobTitle })}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          {canDownloadPdf ? (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden />
              {isDownloadingPdf
                ? t('analysis.toolbar.downloadingPdf')
                : t('analysis.toolbar.downloadPdf')}
            </button>
          ) : null}
          <Link
            to="/resume-scanner"
            className="inline-flex items-center justify-center px-6 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            {t('analysis.toolbar.newAnalysis')}
          </Link>
          {typeof onBackToFinalize === 'function' ? (
            <button
              type="button"
              onClick={onBackToFinalize}
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              {t('analysis.done.backToFinalize')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
