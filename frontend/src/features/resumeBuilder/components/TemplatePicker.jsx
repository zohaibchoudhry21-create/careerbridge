import { Check } from 'lucide-react';
import { TEMPLATES } from './templatesConfig';

export default function TemplatePicker({ selected, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {TEMPLATES.map((template) => {
        const isSelected = selected === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template.id)}
            className={`relative text-left rounded-xl border-2 p-3 transition-all hover:shadow-md ${
              isSelected
                ? 'border-secondary bg-surface-container ring-1 ring-secondary/30'
                : 'border-outline-variant bg-surface-container-lowest hover:border-outline'
            }`}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 bg-secondary text-on-secondary rounded-full p-0.5">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className={`h-16 rounded-lg mb-2 border ${template.preview} overflow-hidden`}>
              <div className={`h-3 ${template.accent} w-full`} />
              <div className="p-1.5 space-y-1">
                <div className="h-1 bg-surface-container rounded w-3/4" />
                <div className="h-1 bg-surface-container-low rounded w-full" />
                <div className="h-1 bg-surface-container-low rounded w-5/6" />
              </div>
            </div>
            <p className={`text-xs font-semibold ${isSelected ? 'text-secondary' : 'text-on-surface'}`}>
              {template.name}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-0.5 line-clamp-2">{template.description}</p>
          </button>
        );
      })}
    </div>
  );
}
