"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import Tesseract from "tesseract.js";
import { Bow, Heart } from "@/components/Decor";
import { useDecks } from "@/lib/store";

function buildCardsFromText(rawText: string) {
  const normalized = rawText
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();

  if (!normalized) {
    return [] as Array<{ front: string; back: string }>;
  }

  const segments = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((segment) => segment.replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim())
    .filter((segment) => segment.length > 20)
    .slice(0, 20);

  if (!segments.length) {
    return [{
      front: "What is the main idea of this lesson?",
      back: normalized.slice(0, 350) || "Review this lesson summary.",
    }];
  }

  const cards: Array<{ front: string; back: string }> = [];

  for (let index = 0; index < segments.length; index += 2) {
    const front = segments[index];
    const back = segments[index + 1] || `Key takeaway: ${segments[index]}`;

    if (front.length < 12 || back.length < 12) continue;

    cards.push({
      front: front.length > 120 ? `${front.slice(0, 117).trim()}...` : front,
      back: back.length > 220 ? `${back.slice(0, 217).trim()}...` : back,
    });
  }

  if (!cards.length) {
    return [{
      front: "What is the main idea of this lesson?",
      back: normalized.slice(0, 350),
    }];
  }

  return cards.slice(0, 12);
}

async function extractTextFromScannedPdfWithOcr(file: File) {
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/legacy/build/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;

  const pages = [] as string[];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 4); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      continue;
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const result = await Tesseract.recognize(canvas, "eng");
    const text = result.data.text?.trim() ?? "";

    if (text) {
      pages.push(text);
    }
  }

  const combinedText = pages.join("\n\n");
  if (!combinedText.trim()) {
    throw new Error("This PDF appears to be scanned or image-only, and OCR did not find readable text.");
  }

  return combinedText;
}

export default function EvelynCardsPage() {
  const router = useRouter();
  const { decks, loaded, addDeck, addCard } = useDecks();
  const [name, setName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const messages = [
    "I love you bebe, galingan mo magreview always <3",
    "Kamusta araw mo? inaway ka nanaman ba ng mga kaibigan mu??!?!",
    "Pakyu sa mga kontra dun ka lang sa suporta palagi 100%",
    "Be husayan mo sa exam lasmo hehe",
  ];
  const [motivation, setMotivation] = useState<string>("");

  useEffect(() => {
    if (!motivation) {
      setMotivation(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, [motivation]);

  async function handlePdfUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const looksLikePdf = file.type === "application/pdf" || file.type === "application/octet-stream" || file.name.toLowerCase().endsWith(".pdf");

    if (!looksLikePdf) {
      setUploadError("Please upload a PDF file.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Please keep the PDF under 15MB for a smooth upload.");
      return;
    }

    setUploadError("");
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf-to-cards", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.cards?.length) {
        const deckName = payload.name || file.name.replace(/\.pdf$/i, "") || "Uploaded lesson";
        const deckId = addDeck(deckName);
        payload.cards.forEach((card: { front: string; back: string }) => {
          addCard(deckId, card.front, card.back);
        });

        event.target.value = "";
        router.push(`/deck/${deckId}`);
        return;
      }

      const scannedPdfMessage = String(payload.error ?? "").toLowerCase();
      if (
        response.status === 422 ||
        scannedPdfMessage.includes("scanned") ||
        scannedPdfMessage.includes("image-only") ||
        scannedPdfMessage.includes("could not be processed")
      ) {
        const ocrText = await extractTextFromScannedPdfWithOcr(file);
        const cards = buildCardsFromText(ocrText);

        if (!cards.length) {
          throw new Error("OCR did not find enough readable text to build study cards.");
        }

        const deckName = file.name.replace(/\.pdf$/i, "") || "Uploaded lesson";
        const deckId = addDeck(deckName);
        cards.forEach((card) => addCard(deckId, card.front, card.back));

        event.target.value = "";
        router.push(`/deck/${deckId}`);
        return;
      }

      throw new Error(payload.error || "We couldn’t turn this PDF into cards.");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Something went wrong while generating cards.");
    } finally {
      setIsGenerating(false);
    }
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const id = addDeck(name);
    setName("");
    router.push(`/deck/${id}`);
  }

  return (
    <>
      <header className="topbar">
        <div className="header-actions">
          <Link href="/" className="nav-back" aria-label="Back to review center">
            ← Back to review center
          </Link>
        </div>
      </header>

      <header className="topbar" style={{ marginTop: 8 }}>
        <div className="brand" style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }}>
          <Bow size={40} />
          <div>
            Evelyn Cards <Heart size={18} />
            <small>made by adan ;)</small>
          </div>
        </div>
      </header>

      {motivation && <div className="mini-bubble">{motivation}</div>}

      <section className="hero">
        <div>
          <h1>Let&apos;s review, cutie!</h1>
          <p>Make a deck, add cards, and flip through them anytime. Everything saves on this device.</p>
        </div>
      </section>

      <form className="panel stack" onSubmit={create}>
        <label className="field">
          New deck
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Pharmacology - Chapter 3"
            maxLength={80}
          />
        </label>
        <button className="btn" type="submit" disabled={!name.trim()}>
          Create deck
        </button>
      </form>

      <div className="panel upload-panel">
        <div className="upload-header">
          <h2>Generate deck from PDF</h2>
          <p>Upload a lesson PDF under 15MB. Best results come from text-based PDFs; scanned image PDFs may need OCR later.</p>
        </div>

        <label className="upload-box">
          <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={isGenerating} />
          <span>{isGenerating ? "Generating cards..." : "Choose PDF"}</span>
        </label>

        {uploadError && <div className="upload-error">{uploadError}</div>}
      </div>

      <h2 className="section-title">My decks</h2>

      {!loaded ? null : decks.length === 0 ? (
        <div className="panel empty">
          <Bow size={56} />
          <p>No decks yet. Create your first one above!</p>
        </div>
      ) : (
        <div className="stack">
          {decks.map((d) => {
            const known = d.cards.filter((c) => c.known).length;
            const pct = d.cards.length ? Math.round((known / d.cards.length) * 100) : 0;
            return (
              <Link key={d.id} href={`/deck/${d.id}`} className="deck-card">
                <div className="deck-icon">
                  <Heart size={26} color="#ff7fb0" />
                </div>
                <div className="grow">
                  <h3>{d.name}</h3>
                  <div className="meta">
                    {d.cards.length} {d.cards.length === 1 ? "card" : "cards"}
                    {d.cards.length > 0 ? ` · ${pct}% got it` : ""}
                  </div>
                  {d.cards.length > 0 && (
                    <div className="bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
