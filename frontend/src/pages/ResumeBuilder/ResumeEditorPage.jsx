import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import EditorTopNav from '../../features/resumeBuilder/components/EditorTopNav';
import EditorLeftPanel from '../../features/resumeBuilder/components/EditorLeftPanel';
import CustomizePanel from '../../features/resumeBuilder/components/CustomizePanel';
import ResumePreview from '../../features/resumeBuilder/components/ResumePreview';
import {
  ResumeEditorProvider,
  useResumeEditor,
} from '../../features/resumeBuilder/context/ResumeEditorContext';
import { resolveApiError } from '../../utils/apiError';
import {
  useBuiltResume,
  useBuiltResumes,
  useUpdateBuiltResume,
} from '../../features/resumeBuilder/hooks/useResumeBuilder';

import { EDITOR_TABS } from '../../features/resumeBuilder/constants/resumeEditorConstants';

function ResumeEditorContent() {
  const { t } = useTranslation('resumeBuilder');
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const { loadResume, state, dispatch } = useResumeEditor();
  const { data: resume, isLoading, isError } = useBuiltResume(resumeId);
  const { data: resumes = [] } = useBuiltResumes();
  const updateResume = useUpdateBuiltResume(resumeId);
  const saveTimer = useRef(null);
  const savedTimer = useRef(null);
  const loadedResumeId = useRef(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [activeTab, setActiveTab] = useState(EDITOR_TABS.CONTENT);
  const [personalDetailsTrigger, setPersonalDetailsTrigger] = useState(0);

  useEffect(() => {
    loadedResumeId.current = null;
    setActiveTab(EDITOR_TABS.CONTENT);
  }, [resumeId]);

  useEffect(() => {
    if (resume && loadedResumeId.current !== resume.id) {
      loadResume(resume);
      loadedResumeId.current = resume.id;
    }
  }, [resume, loadResume]);

  useEffect(() => {
    if (!state.dirty || !state.resumeId) return undefined;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('idle');

    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');

      try {
        await updateResume.mutateAsync({
          name: state.name,
          templateId: state.templateId,
          personalDetails: state.personalDetails,
          sections: state.sections,
          customize: state.customize,
        });
        dispatch({ type: 'MARK_CLEAN' });
        setSaveStatus('saved');

        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (error) {
        setSaveStatus('idle');
        toast.error(resolveApiError(error, t('toasts.autoSaveFailed')));
      }
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, updateResume, dispatch, t]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    []
  );

  if (isLoading) {
    return <div className="font-body-md text-on-surface-variant">{t('page.editor.loading')}</div>;
  }

  if (isError || !resume) {
    return (
      <div>
        <p className="font-body-md text-error mb-sm">{t('page.editor.notFound')}</p>
        <button
          type="button"
          onClick={() => navigate('/resume/templates')}
          className="text-secondary hover:underline font-label-md"
        >
          {t('page.editor.backToTemplates')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col bg-surface">
      <EditorTopNav
        resumeName={state.name}
        resumes={resumes}
        onRename={(name) => dispatch({ type: 'SET_RESUME_NAME', payload: name })}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        saveStatus={saveStatus}
      />
      <div className="flex-1 grid lg:grid-cols-[40%_60%] min-h-0">
        {activeTab === EDITOR_TABS.CONTENT && (
          <EditorLeftPanel personalDetailsTrigger={personalDetailsTrigger} />
        )}
        {activeTab === EDITOR_TABS.CUSTOMIZE && (
          <CustomizePanel
            onGoToPersonalDetails={() => {
              setActiveTab(EDITOR_TABS.CONTENT);
              setPersonalDetailsTrigger((count) => count + 1);
            }}
          />
        )}
        {activeTab === EDITOR_TABS.AI_TOOLS && (
          <div className="h-full overflow-y-auto p-sm bg-surface">
            <p className="font-body-md text-on-surface-variant">{t('page.editor.aiToolsComingSoon')}</p>
          </div>
        )}
        <div className="overflow-y-auto p-sm lg:p-md bg-surface-container-low/50">
          <ResumePreview
            templateId={state.templateId}
            personalDetails={state.personalDetails}
            sections={state.sections}
            customize={state.customize}
          />
        </div>
      </div>
    </div>
  );
}

export default function ResumeEditorPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout user={user}>
      <ResumeEditorProvider>
        <ResumeEditorContent />
      </ResumeEditorProvider>
    </DashboardLayout>
  );
}
