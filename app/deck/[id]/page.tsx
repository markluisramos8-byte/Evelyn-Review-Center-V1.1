"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Bow } from "@/components/Decor";
import { useDecks } from "@/lib/store";

export default function DeckPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { decks, loaded, renameDeck, deleteDeck, addCard, editCard, deleteCard, resetProgress } =
    useDecks();

  const deck = decks.find((d) => d.id === params.id);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "card"; cardId: string }
    | { kind: "deck" }
    | null
  >(null);

  if (!loaded) return null;

  if (!deck) {
    return (
      <>
        <header className="topbar">
          <Link href="/evelyn-cards" className="back" aria-label="Back to decks">
            ←
          </Link>
        </header>
        <div className="panel empty">
          <Bow size={56} />
          <p>We couldn&apos;t find this deck on this device.</p>
          <p>
            <Link href="/evelyn-cards" className="btn small">
              Back to my decks
            </Link>
          </p>
        </div>
      </>
    );
  }

  function submitCard(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deck) return;
    addCard(deck.id, front, back);
    setFront("");
    setBack("");
  }

  function startEdit(id: string, f: string, b: string) {
    setEditingId(id);
    setEditFront(f);
    setEditBack(b);
  }

  function saveEdit() {
    if (!deck || !editingId || !editFront.trim() || !editBack.trim()) return;
    editCard(deck.id, editingId, editFront, editBack);
    setEditingId(null);
  }

  const known = deck.cards.filter((c) => c.known).length;

  return (
    <>
      <div className="grow" style={{ marginBottom: 14 }}>
        {renaming ? (
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              renameDeck(deck.id, newName);
              setRenaming(false);
            }}
          >
            <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} autoFocus />
            <button className="btn small" type="submit">
              Save
            </button>
          </form>
        ) : (
          <h1
            style={{
              fontSize: "clamp(2.1rem, 7vw, 3.4rem)",
              color: "var(--pink-600)",
              overflowWrap: "anywhere",
              textAlign: "center",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: "0 0 8px",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            {deck.name}
          </h1>
        )}
        <div className="meta" style={{ textAlign: "center" }}>
          {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
          {deck.cards.length > 0 ? ` · ${known} got it` : ""}
        </div>
      </div>

      <form className="panel stack" onSubmit={submitCard}>
        <h2 style={{ fontSize: "1.05rem", color: "var(--pink-600)" }}>Add a card</h2>
        <label className="field">
          Front (question)
          <textarea value={front} onChange={(e) => setFront(e.target.value)} placeholder="What is...?" />
        </label>
        <label className="field">
          Back (answer)
          <textarea value={back} onChange={(e) => setBack(e.target.value)} placeholder="The answer" />
        </label>
        <button className="btn" type="submit" disabled={!front.trim() || !back.trim()}>
          Add card
        </button>
      </form>

      <h2 className="section-title">Cards</h2>

      {deck.cards.length === 0 ? (
        <div className="panel empty">
          <Bow size={56} />
          <p>No cards yet. Add your first one above!</p>
        </div>
      ) : (
        <div className="stack">
          {deck.cards.map((c) =>
            editingId === c.id ? (
              <div key={c.id} className="card-item">
                <textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} />
                <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} />
                <div className="row">
                  <button className="btn small" onClick={saveEdit} disabled={!editFront.trim() || !editBack.trim()}>
                    Save
                  </button>
                  <button className="btn small ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div key={c.id} className="card-item">
                <div className="row">
                  <span className={c.known ? "pill done" : "pill"}>{c.known ? "Got it" : "Learning"}</span>
                </div>
                <div className="q">{c.front}</div>
                <div className="a">{c.back}</div>
                <div className="row">
                  <button className="btn small soft" onClick={() => startEdit(c.id, c.front, c.back)}>
                    Edit
                  </button>
                  <button className="btn small danger" onClick={() => setPendingDelete({ kind: "card", cardId: c.id })}>
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <h2 className="section-title">Deck options</h2>
      <div className="panel stack">
        <div className="row wrap">
          <button
            className="btn small soft"
            onClick={() => {
              setNewName(deck.name);
              setRenaming(true);
            }}
          >
            Rename deck
          </button>
          <button
            className="btn small soft"
            disabled={known === 0}
            onClick={() => resetProgress(deck.id)}
          >
            Reset progress
          </button>
          <button className="btn small danger" onClick={() => setPendingDelete({ kind: "deck" })}>
            Delete deck
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">
              {pendingDelete.kind === "card" ? "Delete this card?" : `Delete "${deck.name}" and all its cards?`}
            </p>
            <div className="modal-actions">
              <button
                className="btn small"
                onClick={() => {
                  if (pendingDelete.kind === "card") {
                    deleteCard(deck.id, pendingDelete.cardId);
                  } else {
                    deleteDeck(deck.id);
                    router.push("/evelyn-cards");
                  }
                  setPendingDelete(null);
                }}
              >
                OK
              </button>
              <button className="btn small soft" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deck.cards.length > 0 && (
        <div className="dock">
          <div className="inner" style={{ display: "grid", gap: 10 }}>
            <Link href={`/study/${deck.id}`} className="btn" style={{ display: "block", textAlign: "center" }}>
              Study this deck
            </Link>
            <Link href="/evelyn-cards" className="nav-back" aria-label="Back to decks" style={{ display: "block", textAlign: "center" }}>
              ← Back to decks
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
