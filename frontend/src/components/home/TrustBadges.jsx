import SectionIcon from '../ui/SectionIcon';

const badges = [
  {
    icon: 'redeem',
    color: 'success',
    title: 'Your First Resume Is Free',
    subtitle: 'No credit card required',
  },
  {
    icon: 'shield',
    color: 'security',
    title: 'Privacy & GDPR Compliant',
    subtitle: 'Your data stays yours',
  },
  {
    icon: 'download',
    color: 'resume',
    title: 'Unlimited PDF Downloads',
    subtitle: 'No watermarks, ever',
  },
];

export default function TrustBadges() {
  return (
    <section className="border-b border-outline-variant/20 bg-surface-container-lowest py-8">
      <div className="page-container">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center justify-center gap-4 rounded-xl bg-white p-6 shadow-sm"
            >
              <SectionIcon color={badge.color} icon={badge.icon} size="md" />
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface">{badge.title}</p>
                <p className="font-body-md text-body-md text-sm text-on-surface-variant">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
