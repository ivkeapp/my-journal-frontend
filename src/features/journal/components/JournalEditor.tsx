/**
 * Journal Editor
 * Distraction-free editor with title and content inputs
 */

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface JournalEditorProps {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  disabled?: boolean;
  className?: string;
}

export function JournalEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  disabled = false,
  className,
}: JournalEditorProps) {
  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTitleChange(e.target.value);
    },
    [onTitleChange]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onContentChange(e.target.value);
    },
    [onContentChange]
  );

  // Auto-resize textarea
  const handleTextareaInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    []
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        disabled={disabled}
        className={cn(
          'w-full text-3xl font-bold text-gray-900 placeholder:text-gray-300',
          'border-none outline-none bg-transparent',
          'px-0 py-4',
          'focus:ring-0',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        autoFocus
      />

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={handleContentChange}
        onInput={handleTextareaInput}
        placeholder="Start writing..."
        disabled={disabled}
        className={cn(
          'w-full min-h-[60vh] text-lg text-gray-700 placeholder:text-gray-300',
          'border-none outline-none bg-transparent resize-none',
          'px-0 py-2 leading-relaxed',
          'focus:ring-0',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  );
}

export default JournalEditor;
