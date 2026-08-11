import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BrandLogo from '../brand/BrandLogo';
import LanguageSelector from '../../i18n/components/LanguageSelector';

const AUTH_NAV_LINKS = [
  { key: 'features', href: '/#features' },
  { key: 'howItWorks', href: '/#tools' },
  { key: 'solution', href: '/#templates' },
  { key: 'getStarted', href: '/#resources' },
];

export default function AuthNav({ active = 'login' }) {
  const { t } = useTranslation('auth');

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="shell-inner flex justify-between items-center h-20">
        <Link to="/" className="flex items-center">
          <BrandLogo className="h-8 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-lg">
          {AUTH_NAV_LINKS.map((link) => (
            <a
              key={link.key}
              className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200"
              href={link.href}
            >
              {t(`nav.${link.key}`)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-md">
          <LanguageSelector />
          <Link
            to="/login"
            className={`font-label-md text-label-md transition-colors duration-200 ${
              active === 'login'
                ? 'text-secondary font-bold border-b-2 border-secondary'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            {t('nav.logIn')}
          </Link>
          <Link
            to="/register"
            className="bg-secondary text-on-secondary px-6 py-2 rounded-2xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all"
          >
            {t('nav.signUp')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
