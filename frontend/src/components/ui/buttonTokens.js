/**
 * Fixed button color roles — independent of per-section icon accent tokens.
 *
 * Usage:
 *   import Button from './Button';
 *   <Button variant="primary">Save</Button>
 *
 *   import { buttonPrimaryClass, buttonGradientCtaClass } from './buttonTokens';
 *   <Link className={buttonPrimaryClass}>Continue</Link>
 *   <Link className={buttonGradientCtaClass}>Analyze Resume</Link>
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

/** Gradient CTA — matches Resume Scanner Analyze Resume */
export const buttonGradientCtaClass = [
  'inline-flex items-center justify-center font-label-md transition-all disabled:cursor-not-allowed disabled:opacity-55',
  'gap-2 px-lg py-3 rounded-2xl',
  'bg-gradient-to-r from-indigo-600 to-blue-600 text-white',
  'shadow-[0_4px_14px_rgba(79,70,229,0.32)]',
  'hover:from-indigo-500 hover:to-blue-500',
  'hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0',
].join(' ');

export const BUTTON_VARIANTS = {
  primary: buttonPrimaryClass,
  destructive: buttonDestructiveClass,
  secondary: buttonSecondaryClass,
  gradient: buttonGradientCtaClass,
};
