import { useTranslation } from 'react-i18next';
import AppIcon from '../icons/AppIcon';
import BrandLogo from '../brand/BrandLogo';

const LEGAL_LINK_KEYS = ['privacyPolicy', 'termsOfService', 'security'];
const SUPPORT_LINK_KEYS = ['helpCenter', 'careerBlog', 'contactUs'];

export default function AuthFooter() {
  const { t } = useTranslation('auth');

  return (
    <footer className="w-full bg-tertiary-container text-on-tertiary-container">
      <div className="shell-inner py-xl grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="space-y-sm">
          <BrandLogo variant="onDark" className="h-8 w-auto" />
          <p className="text-on-tertiary-container/80 font-body-md text-body-md max-w-sm">
            {t('footer.tagline')}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-tertiary-container mb-2">
            {t('footer.legal')}
          </span>
          {LEGAL_LINK_KEYS.map((key) => (
            <a
              key={key}
              className="font-body-md text-body-md text-on-tertiary-container/80 hover:text-surface-bright transition-all"
              href="#"
            >
              {t(`footer.${key}`)}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-tertiary-container mb-2">
            {t('footer.support')}
          </span>
          {SUPPORT_LINK_KEYS.map((key) => (
            <a
              key={key}
              className="font-body-md text-body-md text-on-tertiary-container/80 hover:text-surface-bright transition-all"
              href="#"
            >
              {t(`footer.${key}`)}
            </a>
          ))}
        </div>
        <div className="space-y-md">
          <p className="font-body-md text-body-md text-on-tertiary-container/80">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-4">
            <AppIcon
              name="public"
              size="nav"
              className="cursor-pointer hover:text-surface-bright"
            />
            <AppIcon
              name="alternate_email"
              size="nav"
              className="cursor-pointer hover:text-surface-bright"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
