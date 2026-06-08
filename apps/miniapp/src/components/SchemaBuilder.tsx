import type { SurveyQuestion, SurveySchema } from "@proofpoll/sdk";

export interface SchemaBuilderProps {
  schema: SurveySchema;
  onChange: (schema: SurveySchema) => void;
}

/// Controlled editor for a `SurveySchema` (title, description, typed questions).
export function SchemaBuilder({ schema, onChange }: SchemaBuilderProps) {
  const set = (patch: Partial<SurveySchema>) => onChange({ ...schema, ...patch });
  const setQ = (i: number, patch: Partial<SurveyQuestion>) =>
    set({ questions: schema.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) });
  const addQ = () =>
    set({
      questions: [
        ...schema.questions,
        { id: `q${schema.questions.length + 1}`, prompt: "", type: "single", options: ["Yes", "No"] },
      ],
    });
  const removeQ = (i: number) => set({ questions: schema.questions.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <input className="input" placeholder="Survey title" value={schema.title} onChange={(e) => set({ title: e.target.value })} />
      <textarea
        className="input"
        placeholder="Description (optional)"
        value={schema.description ?? ""}
        onChange={(e) => set({ description: e.target.value })}
      />

      {schema.questions.map((q, i) => (
        <div key={q.id} className="space-y-2 rounded border border-white/10 p-2">
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Question" value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} />
            <button type="button" className="text-xs opacity-70" onClick={() => removeQ(i)}>
              ✕
            </button>
          </div>
          <select className="input" value={q.type} onChange={(e) => setQ(i, { type: e.target.value as SurveyQuestion["type"] })}>
            <option value="single">single choice</option>
            <option value="multi">multi choice</option>
            <option value="scale">scale 1–5</option>
            <option value="text">free text</option>
          </select>
          {(q.type === "single" || q.type === "multi") && (
            <input
              className="input"
              placeholder="Options, comma-separated"
              value={(q.options ?? []).join(", ")}
              onChange={(e) => setQ(i, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          )}
        </div>
      ))}

      <button type="button" className="text-sm underline" onClick={addQ}>
        + Add question
      </button>
    </div>
  );
}
