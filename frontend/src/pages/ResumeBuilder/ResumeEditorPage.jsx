import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Code,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Plus,
  Download,
  Trash2,
  User,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/Skeleton';
import ResumePreview from '../../features/resumeBuilder/components/ResumePreview';
import SummaryEditPanel from '../../features/resumeBuilder/components/SummaryEditPanel';
import ExperienceEditPanel from '../../features/resumeBuilder/components/ExperienceEditPanel';
import HeaderPersonalDetailsPanel from '../../features/resumeBuilder/components/HeaderPersonalDetailsPanel';
import TemplatePicker from '../../features/resumeBuilder/components/TemplatePicker';
import { ResumeTextArea, ResumeTextInput } from '../../features/resumeBuilder/components/ResumeFormFields';
import { DEFAULT_TEMPLATE, getTemplateById } from '../../features/resumeBuilder/components/templatesConfig';
import { useParsedResume, useResumeBuilderActions } from '../../features/resumeBuilder/hooks/useResumeBuilder';
import {
  buildResumePdfFilename,
  downloadResumePdf,
} from '../../features/resumeBuilder/utils/downloadResumePdf';

const EMPTY_PARSED = {
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  nationality: '',
  dateOfBirth: '',
  visa: '',
  passportOrId: '',
  availability: '',
  photo: '',
  linkedinLink: '',
  githubLink: '',
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  languages: [],
  certifications: [],
};

