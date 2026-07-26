import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'motion/react';
import { IMAGES } from '../../config/images';
import TextType from '../ui/TextType';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
  AvatarGroup,
  AvatarGroupTooltip,
} from '../animate-ui/components/animate/avatar-group';
import { Sparkles } from '../animate-ui/icons/sparkles';
import { buttonPrimaryClass } from '../ui/buttonTokens';
import { cn } from '../../lib/utils';

function HeroCtaButton() {
  const [hovering, setHovering] = useState(false);

  return (
    <Link
      to="/login"
      className={cn(
        buttonPrimaryClass,
        'relative z-20 w-full gap-2 text-lg rounded-xl px-8 py-4 sm:w-auto'
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      Get started for free
      <motion.span
        className="inline-flex shrink-0"
        animate={{ x: hovering ? 8 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        aria-hidden
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </motion.span>
    </Link>
  );
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const heroTypingPhrases = [
  'Yes, really',
  'build ATS-optimized resumes.',
  'land interviews faster.',
  'download unlimited PDFs.',
];

const LEFT_RESUME_SCALE = 0.55;
const RIGHT_RESUME_SCALE = 0.5;
const LEFT_SCALED_WIDTH = A4_WIDTH * LEFT_RESUME_SCALE;
const LEFT_SCALED_HEIGHT = A4_HEIGHT * LEFT_RESUME_SCALE;
const RIGHT_SCALED_WIDTH = A4_WIDTH * RIGHT_RESUME_SCALE;
const RIGHT_SCALED_HEIGHT = A4_HEIGHT * RIGHT_RESUME_SCALE;

const AVATARS = [
  {
    src: 'https://randomuser.me/api/portraits/women/1.jpg',
    fallback: 'A',
    tooltip: 'Alex',
  },
  {
    src: 'https://randomuser.me/api/portraits/men/2.jpg',
    fallback: 'J',
    tooltip: 'Jordan',
  },
  {
    src: 'https://randomuser.me/api/portraits/women/3.jpg',
    fallback: 'S',
    tooltip: 'Sam',
  },
  {
    src: 'https://randomuser.me/api/portraits/men/4.jpg',
    fallback: 'R',
    tooltip: 'Riley',
  },
  {
    src: 'https://randomuser.me/api/portraits/women/5.jpg',
    fallback: 'M',
    tooltip: 'Morgan',
  },
];

function TikTokIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function ScaledResumeImage({ src, alt, width, height }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl bg-white"
      style={{ width, height }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="block w-full h-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default function Hero() {
  return (
    <section className="w-full bg-surface-container reveal is-visible">
      <div className="page-container py-xl xl:py-20">
        <div className="grid grid-cols-1 xl:grid-cols-[55fr_45fr] gap-lg xl:gap-12 items-center">
          <div className="flex flex-col gap-6 max-w-xl">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest inline-flex items-center gap-2">
              <Sparkles size={16} className="text-secondary" animateOnHover />
              FREE ONLINE RESUME BUILDER
            </p>

            <h1
              className="text-2xl sm:text-3xl xl:text-5xl font-black leading-tight text-gray-950"
              id="hero-headline"
            >
              Build a job-winning
              <br />
              resume for free
            </h1>

            <div className="space-y-2 text-lg text-gray-500 leading-relaxed">
              <p>Your first resume is 100% free forever.</p>
              <p>Unlimited downloads. No hidden fees.</p>
              <p>
                <TextType
                  text={heroTypingPhrases}
                  as="span"
                  className="font-semibold text-secondary"
                  typingSpeed={75}
                  pauseDuration={1500}
                  deletingSpeed={30}
                  showCursor
                  cursorCharacter="|"
                  cursorClassName="text-secondary"
                  startOnVisible
                  loop
                />
              </p>
            </div>

            <div>
              <HeroCtaButton />
            </div>

            <div className="flex items-center gap-3 mt-8 pt-2">
              <AvatarGroup>
                {AVATARS.map((avatar, index) => (
                  <Avatar key={index}>
                    <AvatarImage src={avatar.src} />
                    <AvatarFallback>{avatar.fallback}</AvatarFallback>
                    <AvatarGroupTooltip>{avatar.tooltip}</AvatarGroupTooltip>
                  </Avatar>
                ))}
              </AvatarGroup>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Trusted by <span className="font-semibold">5.3 million</span> users
              </p>
            </div>
          </div>

          <div className="hidden xl:flex justify-center items-start">
            <div
              className="relative"
              style={{
                width: LEFT_SCALED_WIDTH + RIGHT_SCALED_WIDTH + 24,
                minHeight: RIGHT_SCALED_HEIGHT + 64,
              }}
            >
              <div className="flex items-start gap-6">
                <div className="relative z-10 mt-0 -rotate-2">
                  <ScaledResumeImage
                    src={IMAGES.resumeAtlanticBlue}
                    alt="Atlantic Blue resume preview"
                    width={LEFT_SCALED_WIDTH}
                    height={LEFT_SCALED_HEIGHT}
                  />
                </div>

                <div className="relative z-[5] mt-16 rotate-2">
                  <ScaledResumeImage
                    src={IMAGES.resumeClassicClear}
                    alt="Classic Clear resume preview"
                    width={RIGHT_SCALED_WIDTH}
                    height={RIGHT_SCALED_HEIGHT}
                  />
                </div>
              </div>

              <div className="absolute bottom-8 left-[-20px] z-20 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 min-w-[200px]">
                <div className="w-10 h-10 rounded-full bg-[#e85d75] flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm">P</span>
                </div>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface leading-tight">
                    Andrew Irwin
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-tight">
                    Product Manager
                  </p>
                </div>
              </div>

              <div className="absolute bottom-[-20px] right-[-10px] z-20 bg-white rounded-2xl shadow-xl p-4 max-w-[240px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-snug">
                      Powerful websites I wish I knew earlier:
                    </p>
                    <p className="font-label-md text-label-md text-on-surface text-sm mt-1 leading-snug">
                      This one is a LIFESAVER
                    </p>
                  </div>
                  <TikTokIcon className="w-7 h-7 text-on-surface shrink-0" />
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant text-xs mt-2">
                  @maedeh.davami | 1.8 million views
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
