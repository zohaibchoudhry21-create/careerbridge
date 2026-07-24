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

function formatChartLabel(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function InterviewProgressChart({ history = [], currentSessionId }) {
  if (!Array.isArray(history) || history.length < 2) {
    return null;
  }

  const labels = history.map((item) => formatChartLabel(item.createdAt));
  const scores = history.map((item) => item.overallScore ?? 0);
  const pointRadius = history.map((item) =>
    currentSessionId && item.sessionId === currentSessionId ? 6 : 4
  );
  const pointBackgroundColor = history.map((item) =>
    currentSessionId && item.sessionId === currentSessionId ? '#6750A4' : '#7D5260'
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Overall score',
        data: scores,
        borderColor: '#6750A4',
        backgroundColor: 'rgba(103, 80, 164, 0.12)',
        pointBackgroundColor,
        pointBorderColor: '#fff',
        pointRadius,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `Score: ${context.parsed.y}`,
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

  return (
    <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-sm min-w-0">
      <div>
        <h3 className="font-headline-section text-headline-section text-on-surface">Your progress</h3>
        <p className="font-body-md text-on-surface-variant text-sm mt-1">
          Overall score trend across your recent mock interviews.
        </p>
      </div>
      <div className="h-56 w-full min-w-0">
        <Line data={data} options={options} />
      </div>
    </section>
  );
}
