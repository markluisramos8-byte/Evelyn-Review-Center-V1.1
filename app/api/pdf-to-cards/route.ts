import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextResponse } from "next/server";

type GeneratedCard = {
  front: string;
  back: string;
};

function cleanText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function buildFlashcards(rawText: string): GeneratedCard[] {
  const normalized = cleanText(rawText);
  if (!normalized) {
    return [];
  }

  const segments = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => cleanText(segment))
    .filter((segment) => segment.length > 20)
    .slice(0, 20);

  if (segments.length === 0) {
    return [{
      front: "What is the main idea of this lesson?",
      back: normalized.slice(0, 350) || "Review this lesson summary.",
    }];
  }

  const cards: GeneratedCard[] = [];

  for (let index = 0; index < segments.length; index += 2) {
    const front = segments[index];
    const back = segments[index + 1] || `Key takeaway: ${segments[index]}`;

    if (front.length < 12 || back.length < 12) continue;

    cards.push({
      front: front.length > 120 ? `${front.slice(0, 117).trim()}...` : front,
      back: back.length > 220 ? `${back.slice(0, 217).trim()}...` : back,
    });
  }

  if (cards.length === 0) {
    return [{
      front: "What is the main idea of this lesson?",
      back: normalized.slice(0, 350),
    }];
  }

  return cards.slice(0, 12);
}

async function extractTextFromPdf(buffer: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerSrc = pathToFileURL(
    path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
  ).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const document = await pdfjs.getDocument({ data: buffer }).promise;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    if (pageText.trim()) {
      pageTexts.push(pageText);
    }
  }

  return pageTexts.join("\n\n");
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file was uploaded." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const text = await extractTextFromPdf(bytes);

    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "This PDF looks scanned or image-only, so there isn’t readable text to turn into cards. Please upload a text-based PDF. Free OCR is possible later, but this version keeps the flow simple and free.",
        },
        { status: 422 }
      );
    }

    const cards = buildFlashcards(text || "");

    if (!cards.length) {
      return NextResponse.json({
        name: file.name.replace(/\.pdf$/i, "") || "Uploaded lesson",
        cards: [
          {
            front: "What is this lesson about?",
            back: "This PDF was uploaded, but it did not contain readable text. Try a simpler text-based PDF or a smaller file.",
          },
        ],
      });
    }

    return NextResponse.json({
      name: file.name.replace(/\.pdf$/i, "") || "Uploaded lesson",
      cards,
    });
  } catch (error) {
    console.error("pdf-to-cards failed", error);
    return NextResponse.json(
      {
        error:
          "This PDF looks scanned or image-only, so there isn’t readable text to turn into cards. Please upload a text-based PDF. Free OCR is possible later, but this version keeps the flow simple and free.",
      },
      { status: 422 }
    );
  }
}
