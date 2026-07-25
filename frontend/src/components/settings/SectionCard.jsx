import SectionHeading from '../ui/SectionHeading';
import { settingsSectionCardClassName } from './settingsStyles';

export default function SectionCard({
  title,
  description,
  icon,
  color = 'settings',
  children,
  className = '',
}) {
  return (
    <section className={`${settingsSectionCardClassName} ${className}`}>
      {title ? (
        <SectionHeading
          color={color}
          icon={icon}
          title={title}
          description={description}
          className="mb-md"
        />
      ) : null}
      {children}
    </section>
  );
}
