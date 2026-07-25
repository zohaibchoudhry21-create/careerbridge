import AnimatedContent from '../ui/AnimatedContent';
import SectionIcon from '../ui/SectionIcon';
import { Sparkles } from '../animate-ui/icons/sparkles';

const features = [
  {
    icon: 'document_scanner',
    color: 'scanner',
    title: 'OCR CV Builder',
    description:
      'Upload any PDF or image. Our OCR instantly converts it into a structured, editable digital profile.',
  },
  {
    icon: 'mic',
    color: 'mode',
    title: 'Voice Profile Input',
    description:
      'Too busy to type? Speak your experience aloud and let our AI structure it into professional bullet points.',
  },
  {
    color: 'focus',
    AnimatedIcon: Sparkles,
    title: '1-Click Optimization',
    description:
      'Paste a job description. We rewrite your bullets to match keywords and highlight relevant experience instantly.',
  },
  {
    icon: 'picture_as_pdf',
    color: 'resume',
    title: 'Resume PDF Generator',
    description:
      'Export to beautifully designed, ATS-friendly PDF templates that look premium and pass screening.',
  },
  {
    icon: 'work',
    color: 'role',
    title: 'Smart Job Matching',
    description:
      'Get AI-ranked job matches based on your skills, experience, and career goals.',
  },
  {
    icon: 'payments',
    color: 'time',
    title: 'Salary Intelligence',
    description:
      'Get real-time market data on what you should be earning based on your skills, location, and experience level.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="page-container py-xl">
      <AnimatedContent
        distance={60}
        duration={0.9}
        ease="power3.out"
        threshold={0.15}
        className="mb-lg text-center"
      >
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
          Powerful Tools for Career Growth
        </h2>
      </AnimatedContent>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const FeatureIcon = feature.AnimatedIcon;
          return (
            <AnimatedContent
              key={feature.title}
              distance={70}
              duration={0.85}
              ease="power3.out"
              threshold={0.1}
              delay={(index % 3) * 0.1}
              scale={0.96}
              className="h-full"
            >
              <div className="hover-lift group relative h-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-secondary hover:shadow-[0_0_20px_rgba(33,112,228,0.2)]">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-secondary/5 transition-transform group-hover:scale-110" />
                {FeatureIcon || feature.icon ? (
                  <div className="relative z-10 mb-4">
                    {FeatureIcon ? (
                      <SectionIcon color={feature.color} size="md">
                        <FeatureIcon size={20} animateOnHover />
                      </SectionIcon>
                    ) : (
                      <SectionIcon color={feature.color} icon={feature.icon} size="md" />
                    )}
                  </div>
                ) : null}
                <h3 className="relative z-10 mb-2 font-label-md text-label-md text-on-surface">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-sm text-on-surface-variant">{feature.description}</p>
              </div>
            </AnimatedContent>
          );
        })}
      </div>
    </section>
  );
}
