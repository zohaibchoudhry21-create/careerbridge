/**
 * Fixed button color roles — independent of per-section icon accent tokens.
 *
 * Usage:
 *   import Button from './Button';
 *   <Button variant="primary">Save</Button>
 *
 *   import { buttonPrimaryClass } from './buttonTokens';
 *   <Link className={buttonPrimaryClass}>Continue</Link>
 */

/** Shared layout/transition base — color variants extend this. */
export const BUTTON_BASE =
  'inline-flex items-center justify-center font-label-md transition-colors disabled:cursor-not-allowed';

/** Primary CTA — brand blue (#0058be), hover #2170e4 */
export const buttonPrimaryClass = [
  BUTTON_BASE,
  'rounded-xl bg-secondary text-on-secondary hover:bg-secondary-container disabled:opacity-60',
].join(' ');

/** Destructive — matches Delete Account (#ba1a1a) */
export const buttonDestructiveClass = [
  BUTTON_BASE,
  'rounded-xl bg-error text-white hover:opacity-90 disabled:opacity-60',
].join(' ');

/** Secondary / neutral — grey border, surface hover */
export const buttonSecondaryClass = [
  BUTTON_BASE,
  'rounded-xl border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container disabled:opacity-60',
].join(' ');

export const BUTTON_VARIANTS = {
  primary: buttonPrimaryClass,
  destructive: buttonDestructiveClass,
  secondary: buttonSecondaryClass,
};
