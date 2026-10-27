import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  color?: string;
  description?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const nextIndex = (currentIndex + 1) % options.length;
      if (options[nextIndex]) {
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      if (options[prevIndex]) {
        onChange(options[prevIndex].value);
      }
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-700 dark:text-neutral-300 mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between rounded-lg transition-all border text-left ${
          isSmall ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } ${
          isOpen
            ? 'border-violet-500 ring-1 ring-violet-500/40 bg-slate-50 dark:bg-neutral-850 text-slate-900 dark:text-neutral-100'
            : 'border-slate-300 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 hover:border-slate-400 dark:hover:border-neutral-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-1.5 truncate mr-1">
          {selectedOption?.color && (
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : <span className="text-slate-400 dark:text-neutral-500">{placeholder}</span>}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`shrink-0 text-slate-400 dark:text-neutral-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-violet-500 dark:text-violet-400' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu List: Charcoal Neutral-900 background in dark mode, crisp Clean Slate-50 / White in light mode */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 min-w-full w-max max-w-xs rounded-lg border border-slate-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden py-1 max-h-64 overflow-y-auto"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 dark:text-neutral-500 text-center italic">
              No options available
            </div>
          ) : (
            options.map(option => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-violet-600 text-white font-medium'
                      : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.color && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-violet-700 text-violet-100'
                            : 'bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
