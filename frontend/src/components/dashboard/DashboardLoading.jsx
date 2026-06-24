function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      <p className="font-body-md text-on-surface-variant">Loading your dashboard...</p>
    </div>
  );
}

export default DashboardLoading;
