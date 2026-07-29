type Option = { optionId: string; displayLabel: string; optionText: string };

export function OptionList({
  options,
  selectedOptionId,
  onSelect,
}: {
  options: Option[];
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div role="radiogroup" className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.optionId}
          className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
            selectedOptionId === opt.optionId
              ? 'border-accent bg-accent/5'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <input
            type="radio"
            className="accent-accent"
            checked={selectedOptionId === opt.optionId}
            onChange={() => onSelect(opt.optionId)}
          />
          <span className="font-semibold w-5">{opt.displayLabel}.</span>
          <span>{opt.optionText}</span>
        </label>
      ))}
    </div>
  );
}
