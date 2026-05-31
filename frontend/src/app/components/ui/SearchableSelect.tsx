'use client';

import { useState, useRef, useEffect } from 'react';
import { Command } from 'cmdk';
import { ChevronDown, X } from 'lucide-react';

type Option = {
  id: number;
  name: string;
  label?: string;
};

type SearchableSelectProps = {
  options: Option[];
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  formatOption?: (option: Option) => string;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  required = false,
  disabled = false,
  isLoading = false,
  formatOption,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const displayLabel = selectedOption
    ? formatOption
      ? formatOption(selectedOption)
      : selectedOption.label || selectedOption.name
    : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if click is on container or inside it
      if (containerRef.current && containerRef.current.contains(target)) {
        return;
      }

      // Check if click is on a Command.Item (from Portal)
      const commandItem = (target as HTMLElement).closest('[cmdk-item]');
      if (commandItem) {
        return;
      }

      setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!isLoading && !disabled) {
            setOpen(!open);
            setSearch('');
          }
        }}
        disabled={disabled || isLoading}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-between"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            open ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {open && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <Command className="[&_[cmdk-input]]:border-b [&_[cmdk-input]]:border-gray-200" shouldFilter={true}>
            <Command.Input
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              className="w-full px-3 py-2 text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
            <Command.List className="max-h-48 overflow-y-auto">
              <Command.Empty className="px-3 py-2 text-sm text-gray-500">
                No options found.
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.id}
                  value={option.label || option.name}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 data-[selected]:bg-blue-100 data-[selected]:text-blue-900"
                >
                  {option.label || option.name}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}