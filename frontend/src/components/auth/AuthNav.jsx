import { Link } from 'react-router-dom';
import LanguageSelector from '../../i18n/components/LanguageSelector';

export default function AuthNav({ active = 'login' }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 shadow-sm">
      <div className="shell-inner flex justify-between items-center h-20">
        <Link to="/" className="flex items-center gap-sm">
          <span className="font-display-lg-mobile text-display-lg-mobile font-extrabold text-on-surface">
            Career Bridge
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-lg">
          <a
            className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200"
            href="/#features"
          >
            Features
          </a>
          <a
            className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200"
            href="/#tools"
          >
            Career Tools
          </a>
          <a
            className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200"
            href="/#templates"
          >
            Templates
          </a>
          <a
            className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors duration-200"
            href="/#resources"
          >
            Resources
          </a>
        </div>

        <div className="flex items-center gap-md">
          <LanguageSelector />
          <Link
            to="/login"
            className={`font-label-md text-label-md transition-colors duration-200 ${
              active === 'login'
                ? 'text-secondary font-bold border-b-2 border-secondary'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="bg-secondary text-on-secondary px-6 py-2 rounded-2xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
