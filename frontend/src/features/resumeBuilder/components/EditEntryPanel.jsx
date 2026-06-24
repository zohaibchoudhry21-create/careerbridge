import RichTextEditor from './RichTextEditor';
import AIActionButtons from './AIActionButtons';
import { LANGUAGE_LEVELS } from '../data/resumeSectionTypes';

function TextInput({ label, value, onChange, link = false }) {
  return (
    <label className="block">
      <span className="font-label-sm text-on-surface-variant mb-1 block">{label}</span>
      <div className="flex gap-2">
        <input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
        />
        {link && (
          <button type="button" className="rounded-xl border border-outline-variant px-sm text-secondary">
            <span className="material-symbols-outlined text-[18px]">link</span>
          </button>
        )}
      </div>
    </label>
  );
}

function DateField({ label, value, onChange, onClear, showClear = true }) {
  return (
    <label className="block min-w-0 w-full">
      <span className="font-label-sm text-on-surface-variant mb-1 block leading-snug">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <input
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 flex-1 rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
        />
        {showClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-xl border border-outline-variant px-2 py-sm text-on-surface-variant"
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        )}
      </div>
    </label>
  );
}

function DateRow({ fields, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField
          label="Start Date (MM/YYYY)"
          value={fields.startDate}
          onChange={(value) => onChange({ startDate: value })}
          onClear={() => onChange({ startDate: '' })}
        />
        <DateField
          label="End Date (MM/YYYY or Present)"
          value={fields.endDate}
          onChange={(value) => onChange({ endDate: value })}
          onClear={() => onChange({ endDate: '' })}
        />
      </div>
      <DateField
        label="Location (City, Country)"
        value={fields.location}
        onChange={(value) => onChange({ location: value })}
        showClear={false}
      />
    </div>
  );
}

export default function EditEntryPanel({ section, entry, onUpdate, onDone, inline = false }) {
  const fields = entry?.fields || {};
  const update = (patch) => onUpdate(patch);

  const renderFields = () => {
    switch (section.type) {
      case 'about':
        return (
          <>
            <TextInput
              label="Heading"
              value={fields.heading}
              onChange={(value) => update({ heading: value })}
            />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Content</span>
              <RichTextEditor
                value={fields.content}
                onChange={(value) => update({ content: value })}
              />
            </div>
            <AIActionButtons
              actions={['improve', 'grammar', 'shorter']}
              content={fields.content}
              onResult={(value) => update({ content: value })}
            />
          </>
        );
      case 'experience':
        return (
          <>
            <TextInput label="Job Title" value={fields.jobTitle} onChange={(v) => update({ jobTitle: v })} />
            <TextInput
              label="Employer"
              value={fields.employer}
              onChange={(v) => update({ employer: v })}
              link
            />
            <DateRow fields={fields} onChange={update} />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Description</span>
              <RichTextEditor
                value={fields.description}
                onChange={(value) => update({ description: value })}
              />
            </div>
            <AIActionButtons
              content={fields.description}
              context={`${fields.jobTitle || ''} at ${fields.employer || ''}`}
              onResult={(value) => update({ description: value })}
            />
          </>
        );
      case 'education':
        return (
          <>
            <TextInput label="Degree" value={fields.degree} onChange={(v) => update({ degree: v })} />
            <TextInput label="School" value={fields.school} onChange={(v) => update({ school: v })} link />
            <DateRow fields={fields} onChange={update} />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Description</span>
              <RichTextEditor
                value={fields.description}
                onChange={(value) => update({ description: value })}
                placeholder="Add a description of your education entry..."
              />
            </div>
            <AIActionButtons
              content={fields.description}
              context={`${fields.jobTitle || ''} at ${fields.employer || ''}`}
              onResult={(value) => update({ description: value })}
            />
          </>
        );
      case 'expertise':
        return (
          <>
            <TextInput label="Skill" value={fields.name} onChange={(v) => update({ name: v })} />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Additional information</span>
              <RichTextEditor
                value={fields.description}
                onChange={(value) => update({ description: value })}
              />
            </div>
          </>
        );
      case 'languages':
        return (
          <>
            <TextInput label="Language" value={fields.language} onChange={(v) => update({ language: v })} />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Additional information</span>
              <RichTextEditor
                value={fields.additionalInfo}
                onChange={(value) => update({ additionalInfo: value })}
                placeholder="e.g. C2, 4+, TOEFL, IELTS,..."
              />
            </div>
            <label className="block">
              <span className="font-label-sm text-on-surface-variant mb-1 block">Language level</span>
              <select
                value={fields.level || ''}
                onChange={(event) => update({ level: event.target.value })}
                className="w-full rounded-xl border border-outline-variant px-md py-sm outline-none focus:border-secondary"
              >
                <option value="">Select language level</option>
                {LANGUAGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </>
        );
      case 'courses':
        return (
          <>
            <TextInput
              label="Course title"
              value={fields.courseTitle}
              onChange={(v) => update({ courseTitle: v })}
              link
            />
            <TextInput
              label="Institution"
              value={fields.institution}
              onChange={(v) => update({ institution: v })}
            />
            <DateRow fields={fields} onChange={update} />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Description</span>
              <RichTextEditor
                value={fields.description}
                onChange={(value) => update({ description: value })}
                placeholder="Describe the course..."
              />
            </div>
          </>
        );
      default:
        return (
          <>
            <TextInput
              label="Title"
              value={fields.title || fields.name || ''}
              onChange={(v) => update({ title: v })}
            />
            <div>
              <span className="font-label-sm text-on-surface-variant mb-1 block">Description</span>
              <RichTextEditor
                value={fields.description || fields.content || ''}
                onChange={(value) => update({ description: value, content: value })}
              />
            </div>
            <AIActionButtons
              content={fields.description || fields.content}
              onResult={(value) => update({ description: value, content: value })}
            />
          </>
        );
    }
  };

  return (
    <div className={inline ? 'space-y-3' : 'space-y-md'}>
      {!inline && (
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Edit Entry</h3>
          <button type="button" className="font-label-sm text-secondary hover:underline">
            Get Tips
          </button>
        </div>
      )}
      {renderFields()}
      {!inline && onDone && (
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl bg-secondary py-sm font-label-md text-on-secondary hover:bg-secondary-container transition-colors"
        >
          Done
        </button>
      )}
    </div>
  );
}
