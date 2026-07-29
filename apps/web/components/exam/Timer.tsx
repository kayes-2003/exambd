import { useExamTimer } from '@/hooks/useExamTimer';

export function Timer({ remainingSeconds, onExpire }: { remainingSeconds: number; onExpire: () => void }) {
  const { formatted, seconds } = useExamTimer(remainingSeconds, onExpire);
  const isCritical = seconds < 300; // last 5 minutes
  return (
    <div
      className={`font-mono text-lg px-3 py-1 rounded-md ${
        isCritical ? 'bg-unanswered/10 text-unanswered animate-pulse' : 'bg-accent/10 text-accent'
      }`}
      role="timer"
      aria-live="polite"
    >
      ⏱ {formatted}
    </div>
  );
}
