import AppIcon from '../icons/AppIcon';
import { cn } from '../../lib/utils';
import { ACCENT_COLORS, SECTION_ICON_SIZES } from './colorAccentTokens';

/**
 * Round/blob-shaped colored icon badge for section headings.
 *
 * @example
 * <SectionIcon color="role" icon="person" />
 * <SectionIcon color="difficulty" icon="tune" size="lg" />
 */
export default function SectionIcon({
  color = 'role',
  icon,
  size = 'sm',
  className = '',
  iconClassName = '',
}) {
  const tintClass = ACCENT_COLORS[color] ?? ACCENT_COLORS.role;
  const sizeClass = SECTION_ICON_SIZES[size] ?? SECTION_ICON_SIZES.sm;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        sizeClass,
        tintClass,
        className
      )}
      aria-hidden
    >
      <AppIcon name={icon} size="sm" className={iconClassName} />
    </span>
  );
}
