"use client";

import { useCallback, useEffect, useState } from "react";

export type Card = {
  id: string;
  front: string;
  back: string;
  /** true once she marked it "Got it" in study mode */
  known: boolean;
};

export type Deck = {
  id: string;
  name: string;
  createdAt: number;
  cards: Card[];
};

const KEY = "evelyn-cards:v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read(): Deck[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Deck[]) : [];
  } catch {
    return [];
  }
}

function write(decks: Deck[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(decks));
  } catch {
    // storage full or blocked (private mode) - the app still works for this session
  }
}

/**
 * All decks, saved in this browser's localStorage.
 * `loaded` is false until the first read so pages avoid flashing an empty state.
 */
export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDecks(read());
    setLoaded(true);
  }, []);

  const update = useCallback((fn: (prev: Deck[]) => Deck[]) => {
    setDecks((prev) => {
      const next = fn(prev);
      write(next);
      return next;
    });
  }, []);

  const addDeck = useCallback(
    (name: string): string => {
      const id = uid();
      update((prev) => [
        { id, name: name.trim() || "Untitled deck", createdAt: Date.now(), cards: [] },
        ...prev,
      ]);
      return id;
    },
    [update]
  );

  const renameDeck = useCallback(
    (id: string, name: string) =>
      update((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name: name.trim() || d.name } : d))
      ),
    [update]
  );

  const deleteDeck = useCallback(
    (id: string) => update((prev) => prev.filter((d) => d.id !== id)),
    [update]
  );

  const addCard = useCallback(
    (deckId: string, front: string, back: string) =>
      update((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? {
                ...d,
                cards: [...d.cards, { id: uid(), front: front.trim(), back: back.trim(), known: false }],
              }
            : d
        )
      ),
    [update]
  );

  const editCard = useCallback(
    (deckId: string, cardId: string, front: string, back: string) =>
      update((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? {
                ...d,
                cards: d.cards.map((c) =>
                  c.id === cardId ? { ...c, front: front.trim(), back: back.trim() } : c
                ),
              }
            : d
        )
      ),
    [update]
  );

  const deleteCard = useCallback(
    (deckId: string, cardId: string) =>
      update((prev) =>
        prev.map((d) =>
          d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
        )
      ),
    [update]
  );

  const setKnown = useCallback(
    (deckId: string, cardId: string, known: boolean) =>
      update((prev) =>
        prev.map((d) =>
          d.id === deckId
            ? { ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, known } : c)) }
            : d
        )
      ),
    [update]
  );

  const resetProgress = useCallback(
    (deckId: string) =>
      update((prev) =>
        prev.map((d) =>
          d.id === deckId ? { ...d, cards: d.cards.map((c) => ({ ...c, known: false })) } : d
        )
      ),
    [update]
  );

  return {
    decks,
    loaded,
    addDeck,
    renameDeck,
    deleteDeck,
    addCard,
    editCard,
    deleteCard,
    setKnown,
    resetProgress,
  };
}
