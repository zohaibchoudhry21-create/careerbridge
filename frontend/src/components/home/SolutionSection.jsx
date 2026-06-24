import { IMAGES } from '../../config/images';
import AnimatedContent from '../ui/AnimatedContent';

const points = [
  {
    title: 'Upload your CV → AI builds your profile',
    description: 'Instant data extraction and structuring.',
  },
  {
    title: 'One-click CV optimization',
    description: 'Tailored perfectly for any specific job description.',
  },
  {
    title: 'Download ATS-ready resume',
    description: 'Export polished PDF templates optimized for applicant tracking systems.',
  },
];

export default function SolutionSection() {
  return (
    <section className="bg-surface-container-low border-y border-outline-variant/20 py-xl overflow-hidden">
      <div className="page-container grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
        <AnimatedContent
          direction="horizontal"
          reverse
          distance={90}
          duration={1}
          ease="power3.out"
          threshold={0.15}
          className="lg:col-span-5"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                The Solution
              </span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
              Meet AI Career OS
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant border-l-4 border-secondary pl-4">
              <span className="animated-underline">An end-to-end career automation system</span> designed
              to eliminate friction between you and your next offer.
            </p>
            <ul className="space-y-4 pt-4">
              {points.map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary mt-1">check_circle</span>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">{point.title}</h4>
                    <p className="text-sm text-on-surface-variant">{point.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </AnimatedContent>

        <AnimatedContent
          direction="horizontal"
          distance={100}
          duration={1.1}
          ease="power3.out"
          threshold={0.15}
          delay={0.15}
          scale={0.95}
          className="lg:col-span-7"
        >
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-level-2 bg-surface">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700"
              style={{ backgroundImage: `url('${IMAGES.solution}')` }}
              role="img"
              aria-label="Solution mockup"
            />
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
