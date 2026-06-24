import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { DEFAULT_SECTION_HEADINGS } from '../data/resumeSectionTypes';
import { DEFAULT_CUSTOMIZE, mergeCustomize, getTemplateAccentColor } from '../data/resumeCustomizeDefaults';
import { createEntry, createLocalId, createSection } from '../utils/resumeEditorUtils';

const ResumeEditorContext = createContext(null);

const reorderList = (items, fromIndex, toIndex) => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const updateSectionById = (sections, sectionId, updater) =>
  sections.map((section) => (section.id === sectionId ? updater(section) : section));

const initialState = {
  resumeId: null,
  name: 'Resume 1',
  templateId: null,
  personalDetails: {
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    photo: '',
    photoUrl: '',
    extraFields: [],
  },
  sections: [],
  customize: { ...DEFAULT_CUSTOMIZE },
  dirty: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_RESUME':
      return {
        ...state,
        resumeId: action.payload.id,
        name: action.payload.name,
        templateId: action.payload.templateId,
        personalDetails: action.payload.personalDetails || initialState.personalDetails,
        sections: action.payload.sections || [],
        customize: mergeCustomize(action.payload.customize, action.payload.templateId),
        dirty: false,
      };
    case 'UPDATE_CUSTOMIZE': {
      const { key, value } = action.payload;
      const nextCustomize = { ...state.customize, [key]: value };
      if (import.meta.env.DEV) {
        console.log('[ResumeEditor] UPDATE_CUSTOMIZE', key, value, nextCustomize);
      }
      return {
        ...state,
        customize: nextCustomize,
        dirty: true,
      };
    }
    case 'UPDATE_CUSTOMIZE_BATCH': {
      const nextCustomize = { ...state.customize, ...action.payload };
      if (import.meta.env.DEV) {
        console.log('[ResumeEditor] UPDATE_CUSTOMIZE_BATCH', action.payload, nextCustomize);
      }
      return {
        ...state,
        customize: nextCustomize,
        dirty: true,
      };
    }
    case 'UPDATE_PERSONAL':
      return {
        ...state,
        personalDetails: { ...state.personalDetails, ...action.payload },
        dirty: true,
      };
    case 'SET_RESUME_NAME':
      return { ...state, name: action.payload, dirty: true };
    case 'SET_TEMPLATE_ID':
      return {
        ...state,
        templateId: action.payload,
        customize: {
          ...state.customize,
          accentColor: getTemplateAccentColor(action.payload),
        },
        dirty: true,
      };
    case 'REORDER_SECTIONS':
      return {
        ...state,
        sections: reorderList(state.sections, action.fromIndex, action.toIndex),
        dirty: true,
      };
    case 'UPDATE_SECTION_HEADING':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          heading: action.heading,
        })),
        dirty: true,
      };
    case 'TOGGLE_SECTION_COLLAPSED':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          collapsed: !section.collapsed,
        })),
      };
    case 'TOGGLE_SECTION_VISIBLE':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          visible: !section.visible,
        })),
        dirty: true,
      };
    case 'ADD_SECTION': {
      const heading = DEFAULT_SECTION_HEADINGS[action.sectionType] || action.sectionType;
      const section = createSection(action.sectionType, heading);
      if (action.sectionType === 'about') {
        section.entries = [createEntry('about')];
      }
      return { ...state, sections: [...state.sections, section], dirty: true };
    }
    case 'DELETE_SECTION':
      return {
        ...state,
        sections: state.sections.filter((section) => section.id !== action.sectionId),
        dirty: true,
      };
    case 'ADD_ENTRY':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          entries: [...section.entries, createEntry(section.type)],
        })),
        dirty: true,
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          entries: section.entries.map((entry) =>
            entry.id === action.entryId
              ? { ...entry, fields: { ...entry.fields, ...action.fields } }
              : entry
          ),
        })),
        dirty: true,
      };
    case 'TOGGLE_ENTRY_VISIBLE':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          entries: section.entries.map((entry) =>
            entry.id === action.entryId ? { ...entry, visible: !entry.visible } : entry
          ),
        })),
        dirty: true,
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          entries: section.entries.filter((entry) => entry.id !== action.entryId),
        })),
        dirty: true,
      };
    case 'REORDER_ENTRIES':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          entries: reorderList(section.entries, action.fromIndex, action.toIndex),
        })),
        dirty: true,
      };
    case 'ADD_SKILLS':
      return {
        ...state,
        sections: updateSectionById(state.sections, action.sectionId, (section) => ({
          ...section,
          entries: [
            ...section.entries,
            ...action.skills.map((name) => ({
              id: createLocalId(),
              visible: true,
              fields: { name, description: '' },
            })),
          ],
        })),
        dirty: true,
      };
    case 'MARK_CLEAN':
      return { ...state, dirty: false };
    default:
      return state;
  }
}

export function ResumeEditorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadResume = useCallback((resume) => {
    dispatch({ type: 'LOAD_RESUME', payload: resume });
  }, []);

  const value = useMemo(() => ({ state, dispatch, loadResume }), [state, dispatch, loadResume]);

  return <ResumeEditorContext.Provider value={value}>{children}</ResumeEditorContext.Provider>;
}

export const useResumeEditor = () => {
  const context = useContext(ResumeEditorContext);

  if (!context) {
    throw new Error('useResumeEditor must be used within ResumeEditorProvider');
  }

  return context;
};
