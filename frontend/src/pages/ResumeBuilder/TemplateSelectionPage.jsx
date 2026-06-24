import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
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

export default function TemplateSelectionPage() {
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
      toast.error(error?.response?.data?.message || 'Could not create resume.');
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
        toast.success(`Resume imported with ${sectionCount} sections. Click a section to edit.`);
      } else {
        toast.success('Resume imported. Add or edit sections on the left.');
      }
    } catch (error) {
      setProcessingOpen(false);
      toast.error(error?.response?.data?.message || 'Import failed.');
    }
  };

  return (
    <DashboardLayout user={user}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-sm mb-md">
          <div>
            <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
              Start building your resume
            </h1>
            <p className="font-body-md text-on-surface-variant mt-1">
              Choose a design you like. You can customize or switch it later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!selectedTemplate) {
                toast.info('Select a template first, then import your resume.');
                return;
              }
              setImportOpen(true);
            }}
            className="rounded-xl border border-outline-variant px-md py-sm font-label-md text-on-surface hover:border-secondary/40 hover:text-secondary transition-colors"
          >
            Import existing resume
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-md">
          {TEMPLATE_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`rounded-full px-md py-sm font-label-md transition-colors ${
                category === item.id
                  ? 'bg-secondary text-white'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-dashboard-gutter">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onClick={openPreview} />
          ))}
        </div>
      </div>

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
