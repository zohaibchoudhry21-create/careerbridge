import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../dashboard/Sidebar';
import BrandLogo from '../brand/BrandLogo';
import usePersistedSidebarCollapse from '../../hooks/usePersistedSidebarCollapse';
import AppIcon from '../icons/AppIcon';
import LanguageSelector from '../../i18n/components/LanguageSelector';

const SIDEBAR_TRANSITION =
  'transition-[width,padding] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

export default function DashboardLayout({ children, user }) {
  const { t } = useTranslation('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = usePersistedSidebarCollapse();

  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleMobileSidebar = () => setMobileOpen((open) => !open);

  return (
    <div className="dashboard-shell h-screen overflow-hidden">
      <header className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center gap-3 h-14 px-4 bg-background/80 backdrop-blur-xl border-b border-outline-variant/50">
        <button
          type="button"
          className="relative z-[60] flex items-center justify-center w-10 h-10 rounded-2xl app-heading hover:bg-secondary/10 hover:scale-105 active:scale-95 transition-all duration-300 shrink-0"
          onClick={toggleMobileSidebar}
          aria-label={mobileOpen ? t('sidebar.closeSidebar') : t('sidebar.openSidebar')}
          aria-expanded={mobileOpen}
        >
          <AppIcon name={mobileOpen ? 'close' : 'menu'} size="dashboard" />
        </button>
        <BrandLogo className="h-8 w-auto max-w-[10rem] shrink-0" />
        <div className="ms-auto flex items-center gap-2">
          <LanguageSelector compact />
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          onClick={closeMobileSidebar}
          aria-label={t('sidebar.closeSidebar')}
        />
      )}

      <aside
        className={[
          'lg:hidden fixed top-0 start-0 z-50 h-full max-w-[85vw] w-[280px]',
          'flex flex-col shrink-0 bg-background/90 backdrop-blur-xl border-e border-outline-variant/50',
          'shadow-2xl py-sm px-sm overflow-hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          mobileOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full',
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
          'bg-background/80 backdrop-blur-xl border-e border-outline-variant/50',
          'shadow-[8px_0_30px_rgba(0,0,0,0.04)] py-sm overflow-hidden',
          SIDEBAR_TRANSITION,
          collapsed ? 'w-[76px] px-2' : 'w-[280px] px-sm',
        ].join(' ')}
        aria-expanded={!collapsed}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <main className="dashboard-main transition-[margin,padding] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="max-w-[1280px] mx-auto w-full">
          <div className="hidden lg:flex justify-end mb-4">
            <LanguageSelector />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
