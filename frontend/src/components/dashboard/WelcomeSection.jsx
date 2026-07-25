import { memo } from 'react';
import AccountIconButton from './AccountIconButton';
import AppIcon from '../icons/AppIcon';

function WelcomeSection({ welcome }) {
  if (!welcome) return null;

  return (
    <header className="flex flex-col md:flex-row md:items-start justify-between gap-sm min-w-0">
      <div className="min-w-0 flex-1">
        <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
          Welcome back, {welcome.firstName}
        </h1>
        <p className="font-body-md text-on-surface-variant mt-base">
          Your career is evolving faster than you think. Let&apos;s make today count.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-sm shrink-0 max-w-full">
        <span className="px-sm py-xs bg-surface-container-high text-secondary rounded-full font-label-sm flex items-center gap-2 max-w-full">
          <AppIcon name="history" size="h-4 w-4" />
          Last activity: {welcome.lastActivity}
        </span>
        <span className="px-sm py-xs bg-secondary-fixed text-on-secondary-fixed-variant rounded-full font-label-sm flex items-center gap-2 border border-secondary/20 max-w-full">
          AI Status: {welcome.aiStatus}
        </span>
        <AccountIconButton className="hidden lg:inline-flex" />
      </div>
    </header>
  );
}

export default memo(WelcomeSection);
