import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ScanLine, Mic } from 'lucide-react';
import SectionIcon from '../ui/SectionIcon';
import { buttonPrimaryClass } from '../ui/buttonTokens';
import { cn } from '../../lib/utils';

const STEP_META = [
  {
    number: 1,
    color: 'resume',
    Icon: FileText,
    delay: 'delay-100',
  },
  {
    number: 2,
    color: 'scanner',
    Icon: ScanLine,
    delay: 'delay-300',
  },
  {
    number: 3,
    color: 'interview',
    Icon: Mic,
    delay: 'delay-500',
  },
];

const ICON_CARD_SIZE = 72;
const BADGE_COLOR = '#2563EB';

function StepIcon({ color, Icon, number }) {
  return (
    <div
      className="relative z-[1] mb-6 shrink-0"
      style={{ width: ICON_CARD_SIZE, height: ICON_CARD_SIZE }}
    >
      <SectionIcon
        color={color}
        size="lg"
        className="h-full w-full rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,100,0.10)]"
      >
        <Icon size={28} strokeWidth={2} />
      </SectionIcon>
      <span
        className="pointer-events-none absolute flex items-center justify-center rounded-full font-bold text-white"
        style={{
          top: -10,
          right: -10,
          width: 24,
          height: 24,
          fontSize: 12,
          backgroundColor: BADGE_COLOR,
        }}
      >
        {number}
      </span>
    </div>
  );
}

export default function HowItWorks() {
  const { t } = useTranslation('marketing');
  const steps = t('howItWorks.steps', { returnObjects: true });

  return (
    <section className="bg-surface-container-highest py-xl" id="tools">
      <div className="page-container">
        <div className="reveal is-visible mb-lg mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
            {t('howItWorks.eyebrow')}
          </p>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
            {t('howItWorks.title')}
          </h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div
          className="relative flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-12"
          id="how-it-works-container"
        >
          <div
            className="pointer-events-none absolute z-0 hidden md:block"
            style={{
              top: ICON_CARD_SIZE / 2,
              left: '12%',
              right: '12%',
              height: 2,
              transform: 'translateY(-50%)',
            }}
            aria-hidden="true"
          >
            <div className="h-full w-full bg-outline-variant/40">
              <div className="anim-draw-line h-full bg-secondary" style={{ width: 0 }} />
            </div>
          </div>

          {STEP_META.map((meta, index) => {
            const step = (Array.isArray(steps) ? steps[index] : null) || {};
            return (
              <div
                key={meta.number}
                className={`reveal relative flex max-w-xs flex-col items-center text-center ${meta.delay} is-visible`}
              >
                <StepIcon color={meta.color} Icon={meta.Icon} number={meta.number} />
                <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">
                  {step.title}
                </h3>
                <p className="px-4 text-sm text-on-surface-variant">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="reveal is-visible mt-xl flex justify-center">
          <Link
            to="/register"
            className={cn(
              buttonPrimaryClass,
              'rounded-2xl px-8 py-3.5 text-label-md text-white hover:text-white'
            )}
          >
            {t('howItWorks.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
