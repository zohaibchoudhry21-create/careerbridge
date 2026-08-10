import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNavbarScroll } from '../hooks/useAnimations';
import useAuth from '../hooks/useAuth';
import BrandLogo from './brand/BrandLogo';
import AppIcon from './icons/AppIcon';
import { buttonSecondaryClass } from './ui/buttonTokens';
import { cn } from '../lib/utils';
import LanguageSelector from '../i18n/components/LanguageSelector';

const triggerClassName =
  'inline-flex items-center gap-1 py-1 text-sm font-medium text-on-surface-variant whitespace-nowrap transition-colors duration-200 hover:text-secondary';

const navActionClass =
  'px-3.5 py-1.5 text-label-md transition-transform duration-200 hover:-translate-y-0.5';

function NavFeatureDropdown({ id, label, items, openId, setOpenId }) {
  const open = openId === id;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenId(null);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, setOpenId]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpenId(id)}
      onMouseLeave={() => setOpenId(null)}
    >
      <button
        type="button"
        className={cn(triggerClassName, open && 'text-secondary')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
      >
        {label}
        <AppIcon
          name="expand_more"
          size="h-4 w-4"
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open ? (
        <div className="absolute start-0 top-full z-50 pt-1">
          <ul
            role="menu"
            className="min-w-[13.5rem] overflow-hidden rounded-xl border border-outline-variant/40 bg-white py-1 shadow-level-2"
          >
            {items.map((item) => (
              <li key={item.href} role="none">
                <Link
                  role="menuitem"
                  to={item.href}
                  className="flex w-full items-center px-3.5 py-2.5 text-start text-sm font-medium text-on-surface transition-colors hover:bg-surface-container hover:text-secondary"
                  onClick={() => setOpenId(null)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function MobileFeatureGroup({ label, items, open, onToggle, onNavigate }) {
  return (
    <div className="rounded-xl">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-start font-medium text-on-surface-variant hover:bg-surface-container hover:text-secondary transition-colors"
        aria-expanded={open}
        onClick={onToggle}
      >
        {label}
        <AppIcon
          name="expand_more"
          size="h-4 w-4"
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div className="mb-1 ms-2 flex flex-col gap-0.5 border-s border-outline-variant/40 ps-2">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-secondary transition-colors"
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const { t } = useTranslation('common');
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [mobileOpenId, setMobileOpenId] = useState(null);
  useNavbarScroll(navRef);

  const showGuestActions = !authLoading && !isAuthenticated;
  const showAuthActions = !authLoading && isAuthenticated;

  const featureMenus = useMemo(
    () => [
      {
        id: 'resumeBuilder',
        label: t('nav.resumeBuilder'),
        items: [
          { label: t('nav.dropdowns.resumeBuilder.upload'), href: '/resume/upload' },
          { label: t('nav.dropdowns.resumeBuilder.history'), href: '/resume/history' },
          { label: t('nav.dropdowns.resumeBuilder.templates'), href: '/resume/templates' },
        ],
      },
      {
        id: 'resumeScanner',
        label: t('nav.resumeScanner'),
        items: [
          { label: t('nav.dropdowns.resumeScanner.scan'), href: '/resume-scanner' },
        ],
      },
      {
        id: 'interviewPrep',
        label: t('nav.interviewPrep'),
        items: [
          { label: t('nav.dropdowns.interviewPrep.overview'), href: '/interview-prep' },
          { label: t('nav.dropdowns.interviewPrep.mock'), href: '/interview-prep/mock' },
          { label: t('nav.dropdowns.interviewPrep.skills'), href: '/interview-prep/skills' },
        ],
      },
    ],
    [t]
  );

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMobileOpenId(null);
    setOpenDropdownId(null);
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant shadow-sm"
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

        <div className="hidden xl:flex flex-1 items-center justify-center gap-6 min-w-0 px-2 overflow-visible">
          {featureMenus.map((menu) => (
            <NavFeatureDropdown
              key={menu.id}
              id={menu.id}
              label={menu.label}
              items={menu.items}
              openId={openDropdownId}
              setOpenId={setOpenDropdownId}
            />
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
          <LanguageSelector />
          {showAuthActions ? (
            <Link
              to="/dashboard"
              className={cn(buttonSecondaryClass, navActionClass, 'whitespace-nowrap')}
            >
              {t('nav.dashboard')}
            </Link>
          ) : null}
          {showGuestActions ? (
            <>
              <Link to="/login" className={cn(buttonSecondaryClass, navActionClass)}>
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className={cn(buttonSecondaryClass, navActionClass, 'whitespace-nowrap')}
              >
                {t('nav.signup')}
              </Link>
            </>
          ) : null}
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
        className={cn(
          'xl:hidden fixed top-14 end-0 z-50 h-[calc(100vh-3.5rem)] w-full max-w-sm bg-surface border-s border-outline-variant shadow-level-2 overflow-y-auto transition-transform duration-300 ease-in-out',
          menuOpen
            ? 'translate-x-0 pointer-events-auto'
            : 'ltr:translate-x-full rtl:-translate-x-full pointer-events-none'
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          <div className="px-3 py-2 flex items-center gap-2">
            <LanguageSelector className="flex-1" />
          </div>

          {featureMenus.map((menu) => (
            <MobileFeatureGroup
              key={menu.id}
              label={menu.label}
              items={menu.items}
              open={mobileOpenId === menu.id}
              onToggle={() =>
                setMobileOpenId((current) => (current === menu.id ? null : menu.id))
              }
              onNavigate={closeMenu}
            />
          ))}

          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-3">
            {showAuthActions ? (
              <Link
                to="/dashboard"
                className={cn(
                  buttonSecondaryClass,
                  'w-full justify-center px-6 py-3 text-label-md rounded-2xl shadow-level-1'
                )}
                onClick={closeMenu}
              >
                {t('nav.dashboard')}
              </Link>
            ) : null}
            {showGuestActions ? (
              <>
                <Link
                  to="/login"
                  className={cn(
                    buttonSecondaryClass,
                    'w-full justify-center px-4 py-3 text-label-md rounded-2xl'
                  )}
                  onClick={closeMenu}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    buttonSecondaryClass,
                    'w-full justify-center px-6 py-3 text-label-md rounded-2xl shadow-level-1'
                  )}
                  onClick={closeMenu}
                >
                  {t('nav.signup')}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
