import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function EnterpriseCharts({ charts = {} }) {
  const { t } = useTranslation('interviewPrep');
  const radar = Array.isArray(charts.dimensionRadar) ? charts.dimensionRadar : [];

  // Prefer Phase 4 separated series; fall back to flat scoreBreakdown.
  const contentBars = Array.isArray(charts.scoreBreakdownContent)
    ? charts.scoreBreakdownContent
    : (charts.scoreBreakdown || []).filter((item) => item.group === 'content');
  const deliveryBars = Array.isArray(charts.scoreBreakdownDelivery)
    ? charts.scoreBreakdownDelivery
    : (charts.scoreBreakdown || []).filter(
        (item) => item.group === 'delivery' || item.deliveryOnly
      );

  const useSplit = contentBars.length > 0 || deliveryBars.length > 0;
  const flatBars = Array.isArray(charts.scoreBreakdown)
    ? charts.scoreBreakdown.filter((item) => item.key !== 'overall')
    : [];

  if (!radar.length && !useSplit && !flatBars.length) return null;

  const barLabels = useSplit
    ? [...contentBars.map((b) => b.label || b.key), ...deliveryBars.map((b) => b.label || b.key)]
    : flatBars.map((item) => item.label || item.key);
  const barScores = useSplit
    ? [...contentBars.map((b) => b.score ?? 0), ...deliveryBars.map((b) => b.score ?? 0)]
    : flatBars.map((item) => item.score ?? 0);
  const barColors = useSplit
    ? [
        ...contentBars.map(() => 'rgba(103, 80, 164, 0.75)'),
        ...deliveryBars.map(() => 'rgba(125, 82, 96, 0.45)'),
      ]
    : flatBars.map((item) =>
        item.deliveryOnly || item.group === 'delivery'
          ? 'rgba(125, 82, 96, 0.45)'
          : 'rgba(103, 80, 164, 0.75)'
      );

  return (
    <div className="grid grid-cols-1 gap-sm lg:grid-cols-2">
      {radar.length >= 3 ? (
        <section className={`${accentCardClass} min-h-[280px]`}>
          <SectionHeading
            color="skills"
            icon="donut_large"
            title={t('report.enterprise.dimensionRadar')}
            alignDescription={false}
          />
          <div className="h-56">
            <Radar
              data={{
                labels: radar.map((item) => item.label || item.key),
                datasets: [
                  {
                    label: t('report.enterprise.scores'),
                    data: radar.map((item) => item.score ?? 0),
                    backgroundColor: 'rgba(103, 80, 164, 0.18)',
                    borderColor: '#6750A4',
                    pointBackgroundColor: '#6750A4',
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: { min: 0, max: 100, ticks: { stepSize: 20, display: false } },
                },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </section>
      ) : null}

      {barLabels.length ? (
        <section className={`${accentCardClass} min-h-[280px]`}>
          <SectionHeading
            color="mode"
            icon="bar_chart"
            title={t('report.enterprise.scoreBreakdown')}
            alignDescription={false}
          />
          {charts.contentGated ? (
            <p className="mb-2 font-label-sm app-muted">
              Delivery bars are capped when answer content is weak
            </p>
          ) : useSplit ? (
            <p className="mb-2 font-label-sm app-muted">
              Purple = content · Muted = delivery (capped influence)
            </p>
          ) : null}
          <div className="h-56">
            <Bar
              data={{
                labels: barLabels,
                datasets: [
                  {
                    label: t('report.enterprise.scores'),
                    data: barScores,
                    backgroundColor: barColors,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { min: 0, max: 100 } },
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
