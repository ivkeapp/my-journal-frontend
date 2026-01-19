/**
 * Search Input Component
 * Large, focused search input with clear button
 */

import { forwardRef, type KeyboardEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onEscape?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onClear,
      onFocus,
      onBlur,
      onEscape,
      isLoading = false,
      placeholder = 'Search your journal...',
      className,
      autoFocus = false,
    },
    ref
  ) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
      }
    };

    const handleClear = () => {
      onChange('');
      onClear?.();
    };

    return (
      <div className={cn('relative', className)}>
        {/* Search icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className={cn(
            'w-full h-14 pl-12 pr-12',
            'text-lg placeholder:text-gray-400',
            'bg-white border border-gray-200 rounded-xl',
            'shadow-sm hover:shadow-md transition-shadow',
            'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        {/* Clear button */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2',
              'p-1 rounded-full',
              'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
              'transition-colors'
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
