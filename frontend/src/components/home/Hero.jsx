import { Link } from 'react-router-dom';
import TextType from '../ui/TextType';

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const heroTypingPhrases = [
  'Yes, really 🚀',
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

const AVATAR_URLS = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/women/3.jpg',
  'https://randomuser.me/api/portraits/men/4.jpg',
  'https://randomuser.me/api/portraits/women/5.jpg',
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
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
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
              <Link
                to="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center bg-primary-container text-on-primary text-lg rounded-xl px-8 py-4 hover:opacity-90 transition-opacity"
              >
                Get started for free ✨
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex">
                {AVATAR_URLS.map((url, index) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className={`w-10 h-10 rounded-full border-2 border-white object-cover ${index > 0 ? '-ml-3' : ''}`}
                  />
                ))}
              </div>
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
                    src="/images/resume-atlantic-blue.png"
                    alt="Atlantic Blue resume preview"
                    width={LEFT_SCALED_WIDTH}
                    height={LEFT_SCALED_HEIGHT}
                  />
                </div>

                <div className="relative z-[5] mt-16 rotate-2">
                  <ScaledResumeImage
                    src="/images/resume-classic-clear.png"
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
                  <p className="text-amber-400 text-sm leading-none mt-1" aria-label="5 star rating">
                    ★★★★★
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
                      This one is a LIFESAVER 😩
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
