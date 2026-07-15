"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Clock, Mic, MicOff, Search, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "warka-recent-searches";
const MAX_RECENT = 8;

export type SearchSuggestion = {
  id: string;
  label: string;
  href: string;
  type?: "product" | "category";
};

type SmartSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: "ar" | "en";
  suggestions?: SearchSuggestion[];
  onSearch?: (query: string) => void;
  placeholder?: string;
};

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = loadRecentSearches().filter(
    (q) => q.toLowerCase() !== trimmed.toLowerCase()
  );
  const next = [trimmed, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function SmartSearch({
  open,
  onOpenChange,
  locale,
  suggestions = [],
  onSearch,
  placeholder,
}: SmartSearchProps) {
  const isAr = locale === "ar";
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  useEffect(() => {
    if (open) {
      setRecent(loadRecentSearches());
      window.setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setListening(false);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 6);
    return suggestions
      .filter((s) => s.label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, suggestions]);

  const commitSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      saveRecentSearch(trimmed);
      setRecent(loadRecentSearches());
      onSearch?.(trimmed);
      onOpenChange(false);
    },
    [onOpenChange, onSearch]
  );

  const startVoice = () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      toast.error(isAr ? "البحث الصوتي غير مدعوم" : "Voice search not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isAr ? "ar-IQ" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      commitSearch(transcript);
    };

    recognition.onerror = () => {
      toast.error(isAr ? "تعذّر التعرف على الصوت" : "Could not recognize speech");
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
    toast.message(isAr ? "استمع..." : "Listening...");
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed top-[12%] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2",
            "rounded-2xl border border-warka-border bg-card p-4 shadow-tint-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <Dialog.Title className="sr-only">
            {isAr ? "بحث" : "Search"}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            {isAr ? "ابحث عن المنتجات" : "Search products"}
          </Dialog.Description>

          <div className="flex items-center gap-2">
            <div className="flex h-10 min-h-10 flex-1 items-center gap-2 rounded-lg border border-warka-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Search className="size-4 shrink-0 text-warka-text-muted" aria-hidden />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitSearch(query);
                }}
                placeholder={
                  placeholder ??
                  (isAr ? "ابحث عن منتجات التخرج..." : "Search graduation products...")
                }
                className="h-auto min-h-0 flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 text-warka-text-muted hover:text-warka-text"
                  aria-label={isAr ? "مسح" : "Clear"}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                listening
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-warka-border bg-warka-bg text-warka-primary hover:bg-warka-primary/10"
              )}
              aria-label={isAr ? "بحث صوتي" : "Voice search"}
            >
              {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </button>
            <Dialog.Close
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-warka-border text-warka-text-muted hover:bg-warka-bg"
              aria-label={isAr ? "إغلاق" : "Close"}
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="mt-4 max-h-72 overflow-y-auto">
            {!query && recent.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warka-text-muted">
                  <Clock className="size-3.5" />
                  {isAr ? "عمليات البحث الأخيرة" : "Recent searches"}
                </p>
                <ul className="space-y-1">
                  {recent.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          commitSearch(term);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-start text-sm text-warka-text hover:bg-warka-bg"
                      >
                        {term}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {filtered.length > 0 ? (
              <ul className="space-y-1">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        saveRecentSearch(item.label);
                        onOpenChange(false);
                      }}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-warka-text transition-colors hover:bg-warka-bg"
                    >
                      <span>{item.label}</span>
                      {item.type && (
                        <span className="text-xs text-warka-text-muted capitalize">
                          {item.type}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              query.trim() && (
                <p className="px-3 py-6 text-center text-sm text-warka-text-muted">
                  {isAr ? "لا توجد نتائج" : "No results found"}
                </p>
              )
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
