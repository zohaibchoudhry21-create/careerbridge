import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Code,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import ResumePreview from '../../resumeBuilder/components/ResumePreview';
import TemplatePicker from '../../resumeBuilder/components/TemplatePicker';
import { ResumeTextArea, ResumeTextInput } from '../../resumeBuilder/components/ResumeFormFields';
import { DEFAULT_TEMPLATE, getTemplateById } from '../../resumeBuilder/components/templatesConfig';
import {
  emptyParsedData,
  hasParsedData,
  normalizeParsedData,
  structuredResumeToParsedData,
} from '../utils/structuredResumeBuilderUtils';

function Section({ id, title, icon: Icon, activeSection, onToggle, children }) {
  const isOpen = activeSection === id;
  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
          isOpen ? 'bg-surface-container border-b border-outline-variant' : 'hover:bg-surface-container-low'
        }`}
      >
        <span
          className={`flex items-center gap-2 text-sm font-medium ${isOpen ? 'text-secondary' : 'text-on-surface'}`}
        >
          <Icon className={`h-4 w-4 ${isOpen ? 'text-secondary' : 'text-outline'}`} />
          {title}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-secondary" /> : <ChevronDown className="h-4 w-4 text-outline" />}
      </button>
      {isOpen ? <div className="p-4 space-y-3">{children}</div> : null}
    </div>
  );
}

/**
 * Step-2 editor: same parsedData JSON + UI as Resume Builder ResumeEditorPage.
 */
export default function ScannerSectionEditor({
  parsedData: parsedDataProp,
  structuredResume,
  templateId: templateIdProp,
  onParsedDataChange,
  isSaving = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const [parsedData, setParsedData] = useState(emptyParsedData);
  const [activeSection, setActiveSection] = useState('header');
  const [skillsInput, setSkillsInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [templateId, setTemplateId] = useState(templateIdProp || DEFAULT_TEMPLATE);
  const saveTimerRef = useRef(null);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const parsed = hasParsedData(parsedDataProp)
      ? normalizeParsedData(parsedDataProp)
      : structuredResumeToParsedData(structuredResume, parsedDataProp);
    setParsedData(parsed);
    setSkillsInput((parsed.skills || []).join(', '));
    setLanguagesInput((parsed.languages || []).join(', '));
    setCertificationsInput((parsed.certifications || []).join(', '));
    if (templateIdProp) setTemplateId(templateIdProp);
  }, [parsedDataProp, structuredResume, templateIdProp]);

  const persist = useCallback(
    (nextParsed, nextTemplateId = templateId) => {
      skipNextSyncRef.current = true;
      onParsedDataChange?.(normalizeParsedData(nextParsed), nextTemplateId);
    },
    [onParsedDataChange, templateId]
  );

  const scheduleSave = useCallback(
    (nextParsed, nextTemplateId) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        persist(nextParsed, nextTemplateId);
      }, 700);
    },
    [persist]
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const updateField = (field, value) => {
    setParsedData((prev) => {
      const next = { ...prev, [field]: value };
      scheduleSave(next);
      return next;
    });
  };

  const updateListItem = (listName, index, field, value) => {
    setParsedData((prev) => {
      const list = [...(prev[listName] || [])];
      list[index] = { ...list[index], [field]: value };
      const next = { ...prev, [listName]: list };
      scheduleSave(next);
      return next;
    });
  };

  const addListItem = (listName, template) => {
    setParsedData((prev) => {
      const next = { ...prev, [listName]: [...(prev[listName] || []), template] };
      scheduleSave(next);
      return next;
    });
  };

  const removeListItem = (listName, index) => {
    setParsedData((prev) => {
      const next = {
        ...prev,
        [listName]: (prev[listName] || []).filter((_, itemIndex) => itemIndex !== index),
      };
      scheduleSave(next);
      return next;
    });
  };

  const handleTemplateChange = (nextId) => {
    setTemplateId(nextId);
    scheduleSave(parsedData, nextId);
  };

  const handleManualSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persist(parsedData, templateId);
  };

  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 overflow-y-auto bg-surface border-e border-outline-variant p-4 space-y-3 min-h-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-on-surface-variant">{t('analysis.sectionEditor.hint')}</p>
          <Button
            variant="primary"
            className="gap-1 px-3 py-1.5 text-sm shrink-0"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('analysis.sectionEditor.save')}
          </Button>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-base font-bold text-on-surface uppercase tracking-wide">
            {parsedData.fullName || t('analysis.sectionEditor.namePlaceholder')}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {[parsedData.email, parsedData.phone, parsedData.address].filter(Boolean).join(' | ') ||
              t('analysis.sectionEditor.contactPlaceholder')}
          </p>
        </div>

        <Section id="templates" title={t('analysis.sectionEditor.template')} icon={LayoutGrid} activeSection={activeSection} onToggle={setActiveSection}>
          <p className="text-xs text-on-surface-variant mb-2">{t('analysis.sectionEditor.templateHint')}</p>
          <TemplatePicker selected={templateId} onChange={handleTemplateChange} />
        </Section>

        <Section id="header" title={t('analysis.sectionEditor.header')} icon={User} activeSection={activeSection} onToggle={setActiveSection}>
          <ResumeTextInput label={t('analysis.sectionEditor.fullName')} value={parsedData.fullName || ''} onChange={(e) => updateField('fullName', e.target.value)} />
          <ResumeTextInput label={t('analysis.sectionEditor.email')} type="email" value={parsedData.email || ''} onChange={(e) => updateField('email', e.target.value)} />
          <ResumeTextInput label={t('analysis.sectionEditor.phone')} value={parsedData.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
          <ResumeTextInput label={t('analysis.sectionEditor.address')} value={parsedData.address || ''} onChange={(e) => updateField('address', e.target.value)} />
          <ResumeTextInput label={t('analysis.sectionEditor.linkedin')} value={parsedData.linkedinLink || ''} onChange={(e) => updateField('linkedinLink', e.target.value)} />
          <ResumeTextInput label={t('analysis.sectionEditor.github')} value={parsedData.githubLink || ''} onChange={(e) => updateField('githubLink', e.target.value)} />
        </Section>

        <Section id="summary" title={t('analysis.sectionEditor.summary')} icon={User} activeSection={activeSection} onToggle={setActiveSection}>
          <ResumeTextArea value={parsedData.summary || ''} onChange={(e) => updateField('summary', e.target.value)} placeholder={t('analysis.sectionEditor.summaryPlaceholder')} rows={5} />
        </Section>

        <Section id="experience" title={t('analysis.sectionEditor.experience')} icon={Briefcase} activeSection={activeSection} onToggle={setActiveSection}>
          {(parsedData.experience || []).map((exp, index) => (
            <div key={index} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface-variant">
                  {t('analysis.sectionEditor.experienceN', { n: index + 1 })}
                </span>
                <button type="button" onClick={() => removeListItem('experience', index)} className="text-error">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <ResumeTextInput label={t('analysis.sectionEditor.position')} value={exp.position || ''} onChange={(e) => updateListItem('experience', index, 'position', e.target.value)} />
              <ResumeTextInput label={t('analysis.sectionEditor.company')} value={exp.company || ''} onChange={(e) => updateListItem('experience', index, 'company', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <ResumeTextInput label={t('analysis.sectionEditor.start')} value={exp.startDate || ''} onChange={(e) => updateListItem('experience', index, 'startDate', e.target.value)} />
                <ResumeTextInput label={t('analysis.sectionEditor.end')} value={exp.endDate || ''} onChange={(e) => updateListItem('experience', index, 'endDate', e.target.value)} />
              </div>
              <ResumeTextArea value={exp.description || ''} onChange={(e) => updateListItem('experience', index, 'description', e.target.value)} placeholder={t('analysis.sectionEditor.bulletsPlaceholder')} rows={3} />
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-full text-sm"
            onClick={() => addListItem('experience', { company: '', position: '', startDate: '', endDate: '', description: '', isCurrent: false })}
          >
            <Plus className="h-4 w-4 mr-1" /> {t('analysis.sectionEditor.addExperience')}
          </Button>
        </Section>

        <Section id="education" title={t('analysis.sectionEditor.education')} icon={GraduationCap} activeSection={activeSection} onToggle={setActiveSection}>
          {(parsedData.education || []).map((edu, index) => (
            <div key={index} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface-variant">
                  {t('analysis.sectionEditor.educationN', { n: index + 1 })}
                </span>
                <button type="button" onClick={() => removeListItem('education', index)} className="text-error">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <ResumeTextInput label={t('analysis.sectionEditor.degree')} value={edu.degree || ''} onChange={(e) => updateListItem('education', index, 'degree', e.target.value)} />
              <ResumeTextInput label={t('analysis.sectionEditor.institution')} value={edu.institution || ''} onChange={(e) => updateListItem('education', index, 'institution', e.target.value)} />
              <ResumeTextInput label={t('analysis.sectionEditor.fieldOfStudy')} value={edu.fieldOfStudy || ''} onChange={(e) => updateListItem('education', index, 'fieldOfStudy', e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <ResumeTextInput label={t('analysis.sectionEditor.start')} value={edu.startDate || ''} onChange={(e) => updateListItem('education', index, 'startDate', e.target.value)} />
                <ResumeTextInput label={t('analysis.sectionEditor.end')} value={edu.endDate || ''} onChange={(e) => updateListItem('education', index, 'endDate', e.target.value)} />
              </div>
              <ResumeTextInput label={t('analysis.sectionEditor.gpa')} value={edu.gpa || ''} onChange={(e) => updateListItem('education', index, 'gpa', e.target.value)} />
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-full text-sm"
            onClick={() => addListItem('education', { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '', description: '' })}
          >
            <Plus className="h-4 w-4 mr-1" /> {t('analysis.sectionEditor.addEducation')}
          </Button>
        </Section>

        <Section id="skills" title={t('analysis.sectionEditor.skills')} icon={Lightbulb} activeSection={activeSection} onToggle={setActiveSection}>
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
            placeholder={t('analysis.sectionEditor.skillsPlaceholder')}
            rows={3}
          />
        </Section>

        <Section id="projects" title={t('analysis.sectionEditor.projects')} icon={Code} activeSection={activeSection} onToggle={setActiveSection}>
          {(parsedData.projects || []).map((project, index) => (
            <div key={index} className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-on-surface-variant">
                  {t('analysis.sectionEditor.projectN', { n: index + 1 })}
                </span>
                <button type="button" onClick={() => removeListItem('projects', index)} className="text-error">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <ResumeTextInput label={t('analysis.sectionEditor.projectName')} value={project.name || ''} onChange={(e) => updateListItem('projects', index, 'name', e.target.value)} />
              <ResumeTextArea value={project.description || ''} onChange={(e) => updateListItem('projects', index, 'description', e.target.value)} rows={3} />
            </div>
          ))}
          <Button
            variant="secondary"
            className="w-full text-sm"
            onClick={() => addListItem('projects', { name: '', description: '', technologies: [], startDate: '', endDate: '', link: '' })}
          >
            <Plus className="h-4 w-4 mr-1" /> {t('analysis.sectionEditor.addProject')}
          </Button>
        </Section>

        <Section id="languages" title={t('analysis.sectionEditor.languages')} icon={Lightbulb} activeSection={activeSection} onToggle={setActiveSection}>
          <ResumeTextArea
            value={languagesInput}
            onChange={(e) => {
              setLanguagesInput(e.target.value);
              updateField(
                'languages',
                e.target.value
                  .split(',')
                  .map((lang) => lang.trim())
                  .filter(Boolean)
              );
            }}
            placeholder={t('analysis.sectionEditor.languagesPlaceholder')}
            rows={2}
          />
        </Section>

        <Section id="certifications" title={t('analysis.sectionEditor.certifications')} icon={Lightbulb} activeSection={activeSection} onToggle={setActiveSection}>
          <ResumeTextArea
            value={certificationsInput}
            onChange={(e) => {
              setCertificationsInput(e.target.value);
              updateField(
                'certifications',
                e.target.value
                  .split(',')
                  .map((cert) => cert.trim())
                  .filter(Boolean)
              );
            }}
            placeholder={t('analysis.sectionEditor.certificationsPlaceholder')}
            rows={2}
          />
        </Section>
      </div>

      <div className="hidden lg:flex flex-1 overflow-y-auto bg-surface-dim p-6 justify-center min-h-0">
        <div className="w-full max-w-[210mm]">
          <p className="text-xs text-on-surface-variant text-center mb-3 uppercase tracking-wider">
            {t('analysis.sectionEditor.livePreview')} — {getTemplateById(templateId).name}
          </p>
          <ResumePreview data={parsedData} templateId={templateId} />
        </div>
      </div>
    </div>
  );
}
