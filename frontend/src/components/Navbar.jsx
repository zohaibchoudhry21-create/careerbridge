import { useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavbarScroll } from '../hooks/useAnimations';
import BrandLogo from './brand/BrandLogo';
import AppIcon from './icons/AppIcon';
import { buttonPrimaryClass, buttonSecondaryClass } from './ui/buttonTokens';
import { cn } from '../lib/utils';

const linkClassName =
  'text-on-surface-variant font-medium hover:text-secondary transition-colors duration-200 whitespace-nowrap nav-link-underline text-sm';

function NavLinkItem({ href, className, children, onClick }) {
  const isInternal = href.startsWith('/');

  if (isInternal) {
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
}

export default function Navbar() {
  const { t } = useTranslation('common');
  const navRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useNavbarScroll(navRef);

  const navLinks = useMemo(
    () => [
      { label: t('nav.aiResumeParsing'), href: '/register' },
      { label: t('nav.cvUpload'), href: '/register' },
      { label: t('nav.aiSuggestions'), href: '/register' },
      { label: t('nav.resumeBuilder'), href: '/register' },
    ],
    [t]
  );

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant shadow-sm"
      id="navbar"
    >
      <div className="shell-inner flex justify-between items-center h-14 min-w-0 gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 hover:scale-105 transition-transform shrink-0 min-w-0"
          onClick={closeMenu}
        >
          <BrandLogo className="h-7 w-auto" />
        </Link>

        <div className="hidden xl:flex items-center gap-4 2xl:gap-5 flex-1 justify-center min-w-0 overflow-x-auto px-2">
          {navLinks.map((link) => (
            <NavLinkItem key={link.label} href={link.href} className={linkClassName}>
              {link.label}
            </NavLinkItem>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className={cn(buttonSecondaryClass, 'px-3.5 py-1.5 text-label-md')}
          >
            {t('nav.login')}
          </Link>
          <Link
            to="/register"
            className={cn(
              buttonPrimaryClass,
              'transform whitespace-nowrap px-4 py-1.5 text-label-md shadow-level-1 hover:-translate-y-1'
            )}
          >
            {t('nav.uploadCv')}
          </Link>
        </div>

        <button
          type="button"
          className="xl:hidden relative z-[60] flex items-center justify-center w-9 h-9 rounded-lg text-on-surface hover:bg-surface-container transition-colors shrink-0"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={menuOpen}
        >
          <AppIcon name={menuOpen ? 'close' : 'menu'} size="dashboard" />
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="xl:hidden fixed inset-0 top-14 z-40 bg-black/50"
          onClick={closeMenu}
          aria-label={t('nav.closeMenu')}
        />
      )}

      <div
        className={`xl:hidden fixed top-14 right-0 z-50 h-[calc(100vh-3.5rem)] w-full max-w-sm bg-surface border-l border-outline-variant shadow-level-2 overflow-y-auto transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-1 p-4">
          {navLinks.map((link) => (
            <NavLinkItem
              key={link.label}
              href={link.href}
              className="px-3 py-3 rounded-xl text-on-surface-variant font-medium hover:text-secondary hover:bg-surface-container transition-colors"
              onClick={closeMenu}
            >
              {link.label}
            </NavLinkItem>
          ))}

          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-3">
            <Link
              to="/login"
              className={cn(buttonSecondaryClass, 'w-full justify-center px-4 py-3 text-label-md rounded-2xl')}
              onClick={closeMenu}
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className={cn(
                buttonPrimaryClass,
                'w-full justify-center px-6 py-3 text-label-md rounded-2xl shadow-level-1'
              )}
              onClick={closeMenu}
            >
              {t('nav.uploadCv')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
