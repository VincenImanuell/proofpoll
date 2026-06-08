import type { SurveyQuestion } from "@proofpoll/sdk";

export interface QuestionInputProps {
  question: SurveyQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  className?: string;
}

/// Renders one survey question by type. Controlled. Exported so apps can build custom layouts.
export function QuestionInput({ question, value, onChange, className }: QuestionInputProps) {
  const options = question.options ?? [];

  switch (question.type) {
    case "single":
      return (
        <fieldset className={className}>
          <legend>{question.prompt}</legend>
          {options.map((opt) => (
            <label key={opt}>
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </fieldset>
      );

    case "multi": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset className={className}>
          <legend>{question.prompt}</legend>
          {options.map((opt) => (
            <label key={opt}>
              <input
                type="checkbox"
                value={opt}
                checked={selected.includes(opt)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, opt] : selected.filter((o) => o !== opt))
                }
              />
              {opt}
            </label>
          ))}
        </fieldset>
      );
    }

    case "scale":
      return (
        <fieldset className={className}>
          <legend>{question.prompt}</legend>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={value === n}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        </fieldset>
      );

    case "text":
    default:
      return (
        <label className={className}>
          <span>{question.prompt}</span>
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );
  }
}
