import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../icons/AppIcon';

const MENU_ITEMS = [
  { id: 'settings', label: 'Settings', icon: 'settings', type: 'route', to: '/settings' },
  { id: 'help', label: 'Help', icon: 'help', type: 'placeholder', href: '#' },
  { id: 'privacy', label: 'Privacy Center', icon: 'shield', type: 'placeholder', href: '#' },
];

export default function AccountIconButton({ className = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

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
      toast.success('Logout successful');
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-high border text-on-surface-variant transition-colors ${
          open
            ? 'border-secondary/40 bg-white'
            : 'border-outline-variant/30 hover:border-secondary/40 hover:bg-white'
        }`}
      >
        <AppIcon name="person" size="nav" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(260px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-outline-variant/40 bg-white py-2 shadow-level-2"
        >
          <div className="border-b border-outline-variant/30 px-4 py-3">
            <p className="font-label-md font-bold text-on-surface truncate">{user?.email || 'Account'}</p>
          </div>

          <div className="py-1">
            {MENU_ITEMS.map((item) => {
              if (item.type === 'route') {
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate(item.to)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <AppIcon name={item.icon} size="nav" className="text-on-surface-variant" />
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
                  className="flex w-full items-center gap-3 px-4 py-2.5 font-label-md text-on-surface hover:bg-surface-container transition-colors"
                >
                  <AppIcon name={item.icon} size="nav" className="text-on-surface-variant" />
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="border-t border-outline-variant/30 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              <AppIcon name="logout" size="nav" className="text-on-surface-variant" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
