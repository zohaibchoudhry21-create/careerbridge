import { Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';

export default function ProfileLayout() {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user}>
      <Outlet />
    </DashboardLayout>
  );
}
