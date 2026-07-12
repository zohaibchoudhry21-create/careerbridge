import { NavLink, Link } from 'react-router-dom';
import { DASHBOARD_NAV_ITEMS } from './dashboardConstants';
import BrandLogo from '../brand/BrandLogo';
import AppIcon from '../icons/AppIcon';

const SIDEBAR_ANIMATION = 'transition-all duration-[325ms] ease-in-out';

function SidebarBrand() {
  return (
    <Link to="/" className="min-w-0 block">
      <BrandLogo className="h-7 w-auto max-w-[180px]" />
    </Link>
  );
}

function NavTooltip({ label, children }) {
  return (
    <div className="relative group/nav flex justify-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-on-surface px-2.5 py-1.5 font-label-sm text-surface opacity-0 shadow-md transition-opacity duration-200 group-hover/nav:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}

function NavItem({ item, collapsed, onNavigate }) {
  const { id, label, icon, href } = item;
  const isRouterLink = href.startsWith('/');

  const getLinkClassName = ({ isActive } = {}) => {
    const active = typeof isActive === 'boolean' ? isActive : false;
    const base = [
      'group/nav-item flex items-center h-12 rounded-xl font-label-md',
      SIDEBAR_ANIMATION,
      collapsed ? 'w-12 mx-auto justify-center px-0' : 'mx-1 w-[calc(100%-8px)] justify-start gap-2.5 px-3',
    ].join(' ');

    if (active) {
      return `${base} text-secondary font-bold bg-surface-container`;
    }

    return `${base} text-on-surface-variant hover:text-secondary hover:bg-surface-container`;
  };

  const content = (
    <>
      <AppIcon name={icon} size="sidebar" className={SIDEBAR_ANIMATION} />
      <span
        className={[
          'block min-w-0 overflow-hidden whitespace-nowrap origin-left',
          SIDEBAR_ANIMATION,
          collapsed
            ? 'w-0 max-w-0 opacity-0 scale-95 -translate-x-2'
            : 'w-auto max-w-[11rem] opacity-100 scale-100 translate-x-0',
        ].join(' ')}
        aria-hidden={collapsed}
      >
        {label}
      </span>
    </>
  );

  const link = isRouterLink ? (
    <NavLink
      key={id}
      to={href}
      end
      className={getLinkClassName}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      {content}
    </NavLink>
  ) : (
    <a
      key={id}
      href={href}
      className={getLinkClassName()}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
    >
      {content}
    </a>
  );

  if (collapsed) {
    return <NavTooltip label={label}>{link}</NavTooltip>;
  }

  return link;
}

function SidebarContent({ collapsed, onToggleCollapse, onNavigate, showCollapseToggle = true }) {
  return (
    <>
      <div
        className={[
          'mb-sm shrink-0 flex items-center min-h-10 overflow-hidden',
          SIDEBAR_ANIMATION,
          collapsed ? 'justify-center gap-0 px-0' : 'gap-2 px-1',
        ].join(' ')}
      >
        {showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container ${SIDEBAR_ANIMATION}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <AppIcon name="menu" size="dashboard" />
          </button>
        ) : null}
        <div
          className={[
            'min-w-0 overflow-hidden origin-left',
            SIDEBAR_ANIMATION,
            collapsed
              ? 'w-0 max-w-0 flex-[0] opacity-0 scale-95 -translate-x-4'
              : 'w-auto max-w-[180px] flex-1 opacity-100 scale-100 translate-x-0',
          ].join(' ')}
          aria-hidden={collapsed}
        >
          <SidebarBrand />
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden">
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
    </>
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
    <div className="flex flex-col h-full min-h-0 w-full overflow-hidden">
      <SidebarContent
        collapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onNavigate={onNavigate}
        showCollapseToggle={showCollapseToggle}
      />
    </div>
  );
}