function Section({ id, title, icon: Icon, activeSection, onToggle, children }) {
  const isOpen = activeSection === id;
  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : id)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
          isOpen ? 'bg-surface-container border-b border-outline-variant' : 'hover:bg-surface-container-low'
        }`}
      >
        <span className={`flex items-center gap-2 text-sm font-medium ${isOpen ? 'text-secondary' : 'text-on-surface'}`}>
          <Icon className={`h-4 w-4 ${isOpen ? 'text-secondary' : 'text-outline'}`} />
          {title}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-secondary" /> : <ChevronDown className="h-4 w-4 text-outline" />}
      </button>
      {isOpen ? <div className="p-4 space-y-3">{children}</div> : null}
    </div>
  );
}

export default function ResumeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useParsedResume(id);
  const { updateResume, runResumeAiText } = useResumeBuilderActions();

  const [parsedData, setParsedData] = useState(EMPTY_PARSED);
  const [activeSection, setActiveSection] = useState('header');
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE);

  const resume = data?.resume;

  useEffect(() => {
    if (!resume?.parsedData) return;
    const merged = { ...EMPTY_PARSED, ...resume.parsedData };
    setParsedData(merged);
    setSkillsInput((merged.skills || []).join(', '));
    setLanguagesInput((merged.languages || []).join(', '));
    setTemplateId(resume.templateId || DEFAULT_TEMPLATE);
  }, [resume]);

  const updateField = (field, value) => {
    setParsedData((prev) => ({ ...prev, [field]: value }));
  };

  const updateListItem = (listName, index, field, value) => {
    setParsedData((prev) => {
      const list = [...(prev[listName] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [listName]: list };
    });
  };

  const addListItem = (listName, template) => {
    setParsedData((prev) => ({
      ...prev,
      [listName]: [...(prev[listName] || []), template],
    }));
  };

  const removeListItem = (listName, index) => {
    setParsedData((prev) => ({
      ...prev,
      [listName]: (prev[listName] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await updateResume(id, parsedData, templateId);
      const filename = buildResumePdfFilename(resume.originalFileName, parsedData.fullName);
      await downloadResumePdf(previewRef.current, filename);
      toast.success('Resume downloaded successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to download resume');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-8rem)] p-4">
          <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 space-y-3">
            <Skeleton type="card" count={1} withMedia={false} lines={2} label="Loading resume editor" />
            <Skeleton type="card" count={3} withMedia={false} lines={3} columnsGrid={1} />
          </div>
          <div className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <Skeleton type="text" lines={14} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !resume) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 space-y-4">
          <p className="text-on-surface-variant">Resume not found.</p>
          <Link to="/resume/history">
            <Button variant="primary">Back to History</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-[calc(100vh-8rem)] -mx-2 lg:-mx-4">
        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-lowest border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-3">
            <Link to={`/resume/${id}`}>
              <Button variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-on-surface">Resume Editor</h1>
              <p className="text-xs text-on-surface-variant">{resume.originalFileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="px-3 py-1.5 text-sm" onClick={() => navigate(`/resume/${id}`)}>
              View Details
            </Button>
            <Button
              variant="primary"
              className="gap-1 px-3 py-1.5 text-sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 overflow-y-auto bg-surface border-e border-outline-variant p-4 space-y-3">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex items-center gap-3">
                {parsedData.photo ? (
                  <img
                    src={parsedData.photo}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover border border-outline-variant shrink-0"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="text-base font-bold text-on-surface uppercase tracking-wide truncate">
                    {parsedData.fullName || 'Your Name'}
                  </p>
                  {parsedData.professionalTitle ? (
                    <p className="text-xs text-secondary mt-0.5 truncate">{parsedData.professionalTitle}</p>
                  ) : null}
                  <p className="text-xs text-on-surface-variant mt-1 truncate">
                    {[parsedData.email, parsedData.phone, parsedData.address].filter(Boolean).join(' | ') ||
                      'Contact info'}
                  </p>
                </div>
              </div>
            </div>

            <Section id="templates" title="Template" icon={LayoutGrid} activeSection={activeSection} onToggle={setActiveSection}>
              <p className="text-xs text-on-surface-variant mb-2">
                Choose a resume design. Preview updates instantly on the right.
              </p>
              <TemplatePicker selected={templateId} onChange={setTemplateId} />
            </Section>

            <Section id="header" title="Header" icon={User} activeSection={activeSection} onToggle={setActiveSection}>
              <HeaderPersonalDetailsPanel
                value={parsedData}
                onChange={(next) => setParsedData((prev) => ({ ...prev, ...next }))}
                onDone={() => setActiveSection(null)}
                onAiTips={() =>
                  runResumeAiText(id, {
                    action: 'tips',
                    content: [parsedData.fullName, parsedData.professionalTitle, parsedData.email]
                      .filter(Boolean)
                      .join(' · '),
                    field: 'header',
                  })
                }
              />
            </Section>

            <Section id="summary" title="Summary" icon={User} activeSection={activeSection} onToggle={setActiveSection}>
              <SummaryEditPanel
                value={parsedData.summary || ''}
                onChange={(next) => updateField('summary', next)}
                onDone={() => setActiveSection(null)}
                onPreview={() => {
                  document.getElementById('resume-live-preview')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                onAiAction={(action, content) =>
                  runResumeAiText(id, { action, content, field: 'summary' })
                }
              />
            </Section>

            <Section id="experience" title="Work Experience" icon={Briefcase} activeSection={activeSection} onToggle={setActiveSection}>
              <div className="space-y-4">
                {(parsedData.experience || []).map((exp, index) => (
                  <ExperienceEditPanel
                    key={index}
                    index={index}
                    entry={exp}
                    onChange={(next) => {
                      setParsedData((prev) => {
                        const list = [...(prev.experience || [])];
                        list[index] = next;
                        return { ...prev, experience: list };
                      });
                    }}
                    onRemove={() => removeListItem('experience', index)}
                    onDone={() => setActiveSection(null)}
                    onPreview={() => {
                      document.getElementById('resume-live-preview')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                    onAiAction={(action, content, context) =>
                      runResumeAiText(id, {
                        action,
                        content,
                        field: 'experience.description',
                        context,
                      })
                    }
                  />
                ))}
                <Button
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={() =>
                    addListItem('experience', {
                      company: '',
                      companyLink: '',
                      position: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      description: '',
                      isCurrent: false,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Experience
                </Button>
              </div>
            </Section>

            <Section id="education" title="Education" icon={GraduationCap} activeSection={activeSection} onToggle={setActiveSection}>
              {(parsedData.education || []).map((edu, index) => (
                <div key={index} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-on-surface-variant">Education {index + 1}</span>
                    <button type="button" onClick={() => removeListItem('education', index)} className="text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <ResumeTextInput label="Degree" value={edu.degree || ''} onChange={(e) => updateListItem('education', index, 'degree', e.target.value)} />
                  <ResumeTextInput label="Institution" value={edu.institution || ''} onChange={(e) => updateListItem('education', index, 'institution', e.target.value)} />
                  <ResumeTextInput label="Field of Study" value={edu.fieldOfStudy || ''} onChange={(e) => updateListItem('education', index, 'fieldOfStudy', e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <ResumeTextInput label="Start" value={edu.startDate || ''} onChange={(e) => updateListItem('education', index, 'startDate', e.target.value)} />
                    <ResumeTextInput label="End" value={edu.endDate || ''} onChange={(e) => updateListItem('education', index, 'endDate', e.target.value)} />
                  </div>
                  <ResumeTextInput label="GPA" value={edu.gpa || ''} onChange={(e) => updateListItem('education', index, 'gpa', e.target.value)} />
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full text-sm"
                onClick={() => addListItem('education', { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Education
              </Button>
            </Section>

            <Section id="skills" title="Core Competencies" icon={Lightbulb} activeSection={activeSection} onToggle={setActiveSection}>
              <ResumeTextArea
                value={skillsInput}
                onChange={(e) => {
                  setSkillsInput(e.target.value);
                  updateField(
                    'skills',
                    e.target.value
                      .split(',')
                      .map((skill) => skill.trim())
                      .filter(Boolean)
                  );
                }}
                placeholder="SEO, React, JavaScript..."
                rows={3}
              />
            </Section>

            <Section id="projects" title="Projects" icon={Code} activeSection={activeSection} onToggle={setActiveSection}>
              {(parsedData.projects || []).map((project, index) => (
                <div key={index} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-on-surface-variant">Project {index + 1}</span>
                    <button type="button" onClick={() => removeListItem('projects', index)} className="text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <ResumeTextInput label="Name" value={project.name || ''} onChange={(e) => updateListItem('projects', index, 'name', e.target.value)} />
                  <ResumeTextArea value={project.description || ''} onChange={(e) => updateListItem('projects', index, 'description', e.target.value)} rows={3} />
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full text-sm"
                onClick={() => addListItem('projects', { name: '', description: '', technologies: [] })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Project
              </Button>
            </Section>
          </div>

          <div
            id="resume-live-preview"
            className="hidden lg:flex flex-1 overflow-y-auto bg-surface-dim p-6 justify-center"
          >
            <div className="w-full max-w-[210mm]">
              <p className="text-xs text-on-surface-variant text-center mb-3 uppercase tracking-wider">
                Live Preview — {getTemplateById(templateId).name} Template
              </p>
              <div ref={previewRef}>
                <ResumePreview data={parsedData} templateId={templateId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
