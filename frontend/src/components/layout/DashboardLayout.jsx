import { useState } from 'react';
import Sidebar from '../dashboard/Sidebar';
import BrandLogo from '../brand/BrandLogo';
import usePersistedSidebarCollapse from '../../hooks/usePersistedSidebarCollapse';
import AppIcon from '../icons/AppIcon';

const SIDEBAR_TRANSITION = 'transition-[width,padding] duration-[325ms] ease-in-out';

export default function DashboardLayout({ children, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = usePersistedSidebarCollapse();

  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleMobileSidebar = () => setMobileOpen((open) => !open);

  return (
    <div className="dashboard-shell h-screen overflow-hidden">
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center gap-3 h-14 px-4 bg-background border-b border-outline-variant">
        <button
          type="button"
          className="relative z-[60] flex items-center justify-center w-10 h-10 rounded-xl text-on-surface hover:bg-surface-container transition-colors shrink-0"
          onClick={toggleMobileSidebar}
          aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={mobileOpen}
        >
          <AppIcon name={mobileOpen ? 'close' : 'menu'} size="dashboard" />
        </button>
        <BrandLogo className="h-8 w-auto max-w-[10rem] shrink-0" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-[325ms] ease-in-out"
          onClick={closeMobileSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={[
          'lg:hidden fixed top-0 left-0 z-50 h-full max-w-[85vw] w-[15rem]',
          'flex flex-col shrink-0 bg-background border-r border-outline-variant py-sm px-sm overflow-hidden',
          'transition-transform duration-[325ms] ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar
          onNavigate={closeMobileSidebar}
          forceExpanded
          showCollapseToggle={false}
        />
      </aside>

      <aside
        className={[
          'hidden lg:flex shrink-0 h-full flex-col',
          'bg-background border-r border-outline-variant py-sm overflow-hidden',
          SIDEBAR_TRANSITION,
          collapsed ? 'w-20 px-2' : 'w-[15rem] px-sm',
        ].join(' ')}
        aria-expanded={!collapsed}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <main className="dashboard-main transition-[margin,padding] duration-[325ms] ease-in-out">
        <div className="max-w-[1280px] mx-auto w-full">{children}</div>
      </main>
    </div>
  );
}
