import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Download, Eye, FileText, Loader2, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../features/resumeBuilder/components/ResumeFormFields';
import { formatDate, formatFileSize } from '../../features/resumeBuilder/services/resumeBuilderService';
import { useResumeBuilderActions, useResumeHistory } from '../../features/resumeBuilder/hooks/useResumeBuilder';

export default function ResumeHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { deleteResume, exportResume } = useResumeBuilderActions();
  const { data, isLoading, error, refetch, isFetching } = useResumeHistory({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  const handleSearch = (event) => {
    event.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const handleDeleteResume = async (resumeId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await deleteResume(resumeId);
      toast.success('Resume deleted successfully.');
      refetch();
    } catch {
      toast.error('Failed to delete resume.');
    }
  };

  const handleExportResume = async (resumeId, fileName) => {
    try {
      const response = await exportResume(resumeId, true);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Resume data exported successfully.');
    } catch {
      toast.error('Failed to export resume data.');
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <PageContainer width="standard">
          <div className="text-center py-16 space-y-4">
            <FileText className="mx-auto h-12 w-12 text-error" />
            <p className="text-on-surface-variant">{error.response?.data?.message || 'Something went wrong'}</p>
            <Button variant="primary" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer width="wide">
        <PageHeader
          title="Resume History"
          description="View and manage all your uploaded resumes."
          actions={
            <Link to="/resume/upload">
              <Button variant="primary" className="px-4 py-2">
                Upload New Resume
              </Button>
            </Link>
          }
        />

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                type="text"
                placeholder="Search by filename, name, email, or skills..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
              />
            </form>
            <div className="flex flex-wrap gap-2">
              {['', 'completed', 'processing', 'failed'].map((status) => (
                <Button
                  key={status || 'all'}
                  variant={statusFilter === status ? 'primary' : 'secondary'}
                  className="px-3 py-1.5 text-sm"
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
            <h2 className="font-headline-section text-headline-section text-on-surface">
              Resumes ({data?.pagination?.totalResumes || 0})
            </h2>
            <Button variant="secondary" className="gap-2 px-3 py-1.5 text-sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-secondary" />
            </div>
          ) : data?.resumes?.length ? (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-outline-variant">
                  <thead className="bg-surface-container">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Resume</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase">Uploaded</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-on-surface-variant uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.resumes.map((resume) => (
                      <tr key={resume.id} className="hover:bg-surface-container-low">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-on-surface">{resume.originalFileName}</div>
                          {resume.fullName && <div className="text-sm text-on-surface-variant">{resume.fullName}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={resume.processingStatus} />
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">{formatFileSize(resume.fileSize || 0)}</td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(resume.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {resume.processingStatus === 'completed' && (
                              <Link to={`/resume/${resume.id}/edit`}>
                                <Button variant="secondary" className="p-2">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Link to={`/resume/${resume.id}`}>
                              <Button variant="secondary" className="p-2">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {resume.processingStatus === 'completed' && (
                              <Button
                                variant="secondary"
                                className="p-2"
                                onClick={() => handleExportResume(resume.id, resume.originalFileName)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              className="p-2"
                              onClick={() => handleDeleteResume(resume.id, resume.originalFileName)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.pagination?.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-outline-variant px-5 py-4">
                  <p className="text-sm text-on-surface-variant">
                    Page {data.pagination.currentPage} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-sm"
                      disabled={!data.pagination.hasPrev}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-sm"
                      disabled={!data.pagination.hasNext}
                      onClick={() => setCurrentPage((page) => page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 space-y-4">
              <FileText className="mx-auto h-12 w-12 text-outline" />
              <p className="text-on-surface-variant">No resumes found.</p>
              <Link to="/resume/upload">
                <Button variant="primary">Upload Resume</Button>
              </Link>
            </div>
          )}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
