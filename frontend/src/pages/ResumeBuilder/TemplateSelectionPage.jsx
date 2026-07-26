import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import TemplateCard from '../../features/resumeBuilder/components/TemplateCard';
import TemplatePreviewModal from '../../features/resumeBuilder/components/TemplatePreviewModal';
import StartChoiceModal from '../../features/resumeBuilder/components/StartChoiceModal';
import ImportResumeModal from '../../features/resumeBuilder/components/ImportResumeModal';
import ImportProcessingModal from '../../features/resumeBuilder/components/ImportProcessingModal';
import { TEMPLATE_CATEGORIES, filterTemplates } from '../../features/resumeBuilder/data/resumeTemplates';
import {
  useCreateBuiltResume,
  useImportBuiltResume,
} from '../../features/resumeBuilder/hooks/useResumeBuilder';
import { resolveApiError } from '../../utils/apiError';
import { cn } from '../../lib/utils';
import {
  selectedOptionClass,
  unselectedOptionClass,
} from '../../components/ui/colorAccentTokens';
import { buttonSecondaryClass } from '../../components/ui/buttonTokens';

export default function TemplateSelectionPage() {
  const { t } = useTranslation('resumeBuilder');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [startChoiceOpen, setStartChoiceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);

  const createResume = useCreateBuiltResume();
  const importResume = useImportBuiltResume();

  const templates = useMemo(() => filterTemplates(category), [category]);

  const openPreview = (template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleUseTemplate = () => {
    setPreviewOpen(false);
    setStartChoiceOpen(true);
  };

  const goToEditor = (resumeId) => {
    navigate(`/resume/editor/${resumeId}`);
  };

  const handleStartBlank = async () => {
    if (!selectedTemplate) return;

    try {
      setStartChoiceOpen(false);
      const result = await createResume.mutateAsync({ templateId: selectedTemplate.id });
      goToEditor(result.resume.id);
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.createFailed')));
    }
  };

  const runImport = async ({ file, pastedText, mode }) => {
    if (!selectedTemplate) return;

    setImportOpen(false);
    setProcessingOpen(true);

    try {
      const result = await importResume.mutateAsync({
        templateId: selectedTemplate.id,
        file,
        pastedText,
        mode,
      });

      setProcessingOpen(false);
      setStartChoiceOpen(false);
      goToEditor(result.resume.id);
      const sectionCount = result.resume?.sections?.length || 0;
      if (sectionCount > 0) {
        toast.success(t('toasts.importSuccessWithSections', { count: sectionCount }));
      } else {
        toast.success(t('toasts.importSuccessEmpty'));
      }
    } catch (error) {
      setProcessingOpen(false);
      toast.error(resolveApiError(error, t('toasts.importFailed')));
    }
  };

  return (
    <DashboardLayout user={user}>
      <PageContainer>
        <PageHeader
          title={t('page.templateSelection.title')}
          description={t('page.templateSelection.description')}
          actions={
            <button
              type="button"
              onClick={() => {
                if (!selectedTemplate) {
                  toast.info(t('toasts.selectTemplateFirst'));
                  return;
                }
                setImportOpen(true);
              }}
              className={cn(buttonSecondaryClass, 'px-md py-sm')}
            >
              {t('page.templateSelection.importButton')}
            </button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {TEMPLATE_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                'rounded-full border-2 px-md py-sm font-label-md transition-all duration-150',
                category === item.id ? selectedOptionClass : unselectedOptionClass
              )}
            >
              {t(`categories.${item.id}`)}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-dashboard-gutter">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onClick={openPreview} />
          ))}
        </div>
      </PageContainer>

      <TemplatePreviewModal
        open={previewOpen}
        template={selectedTemplate}
        onClose={() => setPreviewOpen(false)}
        onUseTemplate={handleUseTemplate}
      />

      <StartChoiceModal
        open={startChoiceOpen}
        onClose={() => setStartChoiceOpen(false)}
        onImport={() => {
          setStartChoiceOpen(false);
          setImportOpen(true);
        }}
        onBlank={handleStartBlank}
      />

      <ImportResumeModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportFile={(file) => runImport({ file, mode: 'file' })}
        onImportPaste={(pastedText) => runImport({ pastedText, mode: 'paste' })}
      />

      <ImportProcessingModal open={processingOpen} />
    </DashboardLayout>
  );
}
