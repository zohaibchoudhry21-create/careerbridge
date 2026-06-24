import { useCallback } from 'react';
import { useResumeEditor } from '../../context/ResumeEditorContext';

export function useCustomizeDispatch() {
  const { state, dispatch } = useResumeEditor();

  const updateCustomize = useCallback(
    (key, value) => {
      dispatch({ type: 'UPDATE_CUSTOMIZE', payload: { key, value } });
    },
    [dispatch]
  );

  return {
    customize: state.customize,
    templateId: state.templateId,
    sections: state.sections,
    dispatch,
    updateCustomize,
  };
}
