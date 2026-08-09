import { useTranslation } from 'react-i18next';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

export default function ExecutiveSummaryCard({ executiveSummary }) {
  const { t } = useTranslation('interviewPrep');
  if (!executiveSummary?.summary && !executiveSummary?.headline) return null;

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="interview"
        icon="summarize"
        title={t('report.enterprise.executiveSummary')}
        alignDescription={false}
      />
      {executiveSummary.headline ? (
        <h3 className="font-headline-section text-headline-section app-heading">
          {executiveSummary.headline}
        </h3>
      ) : null}
      <p className="mt-2 font-body-md text-on-surface-variant">{executiveSummary.summary}</p>
      {Array.isArray(executiveSummary.keyTakeaways) && executiveSummary.keyTakeaways.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 font-body-md text-on-surface-variant">
          {executiveSummary.keyTakeaways.map((item, index) => (
            <li key={`takeaway-${index}`}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
