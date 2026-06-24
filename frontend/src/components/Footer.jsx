const footerLinks = {
  'Quick Links': ['Home', 'Features', 'Career Tools', 'Templates', 'Pricing', 'Resources'],
  'AI Features': [
    'AI Resume Builder',
    'OCR CV Scanner',
    'Voice Profile Builder',
    'Interview Analysis',
    'Salary Predictor',
  ],
  'Career Tools': [
    'LinkedIn Optimizer',
    'AI-Proof Analysis',
    'Skill Gap Analysis',
    'Smart Job Matching',
  ],
  Resources: ['Career Blog', 'Interview Tips', 'Resume Guides', 'AI Career Trends', 'Help Center'],
};

export default function Footer() {
  return (
    <footer className="bg-surface-container-low w-full pt-xl pb-md border-t border-outline-variant reveal is-visible">
      <div className="shell-inner">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-md mb-xl">
          <div className="col-span-full sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary filled">work</span>
              <span className="font-headline-md text-xl font-extrabold text-on-surface">
                AI CareerBridge
              </span>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mb-4">
              AI-powered career platform to build resumes, optimize profiles, practice interviews,
              and grow your professional future.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-label-md text-on-surface font-bold mb-4 uppercase tracking-wider">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      className="text-sm text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                      href="#"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-label-md text-on-surface font-bold mb-4 uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">mail</span>
                <span className="text-sm text-on-surface-variant">support@aicareerbridge.com</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">location_on</span>
                <span className="text-sm text-on-surface-variant">Remote • Worldwide</span>
              </li>
              <li className="flex gap-3 pt-2">
                {['link', 'code', 'share'].map((icon) => (
                  <a
                    key={icon}
                    className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-secondary hover:text-on-secondary transition-all cursor-pointer"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-md border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-sm text-on-surface-variant">© 2026 AI CareerBridge. All rights reserved.</p>
            <div className="flex gap-4">
              {['Privacy Policy', 'Terms & Conditions', 'Cookie Policy'].map((item) => (
                <a
                  key={item}
                  className="text-xs text-on-surface-variant hover:text-secondary cursor-pointer"
                  href="#"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <p className="text-sm font-medium text-secondary italic">
            Powered by AI • Built for Future Careers
          </p>
        </div>
      </div>
    </footer>
  );
}
