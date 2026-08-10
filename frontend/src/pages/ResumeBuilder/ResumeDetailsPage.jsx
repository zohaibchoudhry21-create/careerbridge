import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Briefcase,
  Download,
  FileText,
  GraduationCap,
  Lightbulb,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Trash2,
  User,
} from 'lucide-react';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/Skeleton';
import ResumePreview from '../../features/resumeBuilder/components/ResumePreview';
import { StatusBadge } from '../../features/resumeBuilder/components/ResumeFormFields';
import { DEFAULT_TEMPLATE } from '../../features/resumeBuilder/components/templatesConfig';
import { useParsedResume, useResumeBuilderActions } from '../../features/resumeBuilder/hooks/useResumeBuilder';
import { formatDate, formatFileSize } from '../../features/resumeBuilder/services/resumeBuilderService';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

export default function ResumeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useParsedResume(id);
  const { deleteResume, exportResume } = useResumeBuilderActions();

  const resume = data?.resume;
  const parsedData = resume?.parsedData || {};

  const handleExportResume = async () => {
    if (!resume) return;
    try {
      const response = await exportResume(id, true);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.originalFileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Resume data exported successfully.');
    } catch {
      toast.error('Failed to export resume data.');
    }
  };

  const handleDeleteResume = async () => {
    if (!resume) return;
    if (!window.confirm(`Are you sure you want to delete "${resume.originalFileName}"?`)) return;

    try {
      await deleteResume(id);
      toast.success('Resume deleted successfully.');
      navigate('/resume/history');
    } catch {
      toast.error('Failed to delete resume.');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer width="wide">
          <div className="space-y-6">
            <Skeleton type="avatar" size="lg" label="Loading resume details" />
            <Skeleton type="card" count={2} withMedia={false} lines={4} columnsGrid={2} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton type="card" count={1} withMedia={false} lines={6} />
              <Skeleton type="text" lines={12} />
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error || !resume) {
    return (
      <DashboardLayout>
        <PageContainer width="standard">
          <div className="text-center py-16 space-y-4">
            <FileText className="mx-auto h-12 w-12 text-error" />
            <p className="text-on-surface-variant">Resume not found.</p>
            <Link to="/resume/history">
              <Button variant="primary">Back to History</Button>
            </Link>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer width="wide">
        <PageHeader
          title={resume.originalFileName}
          description={
            <span className="inline-flex items-center gap-2">
              <StatusBadge status={resume.processingStatus} />
              {resume.aiConfidence ? `AI Confidence: ${resume.aiConfidence}%` : null}
            </span>
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {resume.processingStatus === 'completed' && (
                <Link to={`/resume/${id}/edit`}>
                  <Button variant="primary" className="px-3 py-1.5 text-sm">
                    Edit Resume
                  </Button>
                </Link>
              )}
              <Button variant="secondary" className="gap-2 px-3 py-1.5 text-sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {resume.processingStatus === 'completed' && (
                <Button variant="secondary" className="gap-2 px-3 py-1.5 text-sm" onClick={handleExportResume}>
                  <Download className="h-4 w-4" />
                  Export JSON
                </Button>
              )}
              <Button variant="destructive" className="gap-2 px-3 py-1.5 text-sm" onClick={handleDeleteResume}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          }
        />

        <Link to="/resume/history" className="inline-flex items-center gap-1 text-sm text-secondary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
          <h2 className="font-headline-section text-headline-section text-on-surface mb-4">Resume Information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-on-surface-variant">File Name</dt>
              <dd className="text-on-surface mt-1">{resume.originalFileName}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">File Size</dt>
              <dd className="text-on-surface mt-1">{formatFileSize(resume.fileSize)}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Uploaded</dt>
              <dd className="text-on-surface mt-1">{formatDate(resume.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Last Updated</dt>
              <dd className="text-on-surface mt-1">{formatDate(resume.updatedAt)}</dd>
            </div>
          </dl>
        </div>

        {resume.processingStatus === 'failed' && (
          <div className="rounded-2xl border border-error bg-error-container p-5">
            <h3 className="font-medium text-error">Processing Failed</h3>
            <p className="mt-2 text-sm text-on-surface">{resume.processingError || 'An error occurred while processing this resume.'}</p>
          </div>
        )}

        {resume.processingStatus === 'completed' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
              <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
                <h2 className="font-headline-section text-headline-section text-on-surface">Resume Preview</h2>
                <Link to={`/resume/${id}/edit`}>
                  <Button variant="primary" className="px-3 py-1.5 text-sm">
                    Change Template / Edit
                  </Button>
                </Link>
              </div>
              <div className="bg-surface-dim p-4 overflow-x-auto">
                <div className="max-w-[210mm] mx-auto scale-[0.85] origin-top">
                  <ResumePreview data={parsedData} templateId={resume.templateId || DEFAULT_TEMPLATE} />
                </div>
              </div>
            </div>

            {(parsedData.fullName || parsedData.email || parsedData.phone || parsedData.address) && (
              <InfoCard title="Personal Information" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {parsedData.fullName && <InfoItem label="Full Name" value={parsedData.fullName} />}
                  {parsedData.email && <InfoItem label="Email" value={parsedData.email} icon={Mail} />}
                  {parsedData.phone && <InfoItem label="Phone" value={parsedData.phone} icon={Phone} />}
                  {parsedData.address && <InfoItem label="Address" value={parsedData.address} icon={MapPin} />}
                </div>
              </InfoCard>
            )}

            {parsedData.summary && (
              <InfoCard title="Professional Summary" icon={FileText}>
                <div
                  className="text-sm text-on-surface [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(parsedData.summary) }}
                />
              </InfoCard>
            )}

            {parsedData.skills?.length > 0 && (
              <InfoCard title="Skills" icon={Lightbulb}>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, index) => (
                    <span key={index} className="rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface">
                      {skill}
                    </span>
                  ))}
                </div>
              </InfoCard>
            )}

            {parsedData.experience?.length > 0 && (
              <InfoCard title="Work Experience" icon={Briefcase}>
                <div className="space-y-4">
                  {parsedData.experience.map((exp, index) => (
                    <div key={index} className="border-s-4 border-secondary/30 ps-4">
                      <p className="text-sm font-medium text-on-surface">{exp.position}</p>
                      <p className="text-sm text-on-surface-variant">{exp.company}</p>
                      <p className="text-sm text-on-surface-variant">
                        {exp.startDate} - {exp.endDate}
                      </p>
                      {exp.description && <p className="mt-2 text-sm text-on-surface whitespace-pre-wrap">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {parsedData.education?.length > 0 && (
              <InfoCard title="Education" icon={GraduationCap}>
                <div className="space-y-4">
                  {parsedData.education.map((edu, index) => (
                    <div key={index} className="border-s-4 border-secondary-container/30 ps-4">
                      <p className="text-sm font-medium text-on-surface">
                        {edu.degree}
                        {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </p>
                      <p className="text-sm text-on-surface-variant">{edu.institution}</p>
                      <p className="text-sm text-on-surface-variant">
                        {edu.startDate} - {edu.endDate}
                        {edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {(parsedData.linkedinLink || parsedData.githubLink) && (
              <InfoCard title="Links" icon={LinkIcon}>
                <div className="space-y-2 text-sm">
                  {parsedData.linkedinLink && (
                    <a href={parsedData.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">
                      LinkedIn Profile
                    </a>
                  )}
                  {parsedData.githubLink && (
                    <a href={parsedData.githubLink} target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline block">
                      GitHub Profile
                    </a>
                  )}
                </div>
              </InfoCard>
            )}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

function InfoCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
      <div className="border-b border-outline-variant px-5 py-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-secondary" />
        <h2 className="font-headline-section text-headline-section text-on-surface">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div>
      <dt className="text-on-surface-variant flex items-center gap-1">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </dt>
      <dd className="text-on-surface mt-1">{value}</dd>
    </div>
  );
}
