import { AuthLayout } from '../components/layout';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  return (
    <AuthLayout navbar="landing">
      <LoginForm />
    </AuthLayout>
  );
}
