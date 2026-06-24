import { useEffect, useRef } from 'react';
import Hero from '../components/home/Hero';
import TrustBadges from '../components/home/TrustBadges';
import ProblemSection from '../components/home/ProblemSection';
import SolutionSection from '../components/home/SolutionSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorks from '../components/home/HowItWorks';
import AIPower from '../components/home/AIPower';
import FinalCTA from '../components/home/FinalCTA';
import { MarketingLayout } from '../components/layout';
import { useRevealAnimation } from '../hooks/useAnimations';
import { checkHealth } from '../services/api';

export default function Home() {
  const mainRef = useRef(null);
  useRevealAnimation(mainRef);

  useEffect(() => {
    checkHealth().catch(() => {
      // Backend may be offline during frontend-only dev
    });
  }, []);

  return (
    <MarketingLayout mainRef={mainRef}>
      <Hero />
      <TrustBadges />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorks />
      <AIPower />
      <FinalCTA />
    </MarketingLayout>
  );
}
