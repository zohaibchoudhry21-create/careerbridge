import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from './icons/AppIcon';
import BrandLogo from './brand/BrandLogo';

const SOCIAL_ICONS = ['link', 'code', 'share'];

function FooterLink({ href, children }) {
  const className =
    'text-sm text-on-surface-variant hover:text-secondary transition-colors cursor-pointer';
  const isAppRoute =
    typeof href === 'string' && href.startsWith('/') && !href.includes('#');

  if (isAppRoute) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a className={className} href={href || '#'}>
      {children}
    </a>
  );
}

export default function Footer() {
  const { t } = useTranslation('marketing');
  const columns = t('footer.columns', { returnObjects: true });
  const legal = t('footer.legal', { returnObjects: true });

  return (
    <footer className="bg-surface-container-low w-full pt-xl pb-md border-t border-outline-variant reveal is-visible">
      <div className="shell-inner">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-md mb-xl">
          <div className="col-span-full sm:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <BrandLogo className="h-8 w-auto" />
            </div>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mb-4">
              {t('footer.tagline')}
            </p>
          </div>

          {Array.isArray(columns) &&
            columns.map((column) => (
              <div key={column.title}>
                <h4 className="font-label-md text-on-surface font-bold mb-4 uppercase tracking-wider">
                  {column.title}
                </h4>
                <ul className="space-y-2">
                  {column.links?.map((link) => {
                    const label = typeof link === 'string' ? link : link.label;
                    const href = typeof link === 'string' ? '#' : link.href;
                    return (
                      <li key={`${column.title}-${label}`}>
                        <FooterLink href={href}>{label}</FooterLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

          <div>
            <h4 className="font-label-md text-on-surface font-bold mb-4 uppercase tracking-wider">
              {t('footer.contact.title')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <AppIcon name="mail" size="h-4 w-4" className="text-secondary" />
                <a
                  href={`mailto:${t('footer.contact.email')}`}
                  className="text-sm text-on-surface-variant hover:text-secondary transition-colors"
                >
                  {t('footer.contact.email')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="location_on" size="h-4 w-4" className="text-secondary" />
                <span className="text-sm text-on-surface-variant">{t('footer.contact.location')}</span>
              </li>
              <li className="flex gap-3 pt-2">
                {SOCIAL_ICONS.map((icon) => (
                  <a
                    key={icon}
                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-all cursor-pointer"
                    href="#"
                  >
                    <AppIcon name={icon} size="h-3.5 w-3.5" />
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-md border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-sm text-on-surface-variant">{t('footer.copyright')}</p>
            <div className="flex gap-4">
              {Array.isArray(legal) &&
                legal.map((item) => (
                  <a
                    key={item}
                    className="text-xs text-on-surface-variant hover:text-secondary cursor-pointer"
                    href="#"
                  >
                    {item}
                  </a>
                ))}
            </div>
          </div>
          <p className="text-sm font-medium text-secondary italic">{t('footer.poweredBy')}</p>
        </div>
      </div>
    </footer>
  );
}
