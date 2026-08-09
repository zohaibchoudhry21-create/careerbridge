import Skeleton from '../Skeleton';

function DashboardLoading() {
  return (
    <div className="space-y-8 px-1 py-2">
      <Skeleton type="text" lines={2} label="Loading dashboard welcome" />
      <Skeleton type="list" count={3} label="Loading quick actions" />

      <div className="space-y-4">
        <Skeleton type="text" lines={1} label="Loading resume builder section" />
        <Skeleton type="list" count={3} label="Loading resume builder links" />
      </div>

      <div className="space-y-4">
        <Skeleton type="text" lines={1} label="Loading resume scanner section" />
        <Skeleton type="card" count={1} withMedia={false} lines={5} label="Loading resume scanner" />
      </div>

      <div className="space-y-4">
        <Skeleton type="text" lines={1} label="Loading interview prep section" />
        <Skeleton type="card" count={1} withMedia={false} lines={3} label="Loading interview readiness" />
      </div>
    </div>
  );
}

export default DashboardLoading;
