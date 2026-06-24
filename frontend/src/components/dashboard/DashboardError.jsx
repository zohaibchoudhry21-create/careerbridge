function DashboardError({ message, onRetry }) {
  return (
    <div className="dashboard-glass-card dashboard-card-padding rounded-2xl text-center max-w-lg mx-auto my-md">
      <span className="material-symbols-outlined text-error text-3xl mb-sm">error</span>
      <p className="font-headline-section text-headline-section mb-xs">Unable to load dashboard</p>
      <p className="font-body-md text-on-surface-variant mb-md">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-3 bg-secondary text-white rounded-2xl font-label-md dashboard-btn-glow"
      >
        Try Again
      </button>
    </div>
  );
}

export default DashboardError;
