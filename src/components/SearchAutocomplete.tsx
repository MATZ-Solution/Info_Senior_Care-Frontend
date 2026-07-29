import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { facilitiesApi } from "../lib/api";
import type { FacilitySuggestItem } from "../lib/types";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Runs the underlying search for the current text (Enter with no suggestion picked, or submit button). */
  onSubmit: () => void;
  placeholder?: string;
  inputStyle?: CSSProperties;
}

// Autocomplete for facility names, backed by GET /api/v1/facilities/suggest
// (TypeSense-powered: prefix + typo-tolerant matching, Postgres fallback --
// see API_CONTRACT.md Part 3). Picking a suggestion jumps straight to that
// facility; typing a broader query (city/state/ZIP) and pressing
// Enter/submit still runs the normal /facilities/search instead.
export default function SearchAutocomplete({ value, onChange, onSubmit, placeholder, inputStyle }: Props) {
  const [suggestions, setSuggestions] = useState<FacilitySuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      facilitiesApi
        .suggest(q, 6)
        .then((items) => {
          if (requestId !== requestIdRef.current) return; // a newer keystroke already superseded this
          setSuggestions(items);
          setOpen(items.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setSuggestions([]);
          setOpen(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(item: FacilitySuggestItem) {
    setOpen(false);
    navigate(`/facilities/${item.id}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") onSubmit();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex]);
      else {
        setOpen(false);
        onSubmit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={inputStyle}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid var(--g3)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            zIndex: 50,
            overflow: "hidden",
            textAlign: "left",
          }}
        >
          {suggestions.map((s, i) => (
            <div
              key={s.id}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background: i === activeIndex ? "var(--g1)" : "#fff",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{s.name}</div>
              {(s.city || s.state) && (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{[s.city, s.state].filter(Boolean).join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
