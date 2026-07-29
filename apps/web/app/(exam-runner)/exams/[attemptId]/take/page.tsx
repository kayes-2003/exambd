"use client";
import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useAutosave } from '@/hooks/useAutosave';
import { useProctoring } from '@/hooks/useProctoring';
import { Timer } from '@/components/exam/Timer';
import { QuestionPalette } from '@/components/exam/QuestionPalette';
import { OptionList } from '@/components/exam/OptionList';
import type { AttemptState, StudentFacingQuestion } from '@exambd/shared-types';

// This route is intentionally OUTSIDE the normal app chrome (no shared nav/sidebar layout) —
// see the (exam-runner) route group — to keep the exam surface locked down and distraction-free.
export default function ExamRunnerPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<StudentFacingQuestion | null>(null);

  const { data: state, refetch } = useQuery<AttemptState>({
    queryKey: ['attempt-state', attemptId],
    queryFn: () => apiFetch(`/attempts/${attemptId}/state`),
    refetchOnWindowFocus: false,
  });

  const autosave = useAutosave(attemptId);
  useProctoring(attemptId, true);

  // Fetch the current question's shuffled options whenever the index changes.
  useEffect(() => {
    if (!state?.currentQuestions[currentIndex]) return;
    const questionId = state.currentQuestions[currentIndex].questionId;
    apiFetch<StudentFacingQuestion>(`/attempts/${attemptId}/questions/${questionId}`).then(setCurrentQuestion);
  }, [attemptId, state, currentIndex]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      autosave.mutate(
        { questionId: currentQuestion.questionId, input: { selectedOptionId: optionId, timeSpentSeconds: 1 } },
        { onSuccess: () => refetch() },
      );
    },
    [autosave, currentQuestion, refetch],
  );

  const handleSubmit = useCallback(async () => {
    await apiFetch(`/attempts/${attemptId}/submit`, { method: 'POST' });
    router.push(`/results/${attemptId}`);
  }, [attemptId, router]);

  if (!state || !currentQuestion) {
    return <div className="p-8 text-center text-slate-500">Loading your exam…</div>;
  }

  const selectedOptionId = null; // derive from a per-question answers cache in a full implementation

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div>
          <h1 className="font-semibold">{state.examTitle}</h1>
          <p className="text-sm text-slate-500">
            Q{currentIndex + 1} of {state.currentQuestions.length}
          </p>
        </div>
        <Timer remainingSeconds={state.remainingSeconds} onExpire={handleSubmit} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-lg leading-relaxed">{currentQuestion.questionText}</p>
          {currentQuestion.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentQuestion.mediaUrl} alt="Question diagram" className="max-w-full rounded-md border" />
          )}
          <OptionList options={currentQuestion.options} selectedOptionId={selectedOptionId} onSelect={handleSelect} />
        </main>
        <QuestionPalette questions={state.currentQuestions} currentIndex={currentIndex} onJump={setCurrentIndex} />
      </div>

      <footer className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-md border"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 rounded-md border"
            onClick={() => setCurrentIndex((i) => Math.min(state.currentQuestions.length - 1, i + 1))}
          >
            Next
          </button>
        </div>
        <button className="px-5 py-2 rounded-md bg-accent text-white font-medium" onClick={handleSubmit}>
          Submit Exam
        </button>
      </footer>
    </div>
  );
}
