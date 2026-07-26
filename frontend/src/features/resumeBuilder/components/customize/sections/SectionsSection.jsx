import { useTranslation } from 'react-i18next';
import AppIcon from '../../../../../components/icons/AppIcon';
import { SECTION_ICONS } from '../../../data/resumeSectionTypes';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function SectionsSection() {
  const { t } = useTranslation('resumeBuilder');
  const { sections, dispatch } = useCustomizeDispatch();

  const moveSection = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= sections.length) return;
    dispatch({ type: 'REORDER_SECTIONS', fromIndex, toIndex });
  };

  if (!sections.length) {
    return (
      <CustomizeSectionCard
        title={t('customize.sections.title')}
        description={t('customize.sections.description')}
      >
        <p className="text-on-surface-variant text-sm">{t('customize.sections.empty')}</p>
      </CustomizeSectionCard>
    );
  }

  return (
    <CustomizeSectionCard
      title={t('customize.sections.title')}
      description={t('customize.sections.description')}
    >
      <ul className="space-y-2">
        {sections.map((section, index) => (
          <li
            key={section.id}
            className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-2"
          >
            <AppIcon
              name={SECTION_ICONS[section.type] || 'article'}
              size="nav"
              className="text-on-surface-variant"
            />
            <span className="flex-1 text-on-surface font-label-sm truncate">{section.heading}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveSection(index, index - 1)}
                className="p-1 rounded-md text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                aria-label={t('customize.sections.moveUp')}
              >
                <AppIcon name="arrow_upward" size="button" />
              </button>
              <button
                type="button"
                disabled={index === sections.length - 1}
                onClick={() => moveSection(index, index + 1)}
                className="p-1 rounded-md text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                aria-label={t('customize.sections.moveDown')}
              >
                <AppIcon name="arrow_downward" size="button" />
              </button>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={section.visible}
              aria-label={t('customize.sections.toggleVisibility', { heading: section.heading })}
              onClick={() =>
                dispatch({ type: 'TOGGLE_SECTION_VISIBLE', sectionId: section.id })
              }
              className={`relative h-6 w-11 rounded-full transition-colors shrink-0 border ${
                section.visible
                  ? 'bg-secondary border-secondary'
                  : 'bg-surface-container border-outline-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface-container-lowest transition-transform ${
                  section.visible ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </CustomizeSectionCard>
  );
}
