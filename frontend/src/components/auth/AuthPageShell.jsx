import { Link } from 'react-router-dom';

export default function AuthPageShell({ children, wide = false }) {
  return (
    <div className="login-page-bg relative min-h-screen overflow-hidden text-on-background">
      <div className="login-page-wave login-page-wave--one" aria-hidden="true" />
      <div className="login-page-wave login-page-wave--two" aria-hidden="true" />
      <div className="login-page-wave login-page-wave--three" aria-hidden="true" />

      <svg
        className="login-page-wave-curve pointer-events-none absolute inset-x-0 bottom-[18%] z-[1] h-[220px] w-full sm:bottom-[16%] sm:h-[260px]"
        viewBox="0 0 1440 260"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,120 C360,200 720,40 1080,100 C1260,140 1380,160 1440,130 L1440,260 L0,260 Z"
          fill="rgba(173, 198, 255, 0.45)"
        />
        <path
          d="M0,150 C420,80 780,200 1140,130 C1290,105 1380,115 1440,140 L1440,260 L0,260 Z"
          fill="rgba(33, 112, 228, 0.22)"
        />
        <path
          d="M0,180 C480,240 900,100 1440,170 L1440,260 L0,260 Z"
          fill="rgba(0, 88, 190, 0.35)"
        />
      </svg>

      <div className="login-page-dark-base pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42%]" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="login-page-logo mb-8 inline-flex items-center justify-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-secondary filled text-4xl">work</span>
          <span className="font-headline-md text-headline-md font-extrabold text-on-surface">
            AI CareerBridge
          </span>
        </Link>

        <div
          className={`login-page-card w-full animate-[loginFadeIn_0.6s_ease-out] ${
            wide ? 'max-w-[480px]' : 'max-w-[440px]'
          }`}
        >
          {children}
        </div>

        <footer className="login-page-footer mt-10 text-center text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <a href="#" className="transition-colors hover:text-white">
              Support
            </a>
            <span aria-hidden="true">•</span>
            <a href="#" className="transition-colors hover:text-white">
              Terms
            </a>
            <span aria-hidden="true">•</span>
            <a href="#" className="transition-colors hover:text-white">
              Privacy
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
