import { cn } from '../../lib/utils';
import {
  selectedOptionClass,
  unselectedOptionClass,
} from '../ui/colorAccentTokens';

export default function RadioGroup({ name, value, onChange, options = [] }) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const optionDescription = typeof option === 'object' ? option.description : null;
        const selected = value === optionValue;

        return (
          <label
            key={optionValue}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-150',
              selected ? selectedOptionClass : unselectedOptionClass
            )}
          >
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={selected}
              onChange={() => onChange(optionValue)}
              className="mt-1 h-4 w-4 text-secondary focus:ring-secondary"
            />
            <span className="min-w-0">
              <span
                className={cn(
                  'font-label-md block',
                  selected ? 'text-secondary' : 'text-on-surface'
                )}
              >
                {optionLabel}
              </span>
              {optionDescription ? (
                <span className="mt-0.5 block font-body-md text-sm text-on-surface-variant">
                  {optionDescription}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
