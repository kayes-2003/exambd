"use client";
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { SaveAnswerInput, AttemptState } from '@exambd/shared-types';

// Debounced-by-the-caller autosave mutation. Optimistic on the UI side; the server response
// is authoritative and reconciles remainingSeconds + palette state (see AttemptState).
export function useAutosave(attemptId: string) {
  return useMutation({
    mutationFn: ({ questionId, input }: { questionId: string; input: SaveAnswerInput }) =>
      apiFetch<AttemptState>(`/attempts/${attemptId}/answers/${questionId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    retry: 3,
  });
}
