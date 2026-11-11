"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Bow, Heart } from "@/components/Decor";
import { useDecks, type Card } from "@/lib/store";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudyPage() {
  const params = useParams<{ id: string }>();
  const { decks, loaded, setKnown } = useDecks();
  const deck = decks.find((d) => d.id === params.id);

  /** Queue of card ids for this round; null until she starts a round. */
  const [queue, setQueue] = useState<string[] | null>(null);
  const [missedCount, setMissedCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  const byId = useMemo(() => {
    const m = new Map<string, Card>();
    deck?.cards.forEach((c) => m.set(c.id, c));
    return m;
  }, [deck]);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .replace(/\s+/g, " ");

  const answersMatch = (submitted: string, expected: string) =>
    normalizeText(submitted) === normalizeText(expected);

  const playResultSound = (type: "correct" | "incorrect") => {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new CustomEvent("app:result-sound", { detail: { type } }));
    }
  };

  const resetAnswerState = () => {
    setInputValue("");
    setShowAnswer(false);
    setResult(null);
  };

  const perfectMessages = ["angbangis perfect!", "Lupit mo naman!", "Tama lahat buseng"];
  const goodMessages = ["wow galing!", "nice one bebe!", "good job bebe ko!"];

  if (!loaded) return null;

  if (!deck || deck.cards.length === 0) {
    return (
      <>
        <header className="topbar">
          <div className="header-actions">
            <Link href="/evelyn-cards" className="nav-back" aria-label="Back to decks">
              ← Back to decks
            </Link>
          </div>
        </header>
        <div className="panel empty">
          <Bow size={56} />
          <p>There&apos;s nothing to study here yet. Add some cards first!</p>
        </div>
      </>
    );
  }

  const deckId = deck.id;
  const total = deck.cards.length;
  const unknownIds = deck.cards.filter((c) => !c.known).map((c) => c.id);

  function startRound(ids: string[]) {
    setQueue(shuffle(ids));
    setMissedCount(0);
    resetAnswerState();
  }

  function submitAnswer() {
    if (!queue) return;
    const [currentId, ...rest] = queue;
    const current = byId.get(currentId);

    if (!current) {
      setQueue(rest);
      resetAnswerState();
      return;
    }

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const correct = answersMatch(trimmed, current.back);
    const nextResult = correct ? "correct" : "incorrect";

    setKnown(deckId, currentId, correct);
    if (!correct) setMissedCount((n) => n + 1);

    setResult(nextResult);
    setShowAnswer(true);
    playResultSound(nextResult);

    setTimeout(() => {
      setShowAnswer(false);
      setResult(null);
      setInputValue("");
      setQueue(rest);
    }, 1200);
  }

  function skipCard() {
    if (!queue) return;
    const [currentId, ...rest] = queue;
    setKnown(deckId, currentId, false);
    setMissedCount((n) => n + 1);
    setResult("incorrect");
    setShowAnswer(true);
    playResultSound("incorrect");
    setInputValue("");
  }

  function goToNextCard() {
    if (!queue) return;
    const [, ...rest] = queue;
    setShowAnswer(false);
    setResult(null);
    setInputValue("");
    setQueue(rest);
  }

  // Start screen
  if (queue === null) {
    return (
      <>
        <h1
          style={{
            fontSize: "clamp(2.1rem, 7vw, 3.5rem)",
            color: "var(--pink-600)",
            overflowWrap: "anywhere",
            textAlign: "center",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}
        >
          {deck.name}
        </h1>
        <div className="panel celebrate">
          <Bow size={64} />
          <h2>ready ka na ba bebe?</h2>
          <p className="meta">
            {total} {total === 1 ? "card" : "cards"} · {total - unknownIds.length} marked &quot;got it&quot;
          </p>
          <div className="stack" style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => startRound(deck.cards.map((c) => c.id))}>
              Study all cards
            </button>
            <button
              className="btn soft"
              disabled={unknownIds.length === 0}
              onClick={() => startRound(unknownIds)}
            >
              Only the ones I&apos;m still learning ({unknownIds.length})
            </button>
          </div>
        </div>

        <div className="dock" style={{ position: "fixed" }}>
          <div className="inner">
            <Link href={`/deck/${deckId}`} className="nav-back" aria-label="Back to deck" style={{ display: "block", textAlign: "center" }}>
              ← Back to deck
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Round finished
  if (queue.length === 0) {
    const stillLearning = deck.cards.filter((c) => !c.known).map((c) => c.id);
    const successMessage =
      missedCount === 0
        ? perfectMessages[Math.floor(Math.random() * perfectMessages.length)]
        : goodMessages[Math.floor(Math.random() * goodMessages.length)];

    return (
      <>
        <div className="panel celebrate">
          <Heart size={48} />
          <h2>{successMessage}</h2>
          <p className="meta">
            {stillLearning.length === 0
              ? "Every card in this deck is marked as got it."
              : `${stillLearning.length} ${stillLearning.length === 1 ? "card is" : "cards are"} still in learning.`}
          </p>
          <div className="stack" style={{ marginTop: 16 }}>
            {stillLearning.length > 0 && (
              <button className="btn" onClick={() => startRound(stillLearning)}>
                Practice the ones I missed
              </button>
            )}
            <button className="btn soft" onClick={() => startRound(deck.cards.map((c) => c.id))}>
              Study all again
            </button>
          </div>
        </div>

        <div className="dock" style={{ position: "fixed" }}>
          <div className="inner">
            <Link href={`/deck/${deckId}`} className="nav-back" aria-label="Back to deck" style={{ display: "block", textAlign: "center" }}>
              ← Back to deck
            </Link>
          </div>
        </div>
      </>
    );
  }

  const current = byId.get(queue[0]);
  if (!current) {
    return (
      <div className="panel celebrate">
        <p className="meta">This card is no longer in the deck.</p>
        <button className="btn" onClick={() => setQueue(queue.slice(1))}>
          Next card
        </button>
      </div>
    );
  }

  const cardClasses = ["flip"]; 
  if (showAnswer) cardClasses.push("flipped");
  if (result === "correct") cardClasses.push("success");
  if (result === "incorrect") cardClasses.push("error");

  return (
    <>
      <div className="grow" style={{ marginBottom: 12 }}>
        <div className="bar" style={{ marginTop: 0 }}>
          <span style={{ width: `${Math.round(((total - queue.length) / total) * 100)}%` }} />
        </div>
      </div>

      <div className="study-count">{queue.length} left</div>

      <button
        key={current.id}
        type="button"
        className={cardClasses.join(" ")}
        onClick={() => setShowAnswer((v) => !v)}
        aria-label={showAnswer ? "Hide answer" : "Show answer"}
      >
        <div className="flip-inner">
          <div className="face front">
            <span className="tag">Question</span>
            {current.front}
          </div>
          <div className="face back">
            <span className="tag">Answer</span>
            {current.back}
          </div>
        </div>
      </button>

      <div className="answer-panel">
        <label className="field">
          Your answer
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitAnswer();
              }
            }}
            placeholder="Type what you remember..."
            autoComplete="off"
          />
        </label>

        <div className="answer-actions">
          <button type="button" className="btn" onClick={submitAnswer} disabled={!inputValue.trim()}>
            Enter
          </button>
          <button type="button" className="btn soft" onClick={showAnswer ? goToNextCard : skipCard}>
            {showAnswer ? "Next" : "Pass?"}
          </button>
        </div>

        {result && (
          <div className={`status-pill ${result}`}>
            {result === "correct" ? "Correct — nice work!" : "Not quite — keep going!"}
          </div>
        )}
      </div>

      <div className="dock" style={{ position: "fixed" }}>
        <div className="inner">
          <Link href={`/deck/${deckId}`} className="nav-back" aria-label="Back to deck" style={{ display: "block", textAlign: "center" }}>
            ← Back to deck
          </Link>
        </div>
      </div>
    </>
  );
}
