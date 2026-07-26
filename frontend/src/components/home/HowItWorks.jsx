import SectionIcon from '../ui/SectionIcon';
import { Sparkles } from '../animate-ui/icons/sparkles';
import { CircleCheck } from '../animate-ui/icons/circle-check';
import { ArrowRight } from '../animate-ui/icons/arrow-right';

const steps = [
  {
    number: 1,
    icon: 'upload_file',
    color: 'resume',
    title: 'Upload or Speak',
    description:
      'Input your raw experience via CV upload, voice note, or manual entry. We handle the heavy lifting.',
    delay: 'delay-100',
  },
  {
    number: 2,
    color: 'focus',
    AnimatedIcon: Sparkles,
    title: 'Generate Profile',
    description:
      'AI structures your data into a master profile and generates an ATS-ready resume.',
    delay: 'delay-300',
  },
  {
    number: 3,
    color: 'success',
    AnimatedIcon: CircleCheck,
    title: 'Optimize & Apply',
    description:
      'Target specific roles. One click adjusts your CV keywords to beat ATS filters for that exact job description.',
    delay: 'delay-500',
  },
];

const ICON_CARD_SIZE = 72;
const BADGE_COLOR = '#2563EB';

function StepIcon({ icon, color, AnimatedIcon, number }) {
  return (
    <div className="relative z-[1] mb-6 shrink-0" style={{ width: ICON_CARD_SIZE, height: ICON_CARD_SIZE }}>
      {AnimatedIcon ? (
        <SectionIcon color={color} size="lg" className="h-full w-full rounded-2xl shadow-[0_4px_20px_rgba(0,0,100,0.10)]">
          <AnimatedIcon size={32} animateOnHover />
        </SectionIcon>
      ) : (
        <SectionIcon
          color={color}
          icon={icon}
          size="lg"
          className="h-full w-full rounded-2xl shadow-[0_4px_20px_rgba(0,0,100,0.10)]"
        />
      )}
      <span
        className="absolute flex items-center justify-center rounded-full font-bold text-white"
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
  return (
    <section className="bg-surface-container-highest py-xl">
      <div className="page-container">
        <div className="reveal is-visible mb-lg text-center">
          <h2 className="inline-flex flex-wrap items-center justify-center gap-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
            How It Works
            <ArrowRight size={28} className="hidden text-secondary sm:inline" animateOnHover />
          </h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            From raw data to interview ready in minutes.
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
            <div className="h-full w-full bg-outline-variant/30">
              <div className="anim-draw-line h-full bg-secondary" style={{ width: 0 }} />
            </div>
          </div>

          {steps.map((step) => (
            <div
              key={step.number}
              className={`reveal relative flex max-w-xs flex-col items-center text-center ${step.delay} is-visible`}
            >
              <StepIcon
                icon={step.icon}
                color={step.color}
                AnimatedIcon={step.AnimatedIcon}
                number={step.number}
              />
              <h3 className="mb-2 font-headline-md text-headline-md text-on-surface">{step.title}</h3>
              <p className="px-4 text-sm text-on-surface-variant">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
