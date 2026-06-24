import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const A4_PREVIEW_WIDTH = 794;
export const A4_PREVIEW_HEIGHT = 1123;

export default function TemplatePreviewWrapper({ children, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    if (containerWidth > 0) {
      setScale(containerWidth / A4_PREVIEW_WIDTH);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateScale = () => {
      const containerWidth = container.offsetWidth;
      if (containerWidth > 0) {
        setScale(containerWidth / A4_PREVIEW_WIDTH);
      }
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '210/297',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          width: `${A4_PREVIEW_WIDTH}px`,
          height: `${A4_PREVIEW_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
