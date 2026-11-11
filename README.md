# Evelyn Cards

A pink, mobile-first flashcard site for reviewing anything. Built with Next.js (App Router) and deployable on Vercel.

## What works now (v0.1)

- Create decks and add, edit and delete cards
- Study mode with tap-to-flip cards, "Got it" / "Still learning", and a round summary
- Progress bar per deck
- Everything saves in the browser (localStorage), so no account is needed

## Roadmap

1. PDF upload that generates flashcards (server route + AI, with a usage limit)
2. Accounts and cloud saving so decks sync between phone and laptop
3. More polish: themes, import/export, search

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy on Vercel

Import this repo in Vercel. The defaults for Next.js work as-is, no environment variables needed for v0.1.
