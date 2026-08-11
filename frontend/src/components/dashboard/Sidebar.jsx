import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Mic,
  ScanSearch,
  Settings,
} from 'lucide-react';
import { useDashboardNavItems } from '../../hooks/useDashboardNav';
import useAuth from '../../hooks/useAuth';
import BrandLogo from '../brand/BrandLogo';
import SignOutDialog from './SignOutDialog';

const SIDEBAR_ANIMATION =
  'transition-[width,opacity,max-width] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

const NAV_ITEM_TRANSITION = 'transition-colors duration-200';

const NAV_ICONS = {
  dashboard: LayoutGrid,
  resumeBuilder: FileText,
  resumeScanner: ScanSearch,
  interviewPrep: Mic,
  settings: Settings,
};

const ICON_CLASS = 'h-[18px] w-[18px] shrink-0';

function NavTooltip({ label, children }) {
  const anchorRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, isRtl: false });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const isRtl = document.documentElement.dir === 'rtl';
    const gap = 10;

    setPosition({
      top: rect.top + rect.height / 2,
      left: isRtl ? rect.left - gap : rect.right + gap,
      isRtl,
    });
  }, []);

  const showTooltip = () => {
    updatePosition();
    setVisible(true);
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  return (
    <>
      <div
        ref={anchorRef}
        className="flex justify-center"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {visible
        ? createPortal(
            <span
              role="tooltip"
              style={{
                top: position.top,
                left: position.left,
                transform: position.isRtl ? 'translate(-100%, -50%)' : 'translateY(-50%)',
              }}
              className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </>
  );
}

function getNavClassName(isActive, collapsed) {
  const base = [
    'group/nav-item flex items-center rounded-xl text-sm',
    NAV_ITEM_TRANSITION,
    collapsed
      ? 'mx-auto w-11 justify-center px-0 py-2'
      : 'w-full justify-start gap-3 px-3 py-2',
  ].join(' ');

  if (isActive) {
    return `${base} bg-blue-50 font-semibold text-blue-700`;
  }

  return `${base} font-medium text-slate-600 hover:bg-slate-50`;
}

function getIconClassName(isActive) {
  return isActive ? `${ICON_CLASS} text-blue-600` : `${ICON_CLASS} text-slate-400`;
}

function getSignOutClassName(collapsed) {
  return [
    'group/sign-out flex items-center rounded-xl text-sm font-medium text-slate-600',
    'hover:bg-red-50 hover:text-red-600',
    NAV_ITEM_TRANSITION,
    collapsed
      ? 'mx-auto w-11 justify-center px-0 py-2'
      : 'w-full justify-start gap-3 px-3 py-2',
  ].join(' ');
}

function SignOutButton({ collapsed, onNavigate }) {
  const { t } = useTranslation(['common', 'settings']);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const label = t('accountMenu.signOut');

  const handleConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setDialogOpen(false);
      onNavigate?.();
      toast.success(t('account.signOut.success', { ns: 'settings' }));
      navigate('/', { replace: true });
    } catch {
      toast.error(t('accountMenu.logoutFailed'));
    } finally {
      setLoggingOut(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={() => setDialogOpen(true)}
      className={getSignOutClassName(collapsed)}
      aria-label={label}
    >
      <LogOut
        className={[
          ICON_CLASS,
          'text-slate-400 transition-colors duration-200 group-hover/sign-out:text-red-500',
        ].join(' ')}
        strokeWidth={2}
        aria-hidden
      />
      <span
        className={[
          'block min-w-0 truncate whitespace-nowrap',
          SIDEBAR_ANIMATION,
          collapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto opacity-100',
        ].join(' ')}
        aria-hidden={collapsed}
      >
        {label}
      </span>
    </button>
  );

  return (
    <>
      {collapsed ? <NavTooltip label={label}>{button}</NavTooltip> : button}

      <SignOutDialog
        open={dialogOpen}
        loading={loggingOut}
        userEmail={user?.email}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!loggingOut) setDialogOpen(false);
        }}
      />
    </>
  );
}

function NavItem({ item, onNavigate, collapsed, matchEnd = true }) {
  const { id, label, href } = item;
  const Icon = NAV_ICONS[id];
  const isRouterLink = href.startsWith('/');

  const content = (isActive) => (
    <>
      {Icon ? (
        <Icon
          className={[getIconClassName(isActive), 'transition-colors duration-200'].join(' ')}
          strokeWidth={2}
          aria-hidden
        />
      ) : null}
      <span
        className={[
          'block min-w-0 truncate whitespace-nowrap',
          SIDEBAR_ANIMATION,
          collapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto opacity-100',
        ].join(' ')}
        aria-hidden={collapsed}
      >
        {label}
      </span>
    </>
  );

  const link = isRouterLink ? (
    <NavLink
      to={href}
      end={matchEnd}
      onClick={onNavigate}
      className={({ isActive }) => getNavClassName(isActive, collapsed)}
      aria-label={collapsed ? label : undefined}
    >
      {({ isActive }) => content(isActive)}
    </NavLink>
  ) : (
    <a
      href={href}
      onClick={onNavigate}
      className={getNavClassName(false, collapsed)}
      aria-label={collapsed ? label : undefined}
    >
      {content(false)}
    </a>
  );

  if (collapsed) {
    return <NavTooltip label={label}>{link}</NavTooltip>;
  }

  return link;
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavigate,
  showCollapseToggle = true,
}) {
  const { t } = useTranslation('common');
  const navItems = useDashboardNavItems();

  const settingsItem = {
    id: 'settings',
    label: t('accountMenu.settings'),
    href: '/settings',
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div
        className={[
          'flex shrink-0 items-center border-b border-slate-100 py-3',
          SIDEBAR_ANIMATION,
          collapsed ? 'justify-center px-2' : 'gap-2 px-3',
        ].join(' ')}
      >
        {showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={[
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600',
              'transition-all duration-300 hover:bg-slate-100 hover:text-slate-900',
              'active:scale-95',
            ].join(' ')}
            aria-label={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
            aria-expanded={!collapsed}
          >
            <Menu
              className={['h-5 w-5', collapsed ? 'rotate-180' : '', 'transition-transform duration-300'].join(' ')}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        ) : null}

        <div
          className={[
            'min-w-0 overflow-hidden',
            SIDEBAR_ANIMATION,
            collapsed ? 'w-0 max-w-0 opacity-0' : 'w-auto flex-1 opacity-100',
          ].join(' ')}
          aria-hidden={collapsed}
        >
          <Link to="/" className="inline-block min-w-0" onClick={onNavigate}>
            <BrandLogo className="h-7 w-auto max-w-[168px]" />
          </Link>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-slate-100 px-2 py-3">
        <NavItem
          item={settingsItem}
          collapsed={collapsed}
          onNavigate={onNavigate}
          matchEnd={false}
        />
        <SignOutButton collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  forceExpanded = false,
  showCollapseToggle = true,
}) {
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <SidebarContent
      collapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onNavigate={onNavigate}
      showCollapseToggle={showCollapseToggle}
    />
  );
}
