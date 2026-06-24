const steps = [
  {
    number: 1,
    icon: 'upload_file',
    title: 'Upload or Speak',
    description:
      'Input your raw experience via CV upload, voice note, or manual entry. We handle the heavy lifting.',
    delay: 'delay-100',
  },
  {
    number: 2,
    icon: 'model_training',
    title: 'Generate Profile',
    description:
      'AI structures your data into a master profile and generates an ATS-ready resume.',
    delay: 'delay-300',
  },
  {
    number: 3,
    icon: 'rocket_launch',
    title: 'Optimize & Apply',
    description:
      'Target specific roles. One click adjusts your CV keywords to beat ATS filters for that exact job description.',
    delay: 'delay-500',
  },
];

const ICON_CARD_SIZE = 72;
const ICON_SIZE = 32;
const ICON_COLOR = '#1E3A8A';
const BADGE_COLOR = '#2563EB';

function StepIcon({ icon, number }) {
  return (
    <div
      className="relative z-[1] mb-6 flex shrink-0 items-center justify-center rounded-2xl bg-white"
      style={{
        width: ICON_CARD_SIZE,
        height: ICON_CARD_SIZE,
        boxShadow: '0 4px 20px rgba(0, 0, 100, 0.10)',
      }}
    >
      <span
        className="material-symbols-outlined select-none"
        style={{
          fontSize: ICON_SIZE,
          width: ICON_SIZE,
          height: ICON_SIZE,
          lineHeight: 1,
          color: ICON_COLOR,
          fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 32",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
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
        <div className="text-center mb-lg reveal is-visible">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
            How It Works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
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
              className={`relative flex max-w-xs flex-col items-center text-center reveal ${step.delay} is-visible`}
            >
              <StepIcon icon={step.icon} number={step.number} />
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{step.title}</h3>
              <p className="text-sm text-on-surface-variant px-4">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
