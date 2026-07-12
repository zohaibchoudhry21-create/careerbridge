import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppIcon from '../../../components/icons/AppIcon';
import { getPersonalPhoto } from '../utils/personalDetailsPhoto';
import { useResumeEditor } from '../context/ResumeEditorContext';
import { SECTION_ICONS } from '../data/resumeSectionTypes';
import { useSuggestResumeSkills } from '../hooks/useResumeBuilder';
import PersonalDetailsEditor from './PersonalDetailsEditor';
import EditEntryPanel from './EditEntryPanel';
import AddContentModal from './AddContentModal';
import DeleteSectionModal from './DeleteSectionModal';
import ResumeModal from './ResumeModal';

function SectionAccordion({
  section,
  onToggleCollapse,
  onUpdateEntry,
  onAddEntry,
  onDeleteSection,
  onSuggestSkills,
  suggestSkillsLoading,
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-container-low/40 transition-colors"
      >
        <AppIcon
          name={SECTION_ICONS[section.type] || 'article'}
          size="nav"
          className="text-on-surface-variant"
        />
        <span className="flex-1 font-label-lg text-on-surface">{section.heading}</span>
        <AppIcon
          name={section.collapsed ? 'expand_more' : 'expand_less'}
          size="h-[22px] w-[22px]"
          className="text-on-surface-variant"
        />
      </button>

      {!section.collapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/20 pt-3">
          {section.entries.map((entry, index) => (
            <div
              key={entry.id}
              className="rounded-xl border border-outline-variant/30 p-3 bg-surface-container-lowest"
            >
              {section.entries.length > 1 && (
                <p className="font-label-sm text-on-surface-variant mb-2">
                  Entry {index + 1}
                </p>
              )}
              <EditEntryPanel
                inline
                section={section}
                entry={entry}
                onUpdate={(fields) => onUpdateEntry(entry.id, fields)}
              />
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onAddEntry}
              className="font-label-sm text-secondary hover:underline"
            >
              + Add Entry
            </button>
            {section.type === 'expertise' && (
              <button
                type="button"
                disabled={suggestSkillsLoading}
                onClick={onSuggestSkills}
                className="rounded-full bg-surface-container text-secondary px-sm py-1 font-label-sm hover:bg-surface-container-high disabled:opacity-50"
              >
                AI Skill Suggestions
              </button>
            )}
            <button
              type="button"
              onClick={onDeleteSection}
              className="ml-auto text-on-surface-variant hover:text-error"
              aria-label="Delete section"
            >
              <AppIcon name="delete" size="button" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorLeftPanel({ personalDetailsTrigger = 0 }) {
  const { state, dispatch } = useResumeEditor();
  const suggestSkills = useSuggestResumeSkills();
  const [personalOpen, setPersonalOpen] = useState(false);
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [deleteSection, setDeleteSection] = useState(null);

  useEffect(() => {
    if (personalDetailsTrigger > 0) {
      setPersonalOpen(true);
    }
  }, [personalDetailsTrigger]);

  const handleSuggestSkills = async (sectionId, section) => {
    try {
      const currentSkills = section.entries.map((entry) => entry.fields.name).filter(Boolean);
      const result = await suggestSkills.mutateAsync(currentSkills);
      const skills = result.suggestions || [];

      if (!skills.length) {
        toast.info('No new skill suggestions right now.');
        return;
      }

      dispatch({ type: 'ADD_SKILLS', sectionId, skills });
      toast.success(`Added ${skills.length} skill suggestions.`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not fetch skill suggestions.');
    }
  };

  return (
    <>
      <div className="h-full overflow-y-auto p-sm bg-surface space-y-3">
        <div className="relative rounded-2xl border border-outline-variant/40 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setPersonalOpen(true)}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-on-secondary hover:bg-secondary-container transition-colors shadow-sm"
            aria-label="Edit personal details"
          >
            <AppIcon name="edit" size="button" />
          </button>

          <p className="font-headline-section text-headline-section text-on-surface pr-12">
            {state.personalDetails.fullName || 'Your Name'}
          </p>
          {state.personalDetails.professionalTitle && (
            <p className="font-body-sm text-on-surface-variant mt-0.5">
              {state.personalDetails.professionalTitle}
            </p>
          )}
          <div className="mt-3 space-y-1 font-body-sm text-on-surface-variant">
            {state.personalDetails.email && (
              <p className="flex items-center gap-1.5">
                <AppIcon name="mail" size="h-4 w-4" />
                {state.personalDetails.email}
              </p>
            )}
            {state.personalDetails.phone && (
              <p className="flex items-center gap-1.5">
                <AppIcon name="call" size="h-4 w-4" />
                {state.personalDetails.phone}
              </p>
            )}
            {state.personalDetails.location && (
              <p className="flex items-center gap-1.5">
                <AppIcon name="location_on" size="h-4 w-4" />
                {state.personalDetails.location}
              </p>
            )}
          </div>
          <div className="mt-3">
            <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/30">
              {getPersonalPhoto(state.personalDetails) ? (
                <img
                  src={getPersonalPhoto(state.personalDetails)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <AppIcon name="person" size="dashboard" className="text-on-surface-variant" />
              )}
            </div>
          </div>
        </div>

        {state.sections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-4 text-center">
            <p className="font-body-sm text-on-surface-variant">
              No sections yet. Import a CV or add content below.
            </p>
          </div>
        )}

        {state.sections.map((section) => (
          <SectionAccordion
            key={section.id}
            section={section}
            onToggleCollapse={() =>
              dispatch({ type: 'TOGGLE_SECTION_COLLAPSED', sectionId: section.id })
            }
            onUpdateEntry={(entryId, fields) =>
              dispatch({
                type: 'UPDATE_ENTRY',
                sectionId: section.id,
                entryId,
                fields,
              })
            }
            onAddEntry={() => dispatch({ type: 'ADD_ENTRY', sectionId: section.id })}
            onDeleteSection={() => setDeleteSection(section)}
            onSuggestSkills={() => handleSuggestSkills(section.id, section)}
            suggestSkillsLoading={suggestSkills.isPending}
          />
        ))}

        <button
          type="button"
          onClick={() => setAddContentOpen(true)}
          className="w-full rounded-xl bg-secondary py-3 font-label-md text-on-secondary hover:bg-secondary-container transition-colors shadow-sm"
        >
          + Add Content
        </button>
      </div>

      <ResumeModal
        open={personalOpen}
        onClose={() => setPersonalOpen(false)}
        title="Personal Details"
        size="lg"
      >
        <div className="p-md">
          <PersonalDetailsEditor onDone={() => setPersonalOpen(false)} />
        </div>
      </ResumeModal>

      <AddContentModal
        open={addContentOpen}
        onClose={() => setAddContentOpen(false)}
        existingTypes={state.sections.map((section) => section.type)}
        onAddSection={(sectionType) => {
          dispatch({ type: 'ADD_SECTION', sectionType });
          setAddContentOpen(false);
        }}
      />

      <DeleteSectionModal
        open={Boolean(deleteSection)}
        sectionName={deleteSection?.heading || ''}
        onClose={() => setDeleteSection(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_SECTION', sectionId: deleteSection.id });
          setDeleteSection(null);
        }}
      />
    </>
  );
}
