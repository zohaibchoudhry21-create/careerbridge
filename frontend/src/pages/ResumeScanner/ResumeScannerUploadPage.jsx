import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { resolveApiError } from '../../utils/apiError';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import AnalyzeOverlay from '../../features/resumeScanner/components/AnalyzeOverlay';
import JobDescriptionPanel from '../../features/resumeScanner/components/JobDescriptionPanel';
import ResumeUploadPanel from '../../features/resumeScanner/components/ResumeUploadPanel';
import {
  useResumeScannerAnalysis,
  useResumeScannerStatus,
  useSavedScannerResumes,
  useUploadResumeScanner,
} from '../../features/resumeScanner/hooks/useResumeScanner';

export default function ResumeScannerUploadPage() {
  const { t } = useTranslation('resumeScanner');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resumeTab, setResumeTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [selectedSavedResume, setSelectedSavedResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const { data: savedResumes = [], isLoading: savedLoading } = useSavedScannerResumes();
  const uploadMutation = useUploadResumeScanner();
  const { data: statusData } = useResumeScannerStatus(activeAnalysisId, overlayOpen);
  const { data: analysisData } = useResumeScannerAnalysis(
    activeAnalysisId,
    overlayOpen && statusData?.status === 'completed'
  );

  useEffect(() => {
    if (!overlayOpen || !statusData) return;

    if (statusData.status === 'failed') {
      setOverlayOpen(false);
      setActiveAnalysisId(null);
      toast.error(statusData.errorMessage || t('overlay.failed'));
    }
  }, [overlayOpen, statusData, t]);

  useEffect(() => {
    if (!overlayOpen || statusData?.status !== 'completed' || !analysisData) return;

    const timer = setTimeout(() => {
      setOverlayOpen(false);
      navigate(`/resume-scanner/${activeAnalysisId}`);
      setActiveAnalysisId(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [overlayOpen, statusData?.status, analysisData, activeAnalysisId, navigate]);

  const handleFileSelect = (file, errorMessage = '') => {
    setSelectedFile(file);
    setFileError(errorMessage);
    if (file) {
      setResumeTab('upload');
    }
  };

  const handleAnalyze = async () => {
    const trimmedJobDescription = jobDescription.trim();

    if (!trimmedJobDescription) {
      toast.error(t('upload.errors.jobDescriptionRequired'));
      return;
    }

    if (resumeTab === 'upload') {
      if (!selectedFile) {
        toast.error(t('upload.errors.fileRequired'));
        return;
      }
      if (fileError) {
        toast.error(fileError);
        return;
      }
    } else if (!selectedSavedResume) {
      toast.error(t('upload.errors.savedResumeRequired'));
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file: resumeTab === 'upload' ? selectedFile : undefined,
        jobDescription: trimmedJobDescription,
        mode: resumeTab === 'saved' ? 'saved' : 'upload',
        resumeSourceType: selectedSavedResume?.sourceType,
        resumeSourceId: selectedSavedResume?.id,
      });

      setActiveAnalysisId(result.analysisId);
      setOverlayOpen(true);
    } catch (error) {
      toast.error(resolveApiError(error, t('upload.errors.analyzeFailed')));
    }
  };

  const matchedSkills =
    analysisData?.matchedSkills?.length > 0
      ? analysisData.matchedSkills
      : analysisData?.skills?.filter((skill) => skill.matched) || [];

  return (
    <DashboardLayout user={user}>
      <PageContainer>
        <PageHeader title={t('page.upload.title')} description={t('page.upload.description')} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-md items-start">
          <ResumeUploadPanel
            activeTab={resumeTab}
            onTabChange={setResumeTab}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            savedResumes={savedResumes}
            savedLoading={savedLoading}
            selectedSavedResume={selectedSavedResume}
            onSelectSavedResume={setSelectedSavedResume}
            fileError={fileError}
          />

          <JobDescriptionPanel
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            onClear={() => setJobDescription('')}
            onAnalyze={handleAnalyze}
            isAnalyzing={uploadMutation.isPending || overlayOpen}
          />
        </div>
      </PageContainer>

      <AnalyzeOverlay
        open={overlayOpen}
        progress={statusData?.progress ?? 5}
        status={statusData?.status ?? 'pending'}
        statusMessage={statusData?.statusMessage}
        extractedSkills={matchedSkills}
      />
    </DashboardLayout>
  );
}
