import ChatPanel from "@/components/chat/ChatPanel";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

import type { PostgrestSingleResponse } from "@supabase/supabase-js";

type TodoRecord = Record<string, unknown> & {
  id?: string | number;
  title?: string | null;
  task?: string | null;
  description?: string | null;
};

type SupabaseEntry = {
  id: string;
  title: string;
  description: string | null;
};

const toDisplayValue = (todo: TodoRecord) => {
  if (todo.title && typeof todo.title === "string") {
    return todo.title;
  }
  if (todo.task && typeof todo.task === "string") {
    return todo.task;
  }
  if (todo.description && typeof todo.description === "string") {
    return todo.description;
  }
  const entries = Object.entries(todo)
    .filter(([key]) => key !== "id")
    .map(([key, value]) => `${key}: ${value}`);
  return entries.length > 0 ? entries.join(", ") : JSON.stringify(todo);
};

const FALLBACK_CONVERSATIONS: SupabaseEntry[] = [
  {
    id: "riset",
    title: "Eksplorasi topik riset",
    description: "Ajukan ide dan dapatkan referensi akademik terkini.",
  },
  {
    id: "metodologi",
    title: "Analisis metodologi",
    description: "Diskusikan pendekatan penelitian dan teknik analisis data.",
  },
  {
    id: "publikasi",
    title: "Strategi publikasi",
    description: "Rencanakan jurnal target beserta strategi submit.",
  },
];

const mapTodosToEntries = (todos: PostgrestSingleResponse<TodoRecord[]>["data"]) => {
  if (!Array.isArray(todos)) {
    return [] as SupabaseEntry[];
  }

  return todos.map((todo, index) => {
    const record = todo as TodoRecord;
    return {
      id: String(record.id ?? index),
      title: toDisplayValue(record),
      description: record.description ?? null,
    } satisfies SupabaseEntry;
  });
};

export default async function Page() {
  const supabaseConfigured = isSupabaseConfigured();

  let supabaseEntries: SupabaseEntry[] = [];
  let supabaseError: string | null = null;

  if (supabaseConfigured) {
    try {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);
      const { data: todos, error } = await supabase.from("todos").select().limit(12);

      if (error) {
        supabaseError = error.message;
      }
      supabaseEntries = mapTodosToEntries(todos);
    } catch (error) {
      supabaseError =
        error instanceof Error
          ? error.message
          : "Terjadi kegagalan saat menghubungkan ke Supabase.";
    }
  } else {
    supabaseError =
      "Supabase belum dikonfigurasi. Isi variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.";
  }

  const conversations =
    supabaseEntries.length > 0 ? supabaseEntries : FALLBACK_CONVERSATIONS;

  return (
    <main>
      <div className="chat-shell">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>Abang Oky GPT</span>
              <div style={{ fontSize: "0.8rem", color: "rgba(236, 236, 241, 0.6)" }}>
                Pendamping riset dan publikasi Anda
              </div>
            </div>
            <button type="button" className="chat-new-chat">
              <span aria-hidden="true">＋</span>
              Obrolan Baru
            </button>
          </div>

          <nav className="chat-conversation-list" aria-label="Daftar riwayat percakapan">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="chat-conversation-item">
                <span aria-hidden="true">💬</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{conversation.title}</div>
                  {conversation.description ? (
                    <div style={{ fontSize: "0.8rem", color: "rgba(236, 236, 241, 0.6)" }}>
                      {conversation.description}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </nav>

          <div className="chat-sidebar-section">
            <h3>Supabase Todos</h3>
            {supabaseError ? (
              <p style={{ margin: 0, color: "rgba(239, 68, 68, 0.8)" }}>{supabaseError}</p>
            ) : supabaseEntries.length > 0 ? (
              <ul>
                {supabaseEntries.slice(0, 5).map((todo) => (
                  <li key={todo.id} style={{ color: "rgba(236, 236, 241, 0.8)" }}>
                    {todo.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: "rgba(236, 236, 241, 0.6)" }}>
                Tambahkan data pada tabel <code>todos</code> untuk mengisi daftar ini.
              </p>
            )}
          </div>

          <div className="chat-sidebar-footer">
            Terhubung aman dengan Supabase &amp; OpenAI Responses API. Sesi login akan
            tersinkron otomatis melalui middleware.
          </div>
        </aside>

        <div className="chat-main">
          <header className="chat-header">
            <h1>ChatGPT Custom Bridge</h1>
            <p>
              Ajukan pertanyaan penelitian, metodologi, hingga strategi publikasi. Abang
              Oky GPT siap membantu dengan gaya interaksi layaknya ChatGPT.
            </p>
          </header>
          <ChatPanel presets={supabaseEntries} />
        </div>
      </div>
    </main>
  );
}
