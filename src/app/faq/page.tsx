"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "What is catforcat?",
    a: "catforcat is a Computer-Assisted Translation (CAT) tool designed for professional translators, students, and language teams. It provides a side-by-side editor with Translation Memory, glossary management, QA checks, and AI-powered pre-translation.",
  },
  {
    q: "Is catforcat free?",
    a: "Yes. The Free plan includes unlimited projects, Translation Memory, glossary, QA checks, and export in 10+ formats. The Pro plan adds AI pre-translation, smart review, advanced analytics, and priority support.",
  },
  {
    q: "What file formats are supported?",
    a: "Import: DOCX, PDF, TXT, XLIFF, TMX, SRT, PO, HTML, JSON, Markdown. Export: all of the above plus CSV. We're constantly adding more formats based on user feedback.",
  },
  {
    q: "How does Translation Memory work?",
    a: "Every confirmed translation is saved to your Translation Memory. When you work on new segments, catforcat automatically suggests matches from your TM based on fuzzy matching. The more you translate, the smarter your TM becomes.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your translations, TM, and glossaries are stored securely on our servers. We never read, share, or sell your content. When you use AI features, source text is sent to the AI provider for processing but is not used for training.",
  },
  {
    q: "Can I work offline?",
    a: "Yes. catforcat works offline as a Progressive Web App (PWA). Your changes sync automatically when you reconnect to the internet.",
  },
  {
    q: "What is Classroom Mode?",
    a: "Classroom Mode lets professors create virtual classrooms, assign translation projects to students, review submissions with inline suggestions and Post-it annotations, and track progress in real time. It's designed for translation courses and workshops.",
  },
  {
    q: "What languages are supported?",
    a: "catforcat supports any language pair. The interface is in English, but you can translate between any combination of source and target languages, including right-to-left scripts.",
  },
  {
    q: "How do I cancel my Pro subscription?",
    a: "Go to Settings in the app and click 'Manage Subscription'. You can cancel at any time. Your Pro features remain active until the end of your billing period.",
  },
  {
    q: "Can I delete my account?",
    a: "Yes. Go to Settings and select 'Delete Account'. This permanently removes your account and all associated data from our servers.",
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-ui-family)",
          fontSize: 15,
          fontWeight: 500,
          color: "var(--text-primary)",
          textAlign: "left",
          lineHeight: 1.5,
          gap: 16,
        }}
      >
        <span>{item.q}</span>
        <svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
            color: "var(--text-muted)",
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 200ms ease",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            padding: "0 0 18px",
            margin: 0,
          }}
        >
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        color: "var(--text-primary)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          height: 60,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: 20,
            fontWeight: 400,
            color: "var(--brand-wordmark)",
            letterSpacing: "0.03em",
            textDecoration: "none",
          }}
        >
          catforcat.
        </Link>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 13,
            color: "var(--text-secondary)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
      </nav>

      {/* Content */}
      <main
        style={{
          flex: 1,
          maxWidth: 720,
          width: "100%",
          margin: "0 auto",
          padding: "48px 24px 80px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: 36,
            fontWeight: 400,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          FAQ
        </h1>
        <p
          style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 15,
            color: "var(--text-secondary)",
            marginBottom: 48,
            lineHeight: 1.6,
          }}
        >
          Frequently asked questions about catforcat.
        </p>

        <div
          style={{
            borderTop: "1px solid var(--border)",
          }}
        >
          {FAQ_ITEMS.map((item) => (
            <FAQAccordion key={item.q} item={item} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-display-family)",
            fontSize: 12,
            color: "var(--text-muted)",
            letterSpacing: "0.03em",
            textDecoration: "none",
          }}
        >
          catforcat.
        </Link>
      </footer>
    </div>
  );
}
