import { useMemo, useState } from 'react';
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
import { cn } from '../../../lib/utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const SKILL_KEYS = [
  'communication',
  'technicalSkills',
  'behavior',
  'confidence',
  'leadership',
  'problemSolving',
  'criticalThinking',
];

const SKILL_COLORS = {
  communication: '#0F766E',
  technicalSkills: '#1D4ED8',
  behavior: '#B45309',
  confidence: '#7C3AED',
  leadership: '#BE185D',
  problemSolving: '#0369A1',
  criticalThinking: '#4D7C0F',
};

function formatChartLabel(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function InterviewProgressChart({ history = [], currentSessionId }) {
  const { t } = useTranslation('interviewPrep');
  const [view, setView] = useState('overall');

  const hasSkillHistory = useMemo(
    () =>
      Array.isArray(history) &&
      history.some((item) => item?.dimensions && Object.keys(item.dimensions).length > 0),
    [history]
  );

  if (!Array.isArray(history) || history.length < 2) {
    return null;
  }

  const labels = history.map((item) => formatChartLabel(item.createdAt));
  const pointRadius = history.map((item) =>
    currentSessionId && item.sessionId === currentSessionId ? 6 : 4
  );

  const overallData = {
    labels,
    datasets: [
      {
        label: t('report.chartLabel'),
        data: history.map((item) => item.overallScore ?? 0),
        borderColor: '#0F766E',
        backgroundColor: 'rgba(15, 118, 110, 0.12)',
        pointBackgroundColor: history.map((item) =>
          currentSessionId && item.sessionId === currentSessionId ? '#0F766E' : '#334155'
        ),
        pointBorderColor: '#fff',
        pointRadius,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const skillsData = {
    labels,
    datasets: SKILL_KEYS.map((key) => ({
      label: t(`report.enterprise.dimensions.${key}`, key),
      data: history.map((item) => item.dimensions?.[key] ?? null),
      borderColor: SKILL_COLORS[key],
      backgroundColor: 'transparent',
      pointBackgroundColor: SKILL_COLORS[key],
      pointBorderColor: '#fff',
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.35,
      fill: false,
      spanGaps: true,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: view === 'skills',
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            view === 'overall'
              ? t('report.chartTooltip', { score: context.parsed.y })
              : `${context.dataset.label}: ${context.parsed.y ?? '—'}`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
        },
        grid: {
          color: 'rgba(121, 116, 126, 0.15)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const tabClass = (id) =>
    cn(
      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
      view === id
        ? 'bg-surface-container-high text-on-surface'
        : 'text-on-surface-variant hover:bg-surface-container-low'
    );

  return (
    <section className="dashboard-glass-card dashboard-card-padding min-w-0 space-y-sm rounded-2xl">
      <div className="flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-headline-section text-headline-section app-heading">
            {t('report.progressTitle')}
          </h3>
          <p className="mt-1 font-body-md text-sm app-muted">
            {view === 'skills'
              ? t('report.progressDescriptionBySkill')
              : t('report.progressDescription')}
          </p>
        </div>
        {hasSkillHistory ? (
          <div
            className="inline-flex shrink-0 gap-1 rounded-xl border border-outline-variant/50 p-1"
            role="tablist"
            aria-label={t('report.progressViewLabel')}
          >
            <button type="button" role="tab" aria-selected={view === 'overall'} className={tabClass('overall')} onClick={() => setView('overall')}>
              {t('report.progressViewOverall')}
            </button>
            <button type="button" role="tab" aria-selected={view === 'skills'} className={tabClass('skills')} onClick={() => setView('skills')}>
              {t('report.progressViewBySkill')}
            </button>
          </div>
        ) : null}
      </div>
      <div className="h-56 w-full min-w-0">
        <Line data={view === 'skills' ? skillsData : overallData} options={options} />
      </div>
    </section>
  );
}
