import { useCallback, useEffect, useRef, useState } from 'react';
import { useResumeEditor } from '../context/ResumeEditorContext';
import CustomizeSidebar from './customize/CustomizeSidebar';
import { SIDEBAR_ITEMS } from './customize/constants';
import { CUSTOMIZE_SECTIONS } from './customize/sections';

const SCROLL_SPY_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const PROGRAMMATIC_SCROLL_LOCK_MS = 500;
const SCROLL_SPY_MIN_RATIO = 0.3;

export default function CustomizePanel({ onGoToPersonalDetails }) {
  const [activeSection, setActiveSection] = useState('document');
  const { state } = useResumeEditor();
  const scrollContainerRef = useRef(null);
  const sectionRefs = useRef({});
  const sectionVisibilityRef = useRef({});
  const isScrollingProgrammatically = useRef(false);
  const scrollLockTimerRef = useRef(null);

  const handleSectionClick = useCallback((sectionId) => {
    setActiveSection(sectionId);
    isScrollingProgrammatically.current = true;

    if (scrollLockTimerRef.current) {
      clearTimeout(scrollLockTimerRef.current);
    }

    const sectionEl =
      sectionRefs.current[sectionId] ||
      document.getElementById(`customize-section-${sectionId}`);

    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    scrollLockTimerRef.current = setTimeout(() => {
      isScrollingProgrammatically.current = false;
    }, PROGRAMMATIC_SCROLL_LOCK_MS);
  }, []);

  useEffect(() => {
    const scrollRoot = scrollContainerRef.current;
    if (!scrollRoot) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically.current) return;

        entries.forEach((entry) => {
          const sectionId = entry.target.dataset.sectionId;
          if (sectionId) {
            sectionVisibilityRef.current[sectionId] = entry.intersectionRatio;
          }
        });

        let bestSectionId = null;
        let bestRatio = 0;

        SIDEBAR_ITEMS.forEach(({ id }) => {
          const ratio = sectionVisibilityRef.current[id] || 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestSectionId = id;
          }
        });

        if (bestSectionId && bestRatio >= SCROLL_SPY_MIN_RATIO) {
          setActiveSection(bestSectionId);
        }
      },
      {
        root: scrollRoot,
        threshold: SCROLL_SPY_THRESHOLDS,
      }
    );

    SIDEBAR_ITEMS.forEach(({ id }) => {
      const sectionEl = sectionRefs.current[id];
      if (sectionEl) observer.observe(sectionEl);
    });

    return () => {
      observer.disconnect();
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex bg-surface overflow-hidden min-h-0">
      <CustomizeSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionClick}
        showPhoto={state.customize.showPhoto}
      />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-sm min-h-0">
        <div className="space-y-lg">
          {SIDEBAR_ITEMS.map(({ id }) => {
            const SectionComponent = CUSTOMIZE_SECTIONS[id];
            if (!SectionComponent) return null;

            return (
              <section
                key={id}
                id={`customize-section-${id}`}
                data-section-id={id}
                ref={(node) => {
                  sectionRefs.current[id] = node;
                }}
                className="scroll-mt-md"
              >
                <SectionComponent onGoToPersonalDetails={onGoToPersonalDetails} />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
