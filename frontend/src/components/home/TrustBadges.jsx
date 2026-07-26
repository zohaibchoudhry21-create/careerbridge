import { useTranslation } from 'react-i18next';
import SectionIcon from '../ui/SectionIcon';

const BADGE_META = [
  { icon: 'redeem', color: 'success' },
  { icon: 'shield', color: 'security' },
  { icon: 'download', color: 'resume' },
];

export default function TrustBadges() {
  const { t } = useTranslation('marketing');
  const items = t('trustBadges.items', { returnObjects: true });

  return (
    <section className="border-b border-outline-variant/20 bg-surface-container-lowest py-8">
      <div className="page-container">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {BADGE_META.map((meta, index) => {
            const badge = items[index] || {};
            return (
              <div
                key={meta.icon}
                className="flex items-center justify-center gap-4 rounded-xl bg-white p-6 shadow-sm"
              >
                <SectionIcon color={meta.color} icon={meta.icon} size="md" />
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface">{badge.title}</p>
                  <p className="font-body-md text-body-md text-sm text-on-surface-variant">
                    {badge.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
