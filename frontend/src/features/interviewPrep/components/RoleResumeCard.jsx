import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { authInputClassName } from '../../../components/auth/authUi';
import RoleAutocompleteInput from './RoleAutocompleteInput';
import { CARD_CLASS, SELECTED_OPTION_CLASS, UNSELECTED_OPTION_CLASS } from './InterviewSetupAdvanced';
import SectionHeading from '../../../components/ui/SectionHeading';
import Button from '../../../components/ui/Button';
import { analyzeInterviewResume } from '../services/mockInterviewService';
import { getApiErrorMessage } from '../utils/apiErrorUtils';
import { cn } from '../../../lib/utils';

const ACCEPT = '.pdf,.doc,.docx';

function ResumeAnalysisResult({ projects, skills, onClear }) {
  const { t } = useTranslation('interviewPrep');
  const hasProjects = Array.isArray(projects) && projects.length > 0;
  const hasSkills = Array.isArray(skills) && skills.length > 0;

  return (
    <div className="rounded-xl border-2 border-secondary/40 bg-secondary/[0.05] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AppIcon name="check_circle" size="sm" className="text-secondary" />
          <h3 className="font-label-md text-on-surface">{t('roleResume.analysisTitle')}</h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="font-label-sm text-on-surface-variant hover:text-secondary transition-colors"
        >
          {t('roleResume.clear')}
        </button>
      </div>

      {hasProjects ? (
        <div className="space-y-1">
          <p className="font-label-sm text-on-surface-variant">{t('roleResume.projects')}</p>
          <ul className="list-disc pl-5 space-y-0.5 font-body-md text-on-surface text-sm">
            {projects.map((project, index) => (
              <li key={`project-${index}`}>{project}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasSkills ? (
        <div className="space-y-1.5">
          <p className="font-label-sm text-on-surface-variant">{t('roleResume.skills')}</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, index) => (
              <span
                key={`skill-${index}`}
                className="rounded-full bg-secondary/10 text-secondary px-2.5 py-1 font-label-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {!hasProjects && !hasSkills ? (
        <p className="font-body-md text-on-surface-variant text-sm">
          {t('roleResume.noSkillsDetected')}
        </p>
      ) : null}
    </div>
  );
}

export default function RoleResumeCard({
  role,
  onRoleChange,
  onRoleBlur,
  showRoleError,
  experience,
  onExperienceChange,
  targetCompany,
  onTargetCompanyChange,
  resumeSkills,
  resumeProjects,
  onAnalysisComplete,
  onAnalysisClear,
}) {
  const { t } = useTranslation('interviewPrep');
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelected = (selected) => {
    if (!selected) return;
    setFile(selected);
    setAnalyzed(false);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file || analyzing) return;

    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeInterviewResume(file);
      onAnalysisComplete({
        text: result?.text || '',
        skills: Array.isArray(result?.skills) ? result.skills : [],
        projects: Array.isArray(result?.projects) ? result.projects : [],
      });
      setAnalyzed(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t('roleResume.analyzeFailed')));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setAnalyzed(false);
    setError(null);
    onAnalysisClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className={CARD_CLASS}>
      <SectionHeading
        color="role"
        icon="person"
        title={t('roleResume.title')}
        description={t('roleResume.description')}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2 relative overflow-visible">
          <label htmlFor="mock-role-input" className="sr-only">
            {t('roleResume.roleLabel')}
          </label>
          <RoleAutocompleteInput
            value={role}
            onChange={onRoleChange}
            onBlur={onRoleBlur}
            hasError={showRoleError}
            placeholder={t('roleResume.rolePlaceholder')}
          />
          {showRoleError ? (
            <p className="font-label-sm text-error">{t('roleResume.roleRequired')}</p>
          ) : null}
        </div>

        <input
          type="text"
          value={experience}
          onChange={(event) => onExperienceChange(event.target.value)}
          placeholder={t('roleResume.experiencePlaceholder')}
          className={authInputClassName}
        />

        <input
          type="text"
          value={targetCompany}
          onChange={(event) => onTargetCompanyChange(event.target.value)}
          placeholder={t('roleResume.companyPlaceholder')}
          className={authInputClassName}
          autoComplete="organization"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          handleFileSelected(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      {analyzed ? (
        <ResumeAnalysisResult
          projects={resumeProjects}
          skills={resumeSkills}
          onClear={handleClear}
        />
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFileSelected(event.dataTransfer.files?.[0]);
          }}
          className={cn(
            'rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-150',
            isDragging
              ? 'border-secondary bg-secondary/[0.06]'
              : file
                ? 'border-secondary/50 bg-secondary/[0.04]'
                : 'border-[#DCE2EA] bg-[#FAFBFC] hover:border-[#B9C2CE] hover:bg-[#F5F7FA]'
          )}
        >
          <span
            className={cn(
              'mx-auto mb-2.5 inline-flex h-11 w-11 items-center justify-center rounded-xl',
              file ? 'bg-secondary/15' : 'bg-secondary/10'
            )}
          >
            <AppIcon name={file ? 'description' : 'upload_file'} size="md" className="text-secondary" />
          </span>

          {file ? (
            <>
              <span className="font-label-md text-on-surface block truncate px-2">{file.name}</span>
              <span className="font-body-md text-on-surface-variant text-sm mt-0.5 block">
                {t('roleResume.readyToAnalyze')}
              </span>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="gap-2 rounded-lg px-4 py-2"
                >
                  {analyzing ? (
                    <>
                      <AppIcon name="progress_activity" size="sm" spin className="text-on-secondary" />
                      {t('roleResume.analyzing')}
                    </>
                  ) : (
                    t('roleResume.analyzeResume')
                  )}
                </Button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={analyzing}
                  className="font-label-sm text-on-surface-variant hover:text-secondary transition-colors disabled:opacity-60"
                >
                  {t('roleResume.remove')}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <span className="font-label-md text-secondary block">
                {t('roleResume.uploadCta')}
              </span>
              <span className="font-body-md text-on-surface-variant text-sm mt-0.5 block">
                {t('roleResume.uploadHint')}
              </span>
            </button>
          )}
        </div>
      )}

      {error ? <p className="font-label-sm text-error">{error}</p> : null}
    </section>
  );
}
