import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authInputClassName, getAuthFieldClassName } from '../../../components/auth/authUi';
import Skeleton from '../../../components/Skeleton';
import { fetchRoleSuggestions } from '../services/mockInterviewService';
import { cn } from '../../../lib/utils';

const DEBOUNCE_MS = 220;
const MAX_SUGGESTIONS = 6;

export default function RoleAutocompleteInput({
  value,
  onChange,
  onBlur,
  hasError = false,
  placeholder,
}) {
  const { t } = useTranslation('interviewPrep');
  const resolvedPlaceholder = placeholder ?? t('roleAutocomplete.placeholder');
  const listboxId = useId();
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const query = value.trim();
  const showDropdown =
    isOpen && query.length > 0 && (isLoading || fetchError || suggestions.length > 0);

  const selectSuggestion = useCallback(
    (role) => {
      onChange(role);
      setIsOpen(false);
      setHighlightIndex(-1);
      setSuggestions([]);
      inputRef.current?.focus();
    },
    [onChange]
  );

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setIsLoading(false);
      setFetchError(null);
      return undefined;
    }

    const controller = new AbortController();
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setFetchError(null);
      setIsOpen(true);

      try {
        const result = await fetchRoleSuggestions(query, controller.signal);
        if (cancelled) return;

        const list = Array.isArray(result?.suggestions)
          ? result.suggestions.map((item) => String(item).trim()).filter(Boolean).slice(0, MAX_SUGGESTIONS)
          : [];

        setSuggestions(list);
        setIsOpen(list.length > 0);
        if (!list.length) {
          setFetchError(t('roleAutocomplete.noSuggestions'));
        }
      } catch (error) {
        if (cancelled || error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
          return;
        }
        setSuggestions([]);
        setFetchError(
          error?.response?.data?.message ||
            error?.message ||
            t('roleAutocomplete.loadFailed')
        );
        setIsOpen(true);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!showDropdown) {
      setHighlightIndex(-1);
    }
  }, [showDropdown]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleKeyDown = (event) => {
    if (!showDropdown || isLoading) {
      if (event.key === 'ArrowDown' && query) {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[highlightIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id="mock-role-input"
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-autocomplete="list"
        aria-busy={isLoading}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHighlightIndex(-1);
        }}
        onFocus={() => {
          if (query) setIsOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setIsOpen(false);
            setHighlightIndex(-1);
            onBlur?.();
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        className={getAuthFieldClassName(authInputClassName, hasError)}
        autoComplete="off"
      />

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-level-2"
        >
          {isLoading ? (
            <div className="px-4 py-3">
              <Skeleton type="text" count={3} lines={1} label={t('roleAutocomplete.findingRoles')} />
            </div>
          ) : fetchError ? (
            <div className="px-4 py-3 font-label-sm text-error">{fetchError}</div>
          ) : (
            <ul>
              {suggestions.map((role, index) => (
                <li key={`${role}-${index}`} role="option" aria-selected={highlightIndex === index}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(role)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left font-body-md text-sm transition-colors duration-150',
                      highlightIndex === index
                        ? 'bg-secondary/10 text-secondary'
                        : 'text-on-surface hover:bg-surface-container-low'
                    )}
                  >
                    {role}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
