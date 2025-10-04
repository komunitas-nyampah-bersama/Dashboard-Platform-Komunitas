import { NextResponse } from "next/server";

type HistoryMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatRequestBody = {
  prompt?: string;
  history?: HistoryMessage[];
};

const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-nano";

const extractMessageFromResponse = (payload: any): string => {
  if (!payload) {
    return "Model tidak mengembalikan respons.";
  }

  if (typeof payload.output_text === "string" && payload.output_text.length > 0) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload.output)) {
    const firstMessage = payload.output.find((item: any) => item.type === "message");
    if (firstMessage && Array.isArray(firstMessage.content)) {
      const textChunk = firstMessage.content.find((chunk: any) => chunk.type === "output_text");
      if (textChunk && typeof textChunk.text === "string") {
        return textChunk.text.trim();
      }
    }
  }

  return JSON.stringify(payload);
};

export async function POST(request: Request) {
  const body: ChatRequestBody = await request.json();
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt wajib diisi." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY belum disetel pada environment server." },
      { status: 500 }
    );
  }

  const history = Array.isArray(body.history)
    ? body.history.filter((message) => Boolean(message.content)).map((message) => ({
        role: message.role,
        content: message.content,
      }))
    : [];

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: [
          ...history,
          {
            role: "user",
            content: prompt,
          },
        ],
        store: true,
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => null);
      const message =
        errorResponse?.error?.message ??
        errorResponse?.message ??
        `Permintaan ke OpenAI gagal dengan status ${response.status}.`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const payload = await response.json();
    const message = extractMessageFromResponse(payload);

    return NextResponse.json({ message });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan ketika menghubungi OpenAI.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
