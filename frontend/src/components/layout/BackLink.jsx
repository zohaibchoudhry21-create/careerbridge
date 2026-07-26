import { Link } from 'react-router-dom';
import AppIcon from '../icons/AppIcon';

/**
 * Standard back/exit affordance placed at the top of a PageContainer.
 * Renders a <button> when given onClick (for handlers that need navigate/guards),
 * otherwise a router <Link>.
 */
const BACK_LINK_CLASS =
  'inline-flex items-center gap-1 font-label-md text-secondary hover:underline';

export default function BackLink({ to, onClick, children }) {
  const content = (
    <>
      <AppIcon name="arrow_back" size="sm" />
      {children}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={BACK_LINK_CLASS}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to} className={BACK_LINK_CLASS}>
      {content}
    </Link>
  );
}
