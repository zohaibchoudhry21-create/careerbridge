import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../dashboard/Sidebar';
import BrandLogo from '../brand/BrandLogo';
import usePersistedSidebarCollapse from '../../hooks/usePersistedSidebarCollapse';
import AppIcon from '../icons/AppIcon';
import LanguageSelector from '../../i18n/components/LanguageSelector';

const SIDEBAR_TRANSITION =
  'transition-[width,padding] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]';

export default function DashboardLayout({ children }) {
  const { t } = useTranslation('common');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggleCollapsed } = usePersistedSidebarCollapse();

  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleMobileSidebar = () => setMobileOpen((open) => !open);

  return (
    <div className="dashboard-shell h-screen overflow-hidden">
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          className="relative z-[60] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-800"
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

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={closeMobileSidebar}
          aria-label={t('sidebar.closeSidebar')}
        />
      ) : null}

      <aside
        className={[
          'fixed start-0 top-0 z-50 flex h-full w-[280px] max-w-[85vw] shrink-0 flex-col',
          'border-e border-slate-200 bg-white shadow-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] lg:hidden',
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
          'hidden h-full shrink-0 flex-col overflow-hidden border-e border-slate-200 bg-white lg:flex',
          'shadow-[8px_0_30px_rgba(0,0,0,0.04)]',
          SIDEBAR_TRANSITION,
          collapsed ? 'w-[76px]' : 'w-[280px]',
        ].join(' ')}
        aria-expanded={!collapsed}
        aria-label="Dashboard navigation"
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <main className="dashboard-main transition-[margin,padding] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="mb-4 hidden justify-end lg:flex">
            <LanguageSelector />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
