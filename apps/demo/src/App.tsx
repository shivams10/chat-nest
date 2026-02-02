import { useState, useRef, useEffect } from "react";
import { useAiChat, type AiUsageProfile } from "chat-nest-sdk";
import "./App.css";

const PROFILES: AiUsageProfile[] = ["constrained", "balanced", "expanded"];

const PROFILE_LABELS: Record<AiUsageProfile, string> = {
  constrained: "Constrained",
  balanced: "Balanced",
  expanded: "Expanded",
};

/** Daily token limit per profile (must match server). For display + default. */
const PROFILE_DAILY_LIMITS: Record<AiUsageProfile, number> = {
  constrained: 30_000,
  balanced: 70_000,
  expanded: 200_000,
};

/** Daily budget cap (tokens). 0 = use profile default. */
const DAILY_BUDGET_OPTIONS = [
  { value: 0, label: "Profile default" },
  { value: 30_000, label: "30k" },
  { value: 50_000, label: "50k" },
  { value: 70_000, label: "70k" },
  { value: 100_000, label: "100k" },
  { value: 200_000, label: "200k" },
] as const;

/** Max tokens per request (input + output). 0 = use profile default (2k). */
const MAX_TOKENS_OPTIONS = [
  { value: 0, label: "Profile default (2k)" },
  { value: 2048, label: "2k" },
  { value: 4096, label: "4k" },
  { value: 8192, label: "8k" },
  { value: 16_000, label: "16k" },
] as const;

const STORAGE_KEY_DAILY_BUDGET = "aiDailyBudgetCap";
const STORAGE_KEY_MAX_TOKENS = "aiMaxTokensPerRequest";

type DailyBudgetValue = (typeof DAILY_BUDGET_OPTIONS)[number]["value"];
type MaxTokensValue = (typeof MAX_TOKENS_OPTIONS)[number]["value"];

const VALID_DAILY_VALUES = new Set<number>(DAILY_BUDGET_OPTIONS.map((o) => o.value));
const VALID_MAX_TOKENS_VALUES = new Set<number>(MAX_TOKENS_OPTIONS.map((o) => o.value));

