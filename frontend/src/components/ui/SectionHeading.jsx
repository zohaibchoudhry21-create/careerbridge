import { cn } from '../../lib/utils';
import SectionIcon from './SectionIcon';

/**
 * Section heading row: colored icon badge + title + optional description.
 * Matches the Customize Interview (Mock Interview Setup) section header pattern.
 *
 * @example
 * <SectionHeading color="time" icon="hourglass_top" title="Time" description="How long the session runs." />
 */
export default function SectionHeading({
  color = 'role',
  icon,
  title,
  description,
  optional = false,
  alignDescription = true,
  className = '',
  titleClassName = '',
}) {
  const descriptionPad = alignDescription ? 'ps-[42px]' : '';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon color={color} icon={icon} />
          <h2
            className={cn(
              'font-headline-section text-headline-section app-heading',
              titleClassName
            )}
          >
            {title}
          </h2>
        </div>
        {optional ? (
          <span className="shrink-0 rounded-full bg-[#F1F3F7] px-2.5 py-1 font-label-sm app-muted">
            Optional
          </span>
        ) : null}
      </div>
      {description ? (
        <p
          className={cn(
            'font-body-md text-sm app-muted',
            descriptionPad
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
