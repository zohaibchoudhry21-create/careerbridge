import { useTranslation } from 'react-i18next';
import { ReportSectionCard } from './ReportShared';

const ORDER = [
  'communication',
  'technicalSkills',
  'behavior',
  'confidence',
  'leadership',
  'problemSolving',
  'criticalThinking',
];

export default function DimensionGrid({ dimensions = {} }) {
  const { t } = useTranslation('interviewPrep');
  const entries = ORDER.map((key) => [key, dimensions[key]]).filter(([, dim]) => dim);

  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
      {entries.map(([key, dim]) => (
        <ReportSectionCard
          key={key}
          title={dim.label || t(`report.enterprise.dimensions.${key}`, key)}
          score={dim.score}
          color="skills"
          icon="analytics"
        >
          <p className="font-body-md text-sm text-on-surface-variant">
            {dim.feedback || t('report.noFeedback')}
          </p>
        </ReportSectionCard>
      ))}
    </div>
  );
}
