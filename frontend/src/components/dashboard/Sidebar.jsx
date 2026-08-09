import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  LayoutGrid,
  Menu,
  Mic,
  ScanSearch,
  Settings,
} from 'lucide-react';
import { useDashboardNavItems } from '../../hooks/useDashboardNav';
import BrandLogo from '../brand/BrandLogo';

const SIDEBAR_ANIMATION =
  'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

const NAV_ICONS = {
  dashboard: LayoutGrid,
  resumeBuilder: FileText,
  resumeScanner: ScanSearch,
  interviewPrep: Mic,
  settings: Settings,
};

const ICON_CLASS = 'h-[18px] w-[18px] shrink-0';

function NavTooltip({ label, children }) {
  return (
    <div className="group/nav relative flex justify-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute start-full top-1/2 z-50 ms-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover/nav:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

function getNavClassName(isActive, collapsed) {
  const base = [
    'group/nav-item flex items-center rounded-xl text-sm',
    SIDEBAR_ANIMATION,
    collapsed
      ? 'mx-auto h-11 w-11 justify-center px-0'
      : 'h-11 w-full justify-start gap-3 px-3',
  ].join(' ');

  if (isActive) {
    return `${base} bg-blue-50 font-semibold text-blue-700`;
  }

  return `${base} font-medium text-slate-600 hover:bg-slate-50`;
}

function getIconClassName(isActive) {
  return isActive ? `${ICON_CLASS} text-blue-600` : `${ICON_CLASS} text-slate-400`;
}

function NavItem({ item, onNavigate, collapsed, matchEnd = true }) {
  const { id, label, href } = item;
  const Icon = NAV_ICONS[id];
  const isRouterLink = href.startsWith('/');

  const content = (isActive) => (
    <>
      {Icon ? (
        <Icon
          className={[getIconClassName(isActive), 'group-hover/nav-item:scale-110', SIDEBAR_ANIMATION].join(' ')}
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
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      {({ isActive }) => content(isActive)}
    </NavLink>
  ) : (
    <a
      href={href}
      onClick={onNavigate}
      className={getNavClassName(false, collapsed)}
      title={collapsed ? label : undefined}
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
            <BrandLogo className="h-7 w-auto max-w-[180px]" />
          </Link>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-100 px-2 py-3">
        <NavItem
          item={settingsItem}
          collapsed={collapsed}
          onNavigate={onNavigate}
          matchEnd={false}
        />
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
