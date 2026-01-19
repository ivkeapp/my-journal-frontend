/**
 * Entry Status Indicator
 * Shows save status: Saved, Saving..., Unsaved changes, Draft
 */

import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle, FileEdit } from 'lucide-react';
import type { SaveStatus, EntryStatus } from '../types';

interface EntryStatusProps {
  saveStatus: SaveStatus;
  entryStatus: EntryStatus;
  lastSavedAt?: Date | null;
  className?: string;
}

export function EntryStatusIndicator({
  saveStatus,
  entryStatus,
  lastSavedAt,
  className,
}: EntryStatusProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
          text: 'Saving...',
          color: 'text-gray-500',
        };
      case 'saved':
        return {
          icon: <Check className="h-3.5 w-3.5" />,
          text: lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : 'Saved',
          color: 'text-green-600',
        };
      case 'unsaved':
        return {
          icon: <FileEdit className="h-3.5 w-3.5" />,
          text: 'Unsaved changes',
          color: 'text-amber-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          text: 'Save failed',
          color: 'text-red-600',
        };
      case 'idle':
      default:
        // Show nothing for idle state - no status until user makes changes
        return null;
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={cn('flex items-center gap-3 text-sm', className)}>
      {/* Entry type badge */}
      {entryStatus === 'draft' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
          Draft
        </span>
      )}
      
      {/* Save status - only show if there's something to display */}
      {status && (
        <span className={cn('inline-flex items-center gap-1.5', status.color)}>
          {status.icon}
          <span>{status.text}</span>
        </span>
      )}
    </div>
  );
}

export default EntryStatusIndicator;