function readStoredDailyBudget(): DailyBudgetValue {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_BUDGET);
    if (raw !== null) {
      const n = Number(raw);
      if (VALID_DAILY_VALUES.has(n)) return n as DailyBudgetValue;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function readStoredMaxTokens(): MaxTokensValue {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAX_TOKENS);
    if (raw !== null) {
      const n = Number(raw);
      if (VALID_MAX_TOKENS_VALUES.has(n)) return n as MaxTokensValue;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function getBudgetLabel(value: number, profile: AiUsageProfile): string {
  if (value === 0) {
    return `Profile default (${(PROFILE_DAILY_LIMITS[profile] / 1000).toFixed(0)}k)`;
  }
  return `${(value / 1000).toFixed(0)}k`;
}

function getMaxTokensLabel(value: number): string {
  if (value === 0) return "Profile default (2k)";
  return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value);
}

export default function App() {
  const [input, setInput] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [maxTokensOpen, setMaxTokensOpen] = useState(false);
  const [dailyTokenLimit, setDailyTokenLimit] = useState(readStoredDailyBudget);
  const [maxTokensPerRequest, setMaxTokensPerRequest] = useState(readStoredMaxTokens);
  const profileRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const maxTokensRef = useRef<HTMLDivElement>(null);

  const chat = useAiChat({
    endpoint: "http://localhost:3001/api/chat",
    dailyTokenLimit: dailyTokenLimit > 0 ? dailyTokenLimit : undefined,
    maxTokensPerRequest: maxTokensPerRequest > 0 ? maxTokensPerRequest : undefined,
  });

  useEffect(() => {
    if (!profileOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!budgetOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (budgetRef.current && !budgetRef.current.contains(e.target as Node)) {
        setBudgetOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBudgetOpen(false);
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEscape);
    };
  }, [budgetOpen]);

  useEffect(() => {
    if (!maxTokensOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (maxTokensRef.current && !maxTokensRef.current.contains(e.target as Node)) {
        setMaxTokensOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMaxTokensOpen(false);
    };
    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onEscape);
    };
  }, [maxTokensOpen]);

  function handleSend() {
    if (!input.trim()) return;
    chat.sendMessage(input);
    setInput("");
  }

  function selectProfile(p: AiUsageProfile) {
    chat.setProfile(p);
    setProfileOpen(false);
  }

  function selectBudget(value: DailyBudgetValue) {
    setDailyTokenLimit(value);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_DAILY_BUDGET, String(value));
      }
    } catch {
      /* ignore */
    }
    setBudgetOpen(false);
  }

  function selectMaxTokens(value: MaxTokensValue) {
    setMaxTokensPerRequest(value);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MAX_TOKENS, String(value));
      }
    } catch {
      /* ignore */
    }
    setMaxTokensOpen(false);
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Chat Nest Demo</h1>
        <div className="profile-row" ref={profileRef}>
          <span className="profile-label">AI usage profile</span>
          <div className="profile-dropdown">
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setProfileOpen((o) => !o)}
              disabled={chat.isStreaming}
              aria-expanded={profileOpen}
              aria-haspopup="listbox"
              aria-label="AI usage profile"
              id="profile-trigger"
            >
              <span className="profile-trigger-value">
                {PROFILE_LABELS[chat.profile]}
              </span>
              <span className="profile-trigger-icon" aria-hidden>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 4.5L6 7.5L9 4.5" />
                </svg>
              </span>
            </button>
            {profileOpen && (
              <ul
                className="profile-menu"
                role="listbox"
                aria-labelledby="profile-trigger"
                aria-activedescendant={`profile-option-${chat.profile}`}
              >
                {PROFILES.map((p) => (
                  <li
                    key={p}
                    id={`profile-option-${p}`}
                    role="option"
                    aria-selected={chat.profile === p}
                    className={`profile-option ${chat.profile === p ? "profile-option--selected" : ""}`}
                    onClick={() => selectProfile(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectProfile(p);
                      }
                    }}
                  >
                    <span className="profile-option-label">{PROFILE_LABELS[p]}</span>
                    {chat.profile === p && (
                      <span className="profile-option-check" aria-hidden>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 7l3 3 6-6" />
                        </svg>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="budget-row" ref={budgetRef}>
            <span className="profile-label">Daily budget cap</span>
            <div className="profile-dropdown">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setBudgetOpen((o) => !o)}
                disabled={chat.isStreaming}
                aria-expanded={budgetOpen}
                aria-haspopup="listbox"
                aria-label="Daily token budget cap"
                id="budget-trigger"
              >
                <span className="profile-trigger-value">
                  {getBudgetLabel(dailyTokenLimit, chat.profile)}
                </span>
                <span className="profile-trigger-icon" aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 4.5L6 7.5L9 4.5" />
                  </svg>
                </span>
              </button>
              {budgetOpen && (
                <ul
                  className="profile-menu"
                  role="listbox"
                  aria-labelledby="budget-trigger"
                  aria-activedescendant={`budget-option-${dailyTokenLimit}`}
                >
                  {DAILY_BUDGET_OPTIONS.map(({ value, label }) => (
                    <li
                      key={value}
                      id={`budget-option-${value}`}
                      role="option"
                      aria-selected={dailyTokenLimit === value}
                      className={`profile-option ${dailyTokenLimit === value ? "profile-option--selected" : ""}`}
                      onClick={() => selectBudget(value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectBudget(value);
                        }
                      }}
                    >
                      <span className="profile-option-label">
                        {value === 0 ? getBudgetLabel(0, chat.profile) : label}
                      </span>
                      {dailyTokenLimit === value && (
                        <span className="profile-option-check" aria-hidden>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 7l3 3 6-6" />
                          </svg>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="budget-row" ref={maxTokensRef}>
            <span className="profile-label">Max tokens per request</span>
            <div className="profile-dropdown">
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setMaxTokensOpen((o) => !o)}
                disabled={chat.isStreaming}
                aria-expanded={maxTokensOpen}
                aria-haspopup="listbox"
                aria-label="Max tokens per request"
                id="max-tokens-trigger"
              >
                <span className="profile-trigger-value">
                  {getMaxTokensLabel(maxTokensPerRequest)}
                </span>
                <span className="profile-trigger-icon" aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 4.5L6 7.5L9 4.5" />
                  </svg>
                </span>
              </button>
              {maxTokensOpen && (
                <ul
                  className="profile-menu"
                  role="listbox"
                  aria-labelledby="max-tokens-trigger"
                  aria-activedescendant={`max-tokens-option-${maxTokensPerRequest}`}
                >
                  {MAX_TOKENS_OPTIONS.map(({ value, label }) => (
                    <li
                      key={value}
                      id={`max-tokens-option-${value}`}
                      role="option"
                      aria-selected={maxTokensPerRequest === value}
                      className={`profile-option ${maxTokensPerRequest === value ? "profile-option--selected" : ""}`}
                      onClick={() => selectMaxTokens(value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectMaxTokens(value);
                        }
                      }}
                    >
                      <span className="profile-option-label">{label}</span>
                      {maxTokensPerRequest === value && (
                        <span className="profile-option-check" aria-hidden>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 7l3 3 6-6" />
                          </svg>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="chat-main" role="log" aria-live="polite" aria-label="Chat messages">
        <div className="chat-messages">
          {chat.messages.map((m) => (
            <div
              key={m.id}
              className={`message ${m.role}`}
              role="listitem"
            >
              <div className="role">{m.role}</div>
              <div className="content">{m.content || ""}</div>
            </div>
          ))}
        </div>

        {chat.error && (
          <div className="error-banner" role="alert">
            {chat.error}
          </div>
        )}
      </main>

      <footer className="chat-footer">
        <div className="input-wrap">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message…"
            disabled={chat.isStreaming}
            aria-label="Message input"
          />
          <div className="actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSend}
              disabled={chat.isStreaming}
            >
              Send
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={chat.cancel}
              disabled={!chat.isStreaming}
              aria-label="Cancel request"
            >
              Cancel
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
