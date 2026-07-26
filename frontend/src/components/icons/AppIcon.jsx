import { getLucideIcon } from './iconMap';

export const ICON_SIZES = {
  sidebar: 'h-5 w-5',
  settings: 'h-9 w-9',
  dashboard: 'h-6 w-6',
  button: 'h-[18px] w-[18px]',
  sm: 'h-4 w-4',
  nav: 'h-5 w-5',
};

export default function AppIcon({
  name,
  icon: IconComponent,
  size = 'button',
  className = '',
  spin = false,
  ...props
}) {
  const Icon = IconComponent || (name ? getLucideIcon(name) : null);

  if (!Icon) {
    return null;
  }

  const sizeClass =
    typeof size === 'string' && ICON_SIZES[size] ? ICON_SIZES[size] : size;

  return (
    <Icon
      className={`shrink-0 ${sizeClass} ${spin ? 'animate-spin' : ''} ${className}`.trim()}
      aria-hidden={props['aria-hidden'] ?? true}
      {...props}
    />
  );
}
