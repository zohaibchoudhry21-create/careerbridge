import { useRef, useState } from 'react';
import AppIcon from '../../../components/icons/AppIcon';
import { authInputClassName } from '../../../components/auth/authUi';
import {
  DEFAULT_INTERVIEW_SETUP_MODE,
  INTERVIEW_FOCUS_AREAS,
  INTERVIEW_SETUP_MODE_OPTIONS,
  MAX_INTERVIEW_CONTEXT_TEXT_LENGTH,
} from '../constants/interviewPrepConstants';
import { extractInterviewContextText } from '../services/mockInterviewService';
import { cn } from '../../../lib/utils';

const ACCEPT = '.pdf,.doc,.docx';

export const CARD_CLASS =
  'rounded-2xl border border-[#E7EBF0] bg-white p-5 space-y-3.5 min-w-0 transition-all duration-150 hover:border-[#D4DAE2]';

/** Soft per-section icon tints (background + darker icon shade). */
export const ICON_TINTS = {
  resume: 'bg-violet-50 text-violet-600',
  role: 'bg-blue-50 text-blue-600',
  difficulty: 'bg-orange-50 text-orange-600',
  time: 'bg-teal-50 text-teal-600',
  focus: 'bg-pink-50 text-pink-600',
  mode: 'bg-emerald-50 text-emerald-600',
};

/** Shared selected / unselected styling for option chips and buttons. */
export const SELECTED_OPTION_CLASS =
  'border-secondary bg-secondary/[0.06] text-secondary';
export const UNSELECTED_OPTION_CLASS =
  'border-[#E2E7EE] bg-white text-on-surface-variant hover:border-[#C3CBD6] hover:bg-[#FAFBFC]';

const MODE_ICONS = {
  video_voice: 'videocam',
  voice_only: 'mic',
  text_only: 'edit_note',
};

export function SectionHeader({ icon, iconClassName, title, description, optional = false }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              iconClassName
            )}
          >
            <AppIcon name={icon} size="sm" />
          </span>
          <h2 className="font-headline-section text-headline-section text-on-surface">{title}</h2>
        </div>
        {optional ? (
          <span className="shrink-0 rounded-full bg-[#F1F3F7] px-2.5 py-1 font-label-sm text-on-surface-variant">
            Optional
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="font-body-md text-on-surface-variant text-sm pl-[42px]">{description}</p>
      ) : null}
    </div>
  );
}

export function ResumeContextSection({ resumeText, onResumeTextChange, jobDescriptionText, onJobDescriptionTextChange }) {
  const [extracting, setExtracting] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteTab, setPasteTab] = useState('resume');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const hasUploadedContext = Boolean(resumeText.trim() || jobDescriptionText.trim());

  const handleFileUpload = async (file) => {
    if (!file) return;

    setExtracting(true);
    try {
      const result = await extractInterviewContextText(file);
      const text = String(result?.text || '').slice(0, MAX_INTERVIEW_CONTEXT_TEXT_LENGTH);
      onResumeTextChange(text);
    } catch {
      // Silent — user can still paste text manually
    } finally {
      setExtracting(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileUpload(event.dataTransfer.files?.[0]);
  };

  const activePasteText = pasteTab === 'job' ? jobDescriptionText : resumeText;
  const onActivePasteChange =
    pasteTab === 'job' ? onJobDescriptionTextChange : onResumeTextChange;

  return (
    <section className={CARD_CLASS}>
      <SectionHeader
        icon="description"
        iconClassName={ICON_TINTS.resume}
        title="Resume or job description"
        description="Upload a resume or paste a job description so questions match your background."
        optional
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          handleFileUpload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <button
        type="button"
        disabled={extracting}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'w-full rounded-xl border-2 border-dashed px-4 py-12 text-center transition-all duration-150',
          isDragging
            ? 'border-secondary bg-secondary/[0.04]'
            : 'border-[#DCE2EA] bg-[#FAFBFC] hover:border-[#B9C2CE] hover:bg-[#F5F7FA]',
          extracting && 'opacity-60 cursor-not-allowed'
        )}
      >
        {extracting ? (
          <span className="inline-flex items-center gap-2 font-label-md text-on-surface-variant">
            <AppIcon name="progress_activity" size="sm" spin className="text-secondary" />
            Extracting text…
          </span>
        ) : (
          <>
            <span className="mx-auto mb-2.5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10">
              <AppIcon name="upload_file" size="md" className="text-secondary" />
            </span>
            <span className="font-label-md text-on-surface block">
              Drop a PDF here, or click to browse
            </span>
            {hasUploadedContext ? (
              <span className="font-body-md text-secondary text-sm mt-1 block">
                Document text added — ready for targeted questions
              </span>
            ) : null}
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => setShowPaste((value) => !value)}
        className="font-label-sm text-secondary hover:underline"
      >
        {showPaste ? 'Hide paste area' : 'Or paste text instead'}
      </button>

      {showPaste ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'resume', label: 'Resume' },
              { id: 'job', label: 'Job description' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPasteTab(tab.id)}
                className={cn(
                  'rounded-full border px-3 py-1 font-label-sm transition-all duration-150',
                  pasteTab === tab.id
                    ? SELECTED_OPTION_CLASS
                    : UNSELECTED_OPTION_CLASS
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <textarea
            value={activePasteText}
            onChange={(event) =>
              onActivePasteChange(event.target.value.slice(0, MAX_INTERVIEW_CONTEXT_TEXT_LENGTH))
            }
            rows={4}
            placeholder={
              pasteTab === 'job'
                ? 'Paste the job description or key requirements…'
                : 'Paste resume highlights, experience, or skills…'
            }
            className={cn(authInputClassName, 'resize-y min-h-[100px]')}
          />
        </div>
      ) : null}
    </section>
  );
}

