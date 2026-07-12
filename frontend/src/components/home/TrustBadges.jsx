import AppIcon from '../icons/AppIcon';

const badges = [
  {
    icon: 'redeem',
    title: 'Your First Resume Is Free',
    subtitle: 'No credit card required',
  },
  {
    icon: 'shield',
    title: 'Privacy & GDPR Compliant',
    subtitle: 'Your data stays yours',
  },
  {
    icon: 'download',
    title: 'Unlimited PDF Downloads',
    subtitle: 'No watermarks, ever',
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-surface-container-lowest border-b border-outline-variant/20 py-8">
      <div className="page-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-4 justify-center bg-white rounded-xl shadow-sm p-6"
            >
              <AppIcon name={badge.icon} size="h-8 w-8" className="text-secondary" />
              <div className="min-w-0">
                <p className="font-label-md text-label-md text-on-surface">{badge.title}</p>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
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
