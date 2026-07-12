import AppIcon from '../icons/AppIcon';

export default function AuthFooter() {
  return (
    <footer className="w-full bg-tertiary-container text-on-tertiary-container">
      <div className="shell-inner py-xl grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="space-y-sm">
          <span className="font-headline-md text-headline-md font-bold text-on-tertiary-container">
            Career Bridge
          </span>
          <p className="text-on-tertiary-container/80 font-body-md text-body-md max-w-sm">
            Empowering the next generation of global leaders with AI-driven career acceleration.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-tertiary-container mb-2">Legal</span>
          {['Privacy Policy', 'Terms of Service', 'Security'].map((item) => (
            <a
              key={item}
              className="font-body-md text-body-md text-on-tertiary-container/80 hover:text-surface-bright transition-all"
              href="#"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-label-md text-label-md text-on-tertiary-container mb-2">Support</span>
          {['Help Center', 'Career Blog', 'Contact Us'].map((item) => (
            <a
              key={item}
              className="font-body-md text-body-md text-on-tertiary-container/80 hover:text-surface-bright transition-all"
              href="#"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="space-y-md">
          <p className="font-body-md text-body-md text-on-tertiary-container/80">
            © 2024 Career Bridge AI. All rights reserved.
          </p>
          <div className="flex gap-4">
            <AppIcon
              name="public"
              size="nav"
              className="cursor-pointer hover:text-surface-bright"
            />
            <AppIcon
              name="alternate_email"
              size="nav"
              className="cursor-pointer hover:text-surface-bright"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
