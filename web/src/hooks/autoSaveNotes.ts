import { useEffect, useRef, useCallback } from 'react';
import { updateJobOpportunity } from '@/lib/jobs.api';

interface UseAutoSaveNotesProps {
  jobId: string | null;
  enabled?: boolean;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  debounceMs?: number;
}

export const useAutoSaveNotes = ({
  jobId,
  enabled = true,
  onSaveSuccess,
  onSaveError,
  debounceMs = 1000,
}: UseAutoSaveNotesProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const saveNotes = useCallback(async (
    field: 'personalNotes' | 'salaryNegotiationNotes' | 'interviewNotes',
    value: string
  ) => {
    if (!jobId || !enabled || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await updateJobOpportunity(jobId, { [field]: value });
      onSaveSuccess?.();
    } catch (error) {
      console.error(`Failed to auto-save ${field}:`, error);
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [jobId, enabled, onSaveSuccess, onSaveError]);

  const debouncedSave = useCallback((
    field: 'personalNotes' | 'salaryNegotiationNotes' | 'interviewNotes',
    value: string
  ) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      saveNotes(field, value);
    }, debounceMs);
  }, [saveNotes, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedSave };
};