import AnimatedContent from '../ui/AnimatedContent';
import AppIcon from '../icons/AppIcon';
import { Sparkles } from '../animate-ui/icons/sparkles';

const features = [
  {
    icon: 'document_scanner',
    title: 'OCR CV Builder',
    description:
      'Upload any PDF or image. Our OCR instantly converts it into a structured, editable digital profile.',
  },
  {
    icon: 'mic',
    title: 'Voice Profile Input',
    description:
      'Too busy to type? Speak your experience aloud and let our AI structure it into professional bullet points.',
  },
  {
    AnimatedIcon: Sparkles,
    title: '1-Click Optimization',
    description:
      'Paste a job description. We rewrite your bullets to match keywords and highlight relevant experience instantly.',
  },
  {
    icon: 'picture_as_pdf',
    title: 'Resume PDF Generator',
    description:
      'Export to beautifully designed, ATS-friendly PDF templates that look premium and pass screening.',
  },
  {
    icon: 'work',
    title: 'Smart Job Matching',
    description:
      'Get AI-ranked job matches based on your skills, experience, and career goals.',
  },
  {
    icon: 'payments',
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
        className="text-center mb-lg"
      >
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
          Powerful Tools for Career Growth
        </h2>
      </AnimatedContent>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-sm hover:shadow-[0_0_20px_rgba(33,112,228,0.2)] transition-all hover:border-secondary group relative overflow-hidden hover-lift h-full">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full transition-transform group-hover:scale-110" />
                {FeatureIcon || feature.icon ? (
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center text-secondary mb-4 relative z-10 group-hover:bg-secondary group-hover:text-white transition-colors">
                    {FeatureIcon ? (
                      <FeatureIcon size={24} animateOnHover />
                    ) : (
                      <AppIcon name={feature.icon} size="h-6 w-6" />
                    )}
                  </div>
                ) : null}
                <h3 className="font-label-md text-label-md text-on-surface mb-2 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-sm text-on-surface-variant relative z-10">{feature.description}</p>
              </div>
            </AnimatedContent>
          );
        })}
      </div>
    </section>
  );
}
