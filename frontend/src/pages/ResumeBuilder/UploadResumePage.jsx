import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { CheckCircle2, FileText, History, Loader2, PenLine, Upload, X, XCircle } from 'lucide-react';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import Button from '../../components/ui/Button';
import {
  createBlankResume,
  formatFileSize,
  uploadResume,
} from '../../features/resumeBuilder/services/resumeBuilderService';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 5 * 1024 * 1024;

export default function UploadResumePage() {
  const { t } = useTranslation('resumeBuilder');
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingBlank, setIsCreatingBlank] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only PDF and DOCX files are allowed.';
    }
    if (file.size > MAX_SIZE) {
      return 'File must be 5MB or smaller.';
    }
    return null;
  };

  const addFiles = useCallback((files) => {
    const next = [];

    [...files].forEach((file) => {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        return;
      }

      next.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0,
        error: null,
        resumeId: null,
        retryable: false,
      });
    });

    if (next.length) {
      setUploadedFiles((prev) => [...prev, ...next]);
    }
  }, []);

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  const uploadFile = async (fileWithId) => {
    const { id, file } = fileWithId;

    setUploadedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'uploading', error: null } : item))
    );

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await uploadResume(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress((prev) => ({ ...prev, [id]: progress }));
      });

      if (response.resume?.processingStatus === 'completed') {
        setUploadedFiles((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'completed',
                  resumeId: response.resume.id,
                  parsedData: response.resume.parsedData,
                }
              : item
          )
        );
        toast.success(`${file.name} uploaded and processed successfully.`);
      } else {
        throw new Error(response.message || 'Processing failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
      const resumeId = error.response?.data?.resume?.id;
      const retryable = error.response?.data?.retryable;

      setUploadedFiles((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'error', error: errorMessage, resumeId: resumeId || item.resumeId, retryable }
            : item
        )
      );
      toast.error(`${file.name}: ${errorMessage}`);
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = uploadedFiles.filter((item) => item.status === 'pending');
    if (!pendingFiles.length) return;

    setIsUploading(true);
    for (const fileWithId of pendingFiles) {
      await uploadFile(fileWithId);
    }
    setIsUploading(false);
  };

  const handleStartFromScratch = async () => {
    setIsCreatingBlank(true);
    try {
      const response = await createBlankResume('classic');
      const resumeId = response?.resume?.id;
      if (!resumeId) {
        throw new Error(t('toasts.createFailed'));
      }
      toast.success(t('toasts.createSuccess'));
      navigate(`/resume/${resumeId}/edit`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || t('toasts.createFailed'));
    } finally {
      setIsCreatingBlank(false);
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const pendingCount = uploadedFiles.filter((item) => item.status === 'pending').length;

  return (
    <DashboardLayout>
      <PageContainer width="standard">
        <PageHeader
          title="Upload Resume"
          description="Upload your resume in PDF or DOCX format for AI-powered parsing."
          actions={
            <Link to="/resume/history">
              <Button variant="secondary" className="gap-2 px-4 py-2">
                <History className="h-4 w-4" />
                History
              </Button>
            </Link>
          }
        />

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive
              ? 'border-secondary bg-surface-container'
              : 'border-outline-variant bg-surface-container-lowest hover:border-secondary/60'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <Upload className="mx-auto h-12 w-12 text-outline" />
          <p className="mt-4 text-lg font-medium text-on-surface">
            {isDragActive ? 'Drop your resume here' : 'Drag and drop your resume here'}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">or click to browse files</p>
          <p className="mt-2 text-xs text-on-surface-variant">PDF and DOCX up to 5MB</p>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-3 text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              or
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <PenLine className="h-5 w-5 text-secondary shrink-0" />
                <h2 className="text-base font-semibold text-on-surface">
                  {t('startChoice.startFromScratch')}
                </h2>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">
                {t('startChoice.startFromScratchDescription')}
              </p>
            </div>
            <Button
              variant="primary"
              className="gap-2 px-5 py-2.5 shrink-0"
              onClick={handleStartFromScratch}
              disabled={isCreatingBlank || isUploading}
            >
              {isCreatingBlank ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4" />
              )}
              {isCreatingBlank ? t('startChoice.creating') : t('startChoice.startFromScratch')}
            </Button>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <div className="border-b border-outline-variant px-5 py-4">
              <h2 className="font-headline-section text-headline-section text-on-surface">
                Uploaded Files ({uploadedFiles.length})
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {uploadedFiles.map((fileWithId) => (
                <div
                  key={fileWithId.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant p-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {fileWithId.status === 'completed' ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                    ) : fileWithId.status === 'error' ? (
                      <XCircle className="h-8 w-8 text-error shrink-0" />
                    ) : fileWithId.status === 'uploading' ? (
                      <Loader2 className="h-8 w-8 text-secondary animate-spin shrink-0" />
                    ) : (
                      <FileText className="h-8 w-8 text-outline shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-on-surface truncate">{fileWithId.file.name}</p>
                      <p className="text-sm text-on-surface-variant">{formatFileSize(fileWithId.file.size)}</p>
                      {fileWithId.status === 'uploading' && uploadProgress[fileWithId.id] !== undefined && (
                        <div className="mt-2 h-2 w-full rounded-full bg-surface-container">
                          <div
                            className="h-2 rounded-full bg-secondary transition-all"
                            style={{ width: `${uploadProgress[fileWithId.id]}%` }}
                          />
                        </div>
                      )}
                      {fileWithId.error && (
                        <p className="mt-1 text-sm text-error">{fileWithId.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {fileWithId.status === 'completed' && fileWithId.resumeId && (
                      <Button
                        variant="primary"
                        className="px-3 py-1.5 text-sm"
                        onClick={() => navigate(`/resume/${fileWithId.resumeId}/edit`)}
                      >
                        Edit Resume
                      </Button>
                    )}
                    {fileWithId.status !== 'uploading' && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeFile(fileWithId.id);
                        }}
                        className="p-2 text-outline hover:text-error transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {pendingCount > 0 && (
                <div className="flex justify-end border-t border-outline-variant pt-4">
                  <Button
                    variant="primary"
                    className="gap-2 px-4 py-2"
                    onClick={handleUploadAll}
                    disabled={isUploading || isCreatingBlank}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
