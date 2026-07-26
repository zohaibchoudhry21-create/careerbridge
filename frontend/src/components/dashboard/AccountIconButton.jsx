import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../icons/AppIcon';

export default function AccountIconButton({ className = '' }) {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const menuItems = useMemo(
    () => [
      { id: 'settings', label: t('accountMenu.settings'), icon: 'settings', type: 'route', to: '/settings' },
      { id: 'help', label: t('accountMenu.help'), icon: 'help', type: 'placeholder', href: '#' },
      { id: 'privacy', label: t('accountMenu.privacyCenter'), icon: 'shield', type: 'placeholder', href: '#' },
    ],
    [t]
  );

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        closeMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeMenu]);

  const handleToggle = () => {
    setOpen((current) => !current);
  };

  const handleNavigate = (path) => {
    closeMenu();
    navigate(path);
  };

  const handleLogout = async () => {
    closeMenu();

    try {
      await logout();
      toast.success(t('accountMenu.logoutSuccess'));
    } catch {
      toast.error(t('accountMenu.logoutFailed'));
    }
  };

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t('accountMenu.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high border text-on-surface-variant transition-colors dark:bg-[#243044] dark:text-[#cbd5e1] dark:border-[#334155] ${
          open
            ? 'border-secondary/40 bg-white dark:bg-[#2d3a4f] dark:border-secondary/50'
            : 'border-outline-variant/30 hover:border-secondary/40 hover:bg-white dark:hover:bg-[#2d3a4f]'
        }`}
      >
        <AppIcon name="person" size="nav" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('accountMenu.label')}
          className="absolute end-0 top-full z-50 mt-2 w-[min(260px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-outline-variant/40 bg-white dark:bg-[#1a2332] dark:border-[#334155] py-2 shadow-level-2"
        >
          <div className="border-b border-outline-variant/30 dark:border-[#334155] px-4 py-3">
            <p className="font-label-md font-bold text-on-surface dark:text-[#eaf1ff] truncate">
              {user?.email || t('accountMenu.account')}
            </p>
          </div>

          <div className="py-1">
            {menuItems.map((item) => {
              if (item.type === 'route') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate(item.to)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-start font-label-md text-on-surface dark:text-[#eaf1ff] hover:bg-surface-container dark:hover:bg-[#243044] transition-colors"
                  >
                    <AppIcon name={item.icon} size="nav" className="text-on-surface-variant dark:text-[#94a3b8]" />
                    {item.label}
                  </button>
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  onClick={closeMenu}
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-label-md text-on-surface dark:text-[#eaf1ff] hover:bg-surface-container dark:hover:bg-[#243044] transition-colors"
                >
                  <AppIcon name={item.icon} size="nav" className="text-on-surface-variant" />
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="border-t border-outline-variant/30 dark:border-[#334155] py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-start font-label-md text-on-surface dark:text-[#eaf1ff] hover:bg-surface-container dark:hover:bg-[#243044] transition-colors"
            >
              <AppIcon name="logout" size="nav" className="text-on-surface-variant dark:text-[#94a3b8]" />
              {t('accountMenu.signOut')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