export function FocusAreasSection({ focusAreas, onFocusAreasChange }) {
  const toggleFocusArea = (area) => {
    if (focusAreas.includes(area)) {
      onFocusAreasChange(focusAreas.filter((item) => item !== area));
      return;
    }
    onFocusAreasChange([...focusAreas, area]);
  };

  return (
    <section className={CARD_CLASS}>
      <SectionHeader
        icon="target"
        iconClassName={ICON_TINTS.focus}
        title="Focus areas"
        description="Pick what the interview should emphasize."
      />
      <div className="flex flex-wrap gap-2">
        {INTERVIEW_FOCUS_AREAS.map((area) => {
          const selected = focusAreas.includes(area);
          return (
            <button
              key={area}
              type="button"
              onClick={() => toggleFocusArea(area)}
              className={cn(
                'rounded-full border-2 px-4 py-2 font-label-sm transition-all duration-150',
                selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
              )}
            >
              {area}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function InterviewModeSection({ interviewMode, onInterviewModeChange }) {
  return (
    <section className={CARD_CLASS}>
      <SectionHeader
        icon="mic"
        iconClassName={ICON_TINTS.mode}
        title="Interview mode"
        description="Choose how you want to respond."
      />
      <div className="grid gap-2.5 sm:grid-cols-3">
        {INTERVIEW_SETUP_MODE_OPTIONS.map((option) => {
          const selected = (interviewMode || DEFAULT_INTERVIEW_SETUP_MODE) === option.value;
          const disabled = Boolean(option.disabled);

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onInterviewModeChange(option.value)}
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 flex items-center gap-2.5',
                disabled && 'opacity-50 cursor-not-allowed',
                selected ? SELECTED_OPTION_CLASS : UNSELECTED_OPTION_CLASS
              )}
            >
              <AppIcon
                name={MODE_ICONS[option.value] || 'mic'}
                size="sm"
                className={cn('shrink-0', selected ? 'text-secondary' : 'text-on-surface-variant')}
              />
              <span
                className={cn(
                  'font-label-md',
                  selected ? 'text-secondary' : 'text-on-surface'
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function InterviewSetupAdvanced(props) {
  return (
    <>
      <ResumeContextSection {...props} />
      <FocusAreasSection focusAreas={props.focusAreas} onFocusAreasChange={props.onFocusAreasChange} />
      <InterviewModeSection
        interviewMode={props.interviewMode}
        onInterviewModeChange={props.onInterviewModeChange}
      />
    </>
  );
}
