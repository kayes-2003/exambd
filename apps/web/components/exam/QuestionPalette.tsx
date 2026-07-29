type QuestionStatus = {
  questionId: string;
  displayOrder: number;
  isAnswered: boolean;
  isMarkedForReview: boolean;
  isVisited: boolean;
};

function statusColor(q: QuestionStatus) {
  if (q.isMarkedForReview) return 'bg-marked text-white';
  if (q.isAnswered) return 'bg-answered text-white';
  if (q.isVisited) return 'bg-unanswered text-white';
  return 'bg-unvisited text-white';
}

export function QuestionPalette({
  questions,
  currentIndex,
  onJump,
}: {
  questions: QuestionStatus[];
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <aside className="w-full md:w-64 shrink-0 border-l border-slate-200 dark:border-slate-800 p-4">
      <ul className="flex flex-wrap gap-1 mb-4 text-xs">
        <li className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-answered inline-block" /> Answered</li>
        <li className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-unanswered inline-block" /> Not answered</li>
        <li className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-marked inline-block" /> Marked</li>
        <li className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-unvisited inline-block" /> Not visited</li>
      </ul>
      <div className="grid grid-cols-6 gap-2">
        {questions.map((q, i) => (
          <button
            key={q.questionId}
            onClick={() => onJump(i)}
            aria-current={i === currentIndex}
            className={`h-9 w-9 rounded-md text-sm font-medium ${statusColor(q)} ${
              i === currentIndex ? 'ring-2 ring-offset-2 ring-accent' : ''
            }`}
          >
            {q.displayOrder + 1}
          </button>
        ))}
      </div>
    </aside>
  );
}
