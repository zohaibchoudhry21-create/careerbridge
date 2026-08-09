import { getLucideIcon } from './iconMap';

export const ICON_SIZES = {
  sidebar: 'h-4 w-4',
  settings: 'h-8 w-8',
  dashboard: 'h-5 w-5',
  button: 'h-4 w-4',
  sm: 'h-3.5 w-3.5',
  nav: 'h-4 w-4',
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
