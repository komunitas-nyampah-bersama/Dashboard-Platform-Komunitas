"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  intro?: boolean;
  error?: boolean;
};

type ChatPanelProps = {
  presets?: Array<{ id: string; title: string; description?: string | null }>;
};

const sanitizeText = (value: string) => value.replace(/\s+/g, " ").trim();

const ROLE_META: Record<Role, { name: string; initial: string }> = {
  user: { name: "Anda", initial: "🧑" },
  assistant: { name: "Abang Oky GPT", initial: "🤖" },
};

const DEFAULT_SUGGESTIONS: Array<{ id: string; title: string; description?: string }> = [
  {
    id: "outline",
    title: "Buatkan outline artikel ilmiah tentang keberlanjutan energi",
    description: "Struktur IMRAD lengkap dengan tujuan dan kontribusi penelitian.",
  },
  {
    id: "metode",
    title: "Rekomendasikan metode analisis statistik untuk data panel",
    description: "Bandingkan Fixed Effect, Random Effect, dan alternatif robust.",
  },
  {
    id: "literatur",
    title: "Carikan 5 referensi terbaru terkait green supply chain management",
    description: "Cantumkan ringkasan dan DOI untuk sitasi cepat.",
  },
  {
    id: "publikasi",
    title: "Susun strategi submit ke jurnal Q1 bidang lingkungan",
    description: "Sertakan rekomendasi jurnal, scope, dan gaya penulisan.",
  },
];

const createIntroMessage = (): Message => ({
  id: "intro",
  role: "assistant",
  intro: true,
  content:
    "Halo! Saya Abang Oky GPT, siap mendampingi riset, metodologi, dan publikasi Anda layaknya ChatGPT.",
});

function generateMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ChatPanel({ presets = [] }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([createIntroMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const suggestions = useMemo(() => {
    if (presets.length === 0) {
      return DEFAULT_SUGGESTIONS;
    }
    return presets.map((preset) => ({
      id: preset.id,
      title: preset.title,
      description: preset.description ?? undefined,
    }));
  }, [presets]);

  const historyPayload = useMemo(
    () =>
      messages
        .filter((message) => !message.intro)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [messages]
  );

  useEffect(() => {
    const node = threadRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const sendPrompt = useCallback(
    async (rawPrompt?: string) => {
      if (isLoading) {
        return;
      }

      const promptSource = rawPrompt ?? input;
      const prompt = sanitizeText(promptSource);
      if (!prompt) {
        setStatusMessage("Masukkan pertanyaan atau instruksi Anda terlebih dahulu.");
        return;
      }

      const userMessage: Message = {
        id: generateMessageId("user"),
        role: "user",
        content: prompt,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setStatusMessage(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            history: historyPayload,
          }),
        });

        if (!response.ok) {
          const { error: responseError } = await response.json();
          throw new Error(
            typeof responseError === "string"
              ? responseError
              : "Terjadi kesalahan tak terduga ketika menghubungi model.",
          );
        }

        const { message } = (await response.json()) as { message: string };
        const assistantMessage: Message = {
          id: generateMessageId("assistant"),
          role: "assistant",
          content: message,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStatusMessage(null);
      } catch (error) {
        const fallbackMessage =
          error instanceof Error ? error.message : "Tidak dapat memproses permintaan.";
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId("assistant"),
            role: "assistant",
            content: fallbackMessage,
            error: true,
          },
        ]);
        setStatusMessage(fallbackMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [historyPayload, input, isLoading]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await sendPrompt();
    },
    [sendPrompt]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: { title: string }) => {
      setInput(suggestion.title);
      setTimeout(() => {
        void sendPrompt(suggestion.title);
        textareaRef.current?.focus();
      }, 0);
    },
    [sendPrompt]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendPrompt();
      }
    },
    [sendPrompt]
  );

  const shouldShowSuggestions = messages.length === 1;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
    >
      <div className="chat-thread" ref={threadRef}>
        {messages.map((message) => {
          const meta = ROLE_META[message.role];
          return (
            <div
              key={message.id}
              className={`chat-message ${message.role} ${message.error ? "chat-message-error" : ""}`.trim()}
            >
              <div className={`chat-avatar ${message.role === "assistant" ? "assistant" : ""}`.trim()}>
                {meta.initial}
              </div>
              <div className="chat-bubble">
                <div className="chat-meta">{meta.name}</div>
                {message.content}
              </div>
            </div>
          );
        })}

        {shouldShowSuggestions ? (
          <div className="chat-suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="chat-suggestion"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="chat-suggestion-title">{suggestion.title}</div>
                {suggestion.description ? (
                  <div className="chat-suggestion-desc">{suggestion.description}</div>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}

        {isLoading ? (
          <div className="chat-typing-indicator">Abang Oky GPT sedang menulis…</div>
        ) : null}
      </div>

      <div className="chat-input-area">
        <form onSubmit={handleSubmit}>
          <div className="chat-input">
            <textarea
              ref={textareaRef}
              id="prompt"
              name="prompt"
              value={input}
              placeholder="Ketik pertanyaan Anda di sini. Tekan Enter untuk kirim, Shift+Enter untuk baris baru."
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Kirim pesan ke Abang Oky GPT"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={isLoading || !sanitizeText(input)}
              aria-label="Kirim pesan"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.4 20.6L21 12L3.4 3.4L3.6 10.5L15 12L3.6 13.5L3.4 20.6Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          {statusMessage ? <div className="chat-status">{statusMessage}</div> : null}
        </form>
      </div>
    </div>
  );
}

export default ChatPanel;
