import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { answer: "GROQ_API_KEY is not configured on the server." },
      { status: 200 },
    );
  }

  const body = await request.json().catch(() => null);
  const context = typeof body?.context === "string" ? body.context : "";
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
        max_tokens: 400,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "You are a concise data analyst for a biochar production dashboard.",
              "Answer only in English. Be specific with numbers. Keep answers short.",
              `Data:\n${context}`,
            ].join("\n"),
          },
          ...messages.map((message: { role?: string; content?: string }) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: String(message.content ?? ""),
          })),
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ answer: `AI request failed: ${response.status} ${response.statusText}` });
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content ?? "No answer returned.";
    return NextResponse.json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ answer: `AI request failed: ${message}` });
  }
}
