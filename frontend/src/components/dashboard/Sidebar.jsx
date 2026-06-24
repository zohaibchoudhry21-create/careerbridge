import { NavLink, Link } from 'react-router-dom';
import { DASHBOARD_NAV_ITEMS } from './dashboardConstants';
import BrandLogo from '../brand/BrandLogo';

function SidebarBrand() {
  return (
    <Link to="/" className="min-w-0 flex-1 overflow-hidden block">
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

  const linkClassName = ({ isActive } = {}) => {
    const active = typeof isActive === 'boolean' ? isActive : false;
    const base = collapsed
      ? 'flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all duration-300'
      : 'flex items-center gap-2.5 mx-1 px-3 py-2 rounded-xl transition-all duration-300 font-label-md';

    if (active) {
      return `${base} text-secondary font-bold bg-surface-container`;
    }

    return `${base} text-on-surface-variant hover:text-secondary hover:bg-surface-container`;
  };

  const content = (
    <>
      <span className="material-symbols-outlined shrink-0 text-[20px]">{icon}</span>
      {!collapsed && <span className="truncate min-w-0">{label}</span>}
    </>
  );

  const link = isRouterLink ? (
    <NavLink key={id} to={href} end className={linkClassName} onClick={onNavigate} title={collapsed ? label : undefined}>
      {content}
    </NavLink>
  ) : (
    <a
      key={id}
      href={href}
      className={linkClassName()}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
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
        className={`mb-sm shrink-0 flex items-center gap-2 min-h-10 ${
          collapsed ? 'justify-center px-0' : 'px-1'
        }`}
      >
        {showCollapseToggle ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors duration-300"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        ) : null}
        {!collapsed ? <SidebarBrand /> : null}
      </div>

      <nav className={`flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'px-0' : ''}`}>
        {DASHBOARD_NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className={`mt-auto shrink-0 ${collapsed ? 'flex justify-center pt-2' : 'px-xs'}`}>
        {collapsed ? (
          <NavTooltip label="Upgrade to Pro">
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white dashboard-btn-glow transition-all duration-300"
              aria-label="Upgrade to Pro"
            >
              <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            </button>
          </NavTooltip>
        ) : (
          <button
            type="button"
            className="w-full py-2.5 bg-secondary text-white rounded-2xl font-label-md dashboard-btn-glow transition-all duration-300"
          >
            Upgrade to Pro
          </button>
        )}
      </div>
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
    <div className="flex flex-col h-full min-h-0 w-full">
      <SidebarContent
        collapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onNavigate={onNavigate}
        showCollapseToggle={showCollapseToggle}
      />
    </div>
  );
}
