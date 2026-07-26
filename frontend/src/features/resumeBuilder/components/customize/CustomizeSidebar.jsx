import { useTranslation } from 'react-i18next';
import { SIDEBAR_ITEMS } from './constants';

export default function CustomizeSidebar({ activeSection, onSectionChange, showPhoto }) {
  const { t } = useTranslation('resumeBuilder');

  return (
    <nav className="w-44 shrink-0 border-r border-outline-variant overflow-y-auto bg-surface py-sm">
      <ul className="space-y-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const isDisabled = item.requiresPhoto && !showPhoto;
          const isActive = activeSection === item.id;

          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => onSectionChange(item.id)}
                className={`w-full text-left px-md py-sm font-label-sm transition-colors border-l-2 ${
                  isActive
                    ? 'text-secondary border-secondary bg-secondary/5'
                    : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-low'
                } ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {t(`customize.sidebar.${item.id}`)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
