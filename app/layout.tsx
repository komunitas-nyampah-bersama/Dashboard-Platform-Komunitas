import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatGPT Custom Bridge",
  description:
    "Antarmuka bergaya ChatGPT untuk menghubungkan GPT kustom OpenAI dengan Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="chat-body">{children}</body>
    </html>
  );
}
