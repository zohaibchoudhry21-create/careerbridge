import { memo } from 'react';

function FloatingAIAssistant() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-md sm:right-md z-50">
      <button
        type="button"
        aria-label="Open AI assistant"
        className="w-14 h-14 bg-secondary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 dashboard-ai-glow"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
      </button>
    </div>
  );
}

export default memo(FloatingAIAssistant);
