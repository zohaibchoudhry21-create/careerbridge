import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const A4_PREVIEW_WIDTH = 794;
export const A4_PREVIEW_HEIGHT = 1123;

/**
 * Scales a fixed-width A4 resume to fit the editor preview column width.
 * Unlike TemplatePreviewWrapper (card thumbnails), height grows with content for scrolling.
 */
export default function EditorPreviewScaler({ children, className = '' }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState(A4_PREVIEW_HEIGHT);

  const updateScale = () => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const containerWidth = container.offsetWidth;
    if (containerWidth <= 0) return;

    const nextScale = containerWidth / A4_PREVIEW_WIDTH;
    setScale(nextScale);
    setScaledHeight(content.offsetHeight * nextScale);
  };

  useLayoutEffect(() => {
    updateScale();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return undefined;

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, [children]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div
        style={{
          width: '100%',
          height: scaledHeight,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: `${A4_PREVIEW_WIDTH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
