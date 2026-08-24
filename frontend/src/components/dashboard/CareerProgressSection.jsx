import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { boxWidth: 10, font: { size: 11 } },
    },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: { stepSize: 25, font: { size: 10 } },
      grid: { color: 'rgba(148, 163, 184, 0.25)' },
    },
    x: {
      ticks: { font: { size: 10 } },
      grid: { display: false },
    },
  },
};

function TrendChart({ labels, datasets }) {
  const data = useMemo(
    () => ({
      labels,
      datasets: datasets.map((dataset) => ({
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBorderColor: '#fff',
        ...dataset,
      })),
    }),
    [labels, datasets]
  );

  if (!labels.length) return null;

  return (
    <div className="h-48 w-full min-w-0">
      <Line data={data} options={chartOptions} />
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <p className="text-2xl font-semibold text-slate-900">{value ?? '—'}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function CareerProgressSection({ careerProgress }) {
  const { t } = useTranslation('dashboard');

  if (!careerProgress) return null;

  const {
    hasData,
    summary = {},
    interviewTrend = [],
    atsTrend = [],
    weakSkills = [],
    timeline = [],
  } = careerProgress;

  if (!hasData) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
        <h3 className="text-base font-semibold text-slate-900">{t('careerProgress.empty.title')}</h3>
        <p className="mt-1 text-sm text-slate-500">{t('careerProgress.empty.description')}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            to="/resume-scanner"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('careerProgress.empty.scanCta')}
          </Link>
          <Link
            to="/interview-prep/mock"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t('careerProgress.empty.mockCta')}
          </Link>
          <Link
            to="/interview-prep/panel"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('careerProgress.empty.panelCta')}
          </Link>
        </div>
      </div>
    );
  }

  const interviewLabels = interviewTrend.map((item) => item.label);
  const atsLabels = atsTrend.map((item) => item.label);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/interview-prep/mock"
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('careerProgress.actions.mock')}
        </Link>
        <Link
          to="/interview-prep/panel"
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('careerProgress.actions.panel')}
        </Link>
        <Link
          to="/resume-scanner"
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('careerProgress.actions.scan')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat
          label={t('careerProgress.stats.interviewAvg')}
          value={summary.interviewAverage != null ? `${summary.interviewAverage}%` : '—'}
        />
        <SummaryStat
          label={t('careerProgress.stats.interviews')}
          value={summary.interviewsCompleted ?? 0}
        />
        <SummaryStat label={t('careerProgress.stats.quizzes')} value={summary.quizzesCompleted ?? 0} />
        <SummaryStat label={t('careerProgress.stats.scans')} value={summary.scansCompleted ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            {t('careerProgress.charts.interviewTrend')}
          </h3>
          {interviewTrend.length >= 2 ? (
            <div className="mt-3">
              <TrendChart
                labels={interviewLabels}
                datasets={[
                  {
                    label: t('careerProgress.charts.interviewScore'),
                    data: interviewTrend.map((item) => item.score),
                    borderColor: '#0F766E',
                    backgroundColor: 'rgba(15, 118, 110, 0.12)',
                    pointBackgroundColor: '#0F766E',
                  },
                ]}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t('careerProgress.charts.needMoreInterviews')}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900">{t('careerProgress.charts.atsTrend')}</h3>
          {atsTrend.length >= 2 ? (
            <div className="mt-3">
              <TrendChart
                labels={atsLabels}
                datasets={[
                  {
                    label: t('careerProgress.charts.atsScore'),
                    data: atsTrend.map((item) => item.atsScore),
                    borderColor: '#1D4ED8',
                    backgroundColor: 'rgba(29, 78, 216, 0.10)',
                    pointBackgroundColor: '#1D4ED8',
                  },
                  {
                    label: t('careerProgress.charts.jobMatch'),
                    data: atsTrend.map((item) => item.jobMatchScore),
                    borderColor: '#7C3AED',
                    backgroundColor: 'rgba(124, 58, 237, 0.08)',
                    pointBackgroundColor: '#7C3AED',
                  },
                ]}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t('careerProgress.charts.needMoreScans')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900">{t('careerProgress.weakSkills.title')}</h3>
          {weakSkills.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {weakSkills.map((skill) => (
                <li
                  key={skill.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-800"
                >
                  {skill.label}
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">
                    {skill.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t('careerProgress.weakSkills.empty')}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900">{t('careerProgress.timeline.title')}</h3>
          {timeline.length ? (
            <ol className="mt-3 space-y-3">
              {timeline.slice(0, 5).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.relativeTime}</p>
                  </div>
                  {item.score != null ? (
                    <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {item.score}%
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t('careerProgress.timeline.empty')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(CareerProgressSection);
