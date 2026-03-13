# CATforCAT

**Computer-Assisted Translation tool — by a CAT.**

A professional CAT tool built with Next.js 16 for freelance translators.

## Features

- Segment-based translation editor with floating paper UI
- Translation Memory (TM) with fuzzy matching
- Glossary management with auto-detection
- QA checks, concordance search, analysis
- Pre-translate with TM + AI providers
- XLIFF / DOCX / PDF / TXT file import & export
- Dark / light theme, keyboard shortcuts
- Offline-first with sync queue

## Stack

Next.js 16 · Tailwind v4 · Prisma 6 · Zustand · SQLite · NextAuth · Stripe

## Getting Started

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
