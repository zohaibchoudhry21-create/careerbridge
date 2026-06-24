import { useState } from 'react';
import Sidebar from '../dashboard/Sidebar';
import FloatingAIAssistant from '../dashboard/FloatingAIAssistant';
import BrandLogo from '../brand/BrandLogo';
import usePersistedSidebarCollapse from '../../hooks/usePersistedSidebarCollapse';

const SIDEBAR_EXPANDED_WIDTH = 'w-[15rem]'; // 240px
const SIDEBAR_COLLAPSED_WIDTH = 'w-20'; // 80px

const sidebarPanelBase =
  'flex flex-col shrink-0 h-full bg-background border-r border-outline-variant py-sm transition-[width] duration-300 ease-in-out';

export default function DashboardLayout({ children, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = usePersistedSidebarCollapse();

  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleMobileSidebar = () => setMobileOpen((open) => !open);

  const desktopSidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;
  const desktopSidebarPadding = collapsed ? 'px-2' : 'px-sm';

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
          <span className="material-symbols-outlined text-2xl">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
        <BrandLogo className="h-8 w-auto max-w-[10rem] shrink-0" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={closeMobileSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full max-w-[85vw] ${SIDEBAR_EXPANDED_WIDTH} ${sidebarPanelBase} px-sm transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          onNavigate={closeMobileSidebar}
          forceExpanded
          showCollapseToggle={false}
        />
      </aside>

      <aside
        className={`hidden lg:flex shrink-0 h-full ${sidebarPanelBase} ${desktopSidebarWidth} ${desktopSidebarPadding}`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <main className="dashboard-main flex-1 min-h-0 overflow-y-auto pt-14 lg:pt-0 transition-[margin] duration-300 ease-in-out">
        <div className="max-w-[1280px] mx-auto w-full">{children}</div>
      </main>

      <FloatingAIAssistant />
    </div>
  );
}
