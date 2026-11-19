"use client";

import { KeyboardEvent, useMemo, useState } from "react";

type TagInputProps = {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
  maxItems?: number;
  hint?: string;
  suggestions?: string[];
};

export function TagInput({
  id,
  label,
  values,
  onChange,
  placeholder = "Type and press Enter",
  required = false,
  maxItems,
  hint,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const listId = `${id}-suggestions`;

  const filteredSuggestions = useMemo(() => {
    const q = draft.trim().toLowerCase();
    return suggestions
      .filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()))
      .filter((s) => !q || s.toLowerCase().includes(q))
      .slice(0, 40);
  }, [draft, suggestions, values]);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (values.some((v) => v.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    if (maxItems !== undefined && values.length >= maxItems) return;
    onChange([...values, tag]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  const atMax = maxItems !== undefined && values.length >= maxItems;

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="req">*</span> : null}
      </label>
      <div className="tag-box">
        {values.map((value, index) => (
          <span key={`${value}-${index}`} className="tag">
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => removeTag(index)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          list={suggestions.length ? listId : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={atMax ? `Max ${maxItems} items` : placeholder}
          disabled={atMax}
        />
        {suggestions.length > 0 ? (
          <datalist id={listId}>
            {filteredSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        ) : null}
      </div>
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
