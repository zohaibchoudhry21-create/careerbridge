import Navbar from '../Navbar';
import AuthNav from '../auth/AuthNav';
import AuthFooter from '../auth/AuthFooter';
import LoginHero from '../auth/LoginHero';

export default function AuthLayout({
  children,
  navbar = 'auth',
  navActive = 'login',
  showHero = true,
}) {
  const useLandingNavbar = navbar === 'landing';

  return (
    <div className="app-shell">
      {useLandingNavbar ? <Navbar /> : <AuthNav active={navActive} />}
      <main className="auth-split nav-offset min-w-0 max-w-full overflow-x-hidden">
        <section className="auth-form-panel">
          <div className="auth-form-shell">{children}</div>
        </section>
        {showHero && <LoginHero />}
      </main>
      <AuthFooter />
    </div>
  );
}
