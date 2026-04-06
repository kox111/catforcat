# Fase 15: Performance + Security — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CATforCAT handle 5,000+ segments without lag and meet minimum security standards for professional/agency use.

**Architecture:** Four independent workstreams: (1) virtualize the segment list using @tanstack/react-virtual, (2) add TOTP-based 2FA with QR setup flow, (3) persist rate limiting to DB instead of in-memory, (4) add CSP and missing security headers. Each workstream can be committed independently.

**Tech Stack:** @tanstack/react-virtual (virtualization), otpauth (TOTP generation/verification), qrcode (QR code generation), existing Prisma/PostgreSQL, existing Next.js headers config.

**Key files:**
- Editor page: `catforcat/src/app/app/projects/[id]/page.tsx` (2,283 lines)
- SegmentRow: `catforcat/src/components/editor/SegmentRow.tsx` (562 lines)
- Auth: `catforcat/src/lib/auth.ts`
- Middleware: `catforcat/src/middleware.ts`
- Next config: `catforcat/next.config.ts`
- API translate (rate limit): `catforcat/src/app/api/translate/route.ts`

---

## Task 1: Install dependencies

**Files:**
- Modify: `catforcat/package.json`

- [ ] **Step 1: Install virtualization library**

```bash
cd catforcat && npm install @tanstack/react-virtual
```

- [ ] **Step 2: Install 2FA libraries**

```bash
cd catforcat && npm install otpauth qrcode && npm install -D @types/qrcode
```

- [ ] **Step 3: Verify build still compiles**

Run: `cd catforcat && npx next build`
Expected: Build succeeds with no new errors.

- [ ] **Step 4: Commit**

```bash
cd catforcat && git add package.json package-lock.json
git commit -m "chore: add @tanstack/react-virtual, otpauth, qrcode for Fase 15"
```

---

## Task 2: Virtualize the segment list

**Why:** The editor currently renders ALL segments in the DOM via `filteredSegments.map()` at line 1850 of page.tsx. With 2,000+ segments, this creates 2,000+ DOM nodes with textareas, event handlers, and glossary highlights. The browser chokes. Virtualization renders only the ~20-30 visible rows.

**Files:**
- Create: `catforcat/src/components/editor/VirtualSegmentList.tsx`
- Modify: `catforcat/src/app/app/projects/[id]/page.tsx` (replace the .map() block)

- [ ] **Step 1: Create VirtualSegmentList component**

Create file `catforcat/src/components/editor/VirtualSegmentList.tsx`:

```tsx
"use client";

import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import SegmentRow from "./SegmentRow";

// Segment type matching what the editor page passes
interface SegmentData {
  id: string;
  position: number;
  sourceText: string;
  targetText: string;
  status: string;
  metadata: string;
  reviewStatus?: string;
  aiScore?: number | null;
  aiScoreReason?: string | null;
  previousTargetText?: string;
}

interface VirtualSegmentListProps {
  segments: SegmentData[];
  activeSegmentId: string | null;
  onActivate: (id: string) => void;
  onTargetChange: (id: string, text: string) => void;
  registerRef: (id: string, el: HTMLTextAreaElement | null) => void;
  highlightTermsForSegment: (id: string) => string[];
  onRequestAI?: (id: string) => (() => void) | undefined;
  aiLoading: (id: string) => boolean;
  tgtLang: string;
  getComment: (id: string, metadata: string) => string;
  onNoteClick: (id: string, position: number, comment: string) => void;
  onContextMenu: (id: string, e: React.MouseEvent) => void;
  fontSize: number;
  columnRatio: number;
  focusMode: boolean;
  reviewMode?: boolean;
  onReviewAction?: (segId: string, action: "accepted" | "rejected") => void;
}

// Estimated row height — virtualizer adjusts dynamically after measure
const ESTIMATED_ROW_HEIGHT = 72;

export default function VirtualSegmentList(props: VirtualSegmentListProps) {
  const {
    segments,
    activeSegmentId,
    onActivate,
    onTargetChange,
    registerRef,
    highlightTermsForSegment,
    onRequestAI,
    aiLoading,
    tgtLang,
    getComment,
    onNoteClick,
    onContextMenu,
    fontSize,
    columnRatio,
    focusMode,
    reviewMode,
    onReviewAction,
  } = props;

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: segments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 10, // render 10 extra rows above/below viewport
  });

  const scrollToSegment = useCallback(
    (segmentId: string) => {
      const idx = segments.findIndex((s) => s.id === segmentId);
      if (idx >= 0) {
        virtualizer.scrollToIndex(idx, { align: "center" });
      }
    },
    [segments, virtualizer],
  );

  // Expose scrollToSegment via ref on the parent div
  // The editor page can call parentRef.current.dataset.scrollTo = segmentId
  // and we pick it up. Alternatively, use a callback prop.
  // For simplicity, we attach it to the DOM element.

  return (
    <div
      ref={parentRef}
      data-virtual-list="true"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        margin: "0 20px 16px 20px",
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        boxShadow: "0 4px 24px var(--paper-shadow)",
        border: "1px solid var(--bg-hover)",
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const segment = segments[virtualRow.index];
          let comment = "";
          try {
            comment = getComment(segment.id, segment.metadata || "{}");
          } catch {
            /* ignore */
          }

          const aiRequestHandler = onRequestAI
            ? onRequestAI(segment.id)
            : undefined;

          return (
            <div
              key={segment.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <SegmentRow
                segment={segment}
                isActive={segment.id === activeSegmentId}
                onActivate={() => onActivate(segment.id)}
                onTargetChange={(text) => onTargetChange(segment.id, text)}
                registerRef={(el) => registerRef(segment.id, el)}
                highlightTerms={highlightTermsForSegment(segment.id)}
                onRequestAI={aiRequestHandler}
                aiLoading={aiLoading(segment.id)}
                tgtLang={tgtLang}
                comment={comment}
                onNoteClick={() =>
                  onNoteClick(segment.id, segment.position, comment)
                }
                onContextMenu={(e) => onContextMenu(segment.id, e)}
                fontSize={fontSize}
                columnRatio={columnRatio}
                dimmed={focusMode && segment.id !== activeSegmentId}
                reviewMode={reviewMode}
                onReviewAction={
                  reviewMode && onReviewAction
                    ? (action) => onReviewAction(segment.id, action)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Export a helper to scroll to a segment from outside
export function scrollVirtualListToSegment(segmentId: string): void {
  // Find the virtual list container and dispatch a custom event
  const el = document.querySelector("[data-virtual-list]");
  if (el) {
    el.dispatchEvent(
      new CustomEvent("scroll-to-segment", { detail: segmentId }),
    );
  }
}
```

- [ ] **Step 2: Verify the component compiles**

Run: `cd catforcat && npx tsc --noEmit`
Expected: No errors related to VirtualSegmentList.

- [ ] **Step 3: Replace .map() in editor page with VirtualSegmentList**

In `catforcat/src/app/app/projects/[id]/page.tsx`, add the import at the top:

```tsx
import VirtualSegmentList from "@/components/editor/VirtualSegmentList";
```

Then replace the scrollable container div (around lines 1835-1910) that contains `filteredSegments.map(...)` with:

```tsx
          <VirtualSegmentList
            segments={filteredSegments}
            activeSegmentId={activeSegmentId}
            onActivate={(id) => setActiveSegment(id)}
            onTargetChange={(id, text) => {
              trackUndoHistory(id, text);
              updateSegmentTarget(id, text);
            }}
            registerRef={(id, el) => registerRef(id, el)}
            highlightTermsForSegment={(id) =>
              id === activeSegmentId
                ? glossaryTerms.map((t) => t.sourceTerm)
                : allGlossarySourceTerms
            }
            onRequestAI={(id) =>
              id === activeSegmentId && online
                ? requestAISuggestion
                : undefined
            }
            aiLoading={(id) =>
              id === activeSegmentId ? aiLoading : false
            }
            tgtLang={project?.tgtLang || "en"}
            getComment={(_id, metadata) => {
              try {
                const meta = JSON.parse(metadata || "{}");
                return meta.comment || "";
              } catch {
                return "";
              }
            }}
            onNoteClick={(id, position, comment) =>
              setNoteModal({ segmentId: id, position, note: comment })
            }
            onContextMenu={(id, e) =>
              setContextMenu({ x: e.clientX, y: e.clientY, segmentId: id })
            }
            fontSize={editorFontSize}
            columnRatio={columnRatio}
            focusMode={focusMode}
            reviewMode={reviewMode}
            onReviewAction={reviewMode ? handleReviewAction : undefined}
          />
```

Remove the old wrapping `<div style={{ flex: 1, minHeight: 0, overflowY: "auto" ... }}>` and the `filteredSegments.map()` block entirely.

- [ ] **Step 4: Update scrollToSegment calls**

Search the editor page for any `scrollIntoView` calls that scroll to a segment and replace them with the virtualizer scroll. The VirtualSegmentList exposes a custom event. Add this utility function near the top of the editor page:

```tsx
function scrollToSegment(segmentId: string) {
  const el = document.querySelector("[data-virtual-list]");
  if (el) {
    el.dispatchEvent(
      new CustomEvent("scroll-to-segment", { detail: segmentId }),
    );
  }
}
```

And in VirtualSegmentList, add an event listener in a useEffect:

```tsx
// Inside VirtualSegmentList, after the virtualizer is created:
import { useEffect } from "react";

useEffect(() => {
  const el = parentRef.current;
  if (!el) return;
  const handler = (e: Event) => {
    const segId = (e as CustomEvent).detail;
    const idx = segments.findIndex((s) => s.id === segId);
    if (idx >= 0) {
      virtualizer.scrollToIndex(idx, { align: "center" });
    }
  };
  el.addEventListener("scroll-to-segment", handler);
  return () => el.removeEventListener("scroll-to-segment", handler);
}, [segments, virtualizer]);
```

- [ ] **Step 5: Verify build compiles**

Run: `cd catforcat && npx next build`
Expected: Build succeeds.

- [ ] **Step 6: Manual test**

Run: `cd catforcat && npm run dev`
Test: Open a project with segments. Verify:
1. Segments render correctly
2. Scrolling is smooth
3. Clicking a segment activates it
4. Ctrl+Enter confirms and advances
5. Ctrl+Up/Down navigates
6. QA panel "click to navigate" scrolls to the correct segment
7. Search/Replace navigates to matches

- [ ] **Step 7: Commit**

```bash
cd catforcat && git add src/components/editor/VirtualSegmentList.tsx src/app/app/projects/\\[id\\]/page.tsx
git commit -m "feat: virtualize segment list with @tanstack/react-virtual

Replaces filteredSegments.map() with virtualized list that renders only
visible rows. Supports 5000+ segments without DOM performance issues.
Overscan of 10 rows for smooth scrolling. Dynamic height measurement."
```

---

## Task 3: Prisma schema — add 2FA fields + rate limit table

**Files:**
- Modify: `catforcat/prisma/schema.prisma`

- [ ] **Step 1: Add 2FA fields to User model and RateLimit model**

Add these fields to the User model in `catforcat/prisma/schema.prisma`:

```prisma
  // 2FA
  twoFactorSecret   String?  @map("two_factor_secret")
  twoFactorEnabled  Boolean  @default(false) @map("two_factor_enabled")
```

Add this new model at the bottom of the schema:

```prisma
model RateLimit {
  id        String   @id @default(uuid())
  key       String   @unique  // e.g. "translate:<userId>" or "api:<userId>"
  count     Int      @default(0)
  windowStart DateTime @default(now()) @map("window_start")

  @@map("rate_limits")
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd catforcat && npx prisma migrate dev --name add-2fa-and-rate-limits
```

Expected: Migration succeeds, creates new columns and table.

- [ ] **Step 3: Generate Prisma client**

```bash
cd catforcat && npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
cd catforcat && git add prisma/
git commit -m "schema: add 2FA fields to User and RateLimit table for persistent rate limiting"
```

---

## Task 4: 2FA — Backend (enable/verify/disable)

**Files:**
- Create: `catforcat/src/lib/two-factor.ts`
- Create: `catforcat/src/app/api/auth/2fa/setup/route.ts`
- Create: `catforcat/src/app/api/auth/2fa/verify/route.ts`
- Create: `catforcat/src/app/api/auth/2fa/disable/route.ts`
- Modify: `catforcat/src/lib/auth.ts`

- [ ] **Step 1: Create two-factor utility library**

Create file `catforcat/src/lib/two-factor.ts`:

```typescript
import * as OTPAuth from "otpauth";

const ISSUER = "CATforCAT";

/**
 * Generate a new TOTP secret for a user.
 * Returns the secret (base32) and the otpauth:// URI for QR code generation.
 */
export function generateTOTPSecret(userEmail: string): {
  secret: string;
  uri: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

/**
 * Verify a TOTP token against a secret.
 * Allows a window of 1 period (30s) in each direction for clock drift.
 */
export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // delta returns null if invalid, or the time step difference
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}
```

- [ ] **Step 2: Create 2FA setup endpoint**

Create file `catforcat/src/app/api/auth/2fa/setup/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret } from "@/lib/two-factor";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, twoFactorEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA is already enabled" },
      { status: 400 },
    );
  }

  // Generate secret and save (not yet enabled — needs verification)
  const { secret, uri } = generateTOTPSecret(user.email);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret },
  });

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({ qrCode: qrDataUrl, secret });
}
```

- [ ] **Step 3: Create 2FA verify endpoint (completes setup)**

Create file `catforcat/src/app/api/auth/2fa/verify/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/two-factor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { token } = body;

  if (!token || typeof token !== "string" || token.length !== 6) {
    return NextResponse.json(
      { error: "Invalid token format" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { error: "2FA setup not started" },
      { status: 400 },
    );
  }

  const isValid = verifyTOTP(user.twoFactorSecret, token);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // If not yet enabled, this completes setup
  if (!user.twoFactorEnabled) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create 2FA disable endpoint**

Create file `catforcat/src/app/api/auth/2fa/disable/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/two-factor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { token } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  const isValid = verifyTOTP(user.twoFactorSecret, token);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Update auth.ts to check 2FA on login**

In `catforcat/src/lib/auth.ts`, modify the `authorize` function to return a flag when 2FA is required. The login flow will be: (1) user enters email/password, (2) if 2FA is enabled, return a special response that triggers the 2FA code input on the frontend, (3) user enters code, (4) frontend calls verify endpoint, (5) session is established.

Update the `authorize` function:

```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(
    credentials.password,
    user.passwordHash,
  );

  if (!isValid) {
    return null;
  }

  // If 2FA is enabled, require TOTP token
  if (user.twoFactorEnabled) {
    const totpToken = (credentials as Record<string, string>).totpToken;
    if (!totpToken) {
      // Signal frontend that 2FA is needed
      throw new Error("2FA_REQUIRED");
    }

    const { verifyTOTP } = await import("./two-factor");
    if (!user.twoFactorSecret || !verifyTOTP(user.twoFactorSecret, totpToken)) {
      throw new Error("2FA_INVALID");
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
},
```

Also add `totpToken` to the credentials config:

```typescript
credentials: {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
  totpToken: { label: "2FA Code", type: "text" },
},
```

- [ ] **Step 6: Verify build compiles**

Run: `cd catforcat && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd catforcat && git add src/lib/two-factor.ts src/app/api/auth/2fa/ src/lib/auth.ts
git commit -m "feat: add 2FA backend — TOTP setup, verify, disable endpoints

Generates TOTP secret with QR code for authenticator apps.
Login flow checks 2FA when enabled (2FA_REQUIRED error triggers
code input on frontend). Window of ±1 period for clock drift."
```

---

## Task 5: 2FA — Frontend (Settings UI + Login flow)

**Files:**
- Create: `catforcat/src/components/TwoFactorSetup.tsx`
- Modify: `catforcat/src/app/app/settings/page.tsx`
- Modify: `catforcat/src/app/login/page.tsx`

- [ ] **Step 1: Create TwoFactorSetup component**

Create file `catforcat/src/components/TwoFactorSetup.tsx`:

```tsx
"use client";

import { useState } from "react";

type Stage = "idle" | "scanning" | "verifying" | "enabled" | "disabling";

export default function TwoFactorSetup({
  isEnabled,
  onStatusChange,
}: {
  isEnabled: boolean;
  onStatusChange: () => void;
}) {
  const [stage, setStage] = useState<Stage>(isEnabled ? "enabled" : "idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQrCode(data.qrCode);
      setManualSecret(data.secret);
      setStage("scanning");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStage("enabled");
      onStatusChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStage("idle");
      setCode("");
      onStatusChange();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to disable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
        Two-Factor Authentication
      </h3>

      {stage === "idle" && (
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px" }}>
            Add an extra layer of security to your account using an authenticator app
            (Google Authenticator, Authy, 1Password, etc.)
          </p>
          <button
            onClick={startSetup}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent)",
              color: "var(--bg-deep)",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {loading ? "Setting up..." : "Enable 2FA"}
          </button>
        </div>
      )}

      {stage === "scanning" && qrCode && (
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px" }}>
            Scan this QR code with your authenticator app:
          </p>
          <img
            src={qrCode}
            alt="2FA QR Code"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "var(--radius)",
              marginBottom: "12px",
              background: "white",
              padding: "8px",
            }}
          />
          {manualSecret && (
            <p style={{ color: "var(--text-muted)", fontSize: "11px", fontFamily: "monospace", marginBottom: "12px" }}>
              Manual entry: {manualSecret}
            </p>
          )}
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
            Enter the 6-digit code from your app:
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-panel)",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontFamily: "monospace",
                letterSpacing: "4px",
                width: "120px",
                textAlign: "center",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) verifyCode();
              }}
            />
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: code.length === 6 ? "var(--green)" : "var(--btn-bg)",
                color: code.length === 6 ? "white" : "var(--text-muted)",
                border: "none",
                cursor: code.length === 6 ? "pointer" : "default",
                fontSize: "13px",
              }}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
      )}

      {stage === "enabled" && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--green-soft)",
              marginBottom: "12px",
            }}
          >
            <span style={{ color: "var(--green-text)", fontSize: "13px" }}>
              2FA is enabled
            </span>
          </div>
          <button
            onClick={() => setStage("disabling")}
            style={{
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--red-soft)",
              color: "var(--red-text)",
              border: "1px solid var(--red)",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Disable 2FA
          </button>
        </div>
      )}

      {stage === "disabling" && (
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
            Enter your authenticator code to disable 2FA:
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--bg-panel)",
                color: "var(--text-primary)",
                fontSize: "16px",
                fontFamily: "monospace",
                letterSpacing: "4px",
                width: "120px",
                textAlign: "center",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) disable2FA();
              }}
            />
            <button
              onClick={disable2FA}
              disabled={loading || code.length !== 6}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--red)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {loading ? "Disabling..." : "Confirm Disable"}
            </button>
            <button
              onClick={() => { setStage("enabled"); setCode(""); }}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: "var(--btn-bg)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: "var(--red-text)", fontSize: "12px" }}>{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add 2FA section to Settings page**

In `catforcat/src/app/app/settings/page.tsx`, import and add the TwoFactorSetup component in a new "Security" section after the existing plan/usage sections:

```tsx
import TwoFactorSetup from "@/components/TwoFactorSetup";
```

Add to the settings page JSX (after the plan section):

```tsx
{/* Security Section */}
<div style={{
  background: "var(--bg-card)",
  borderRadius: "var(--radius)",
  padding: "24px",
  border: "1px solid var(--border)",
}}>
  <TwoFactorSetup
    isEnabled={settings?.twoFactorEnabled || false}
    onStatusChange={() => fetchSettings()}
  />
</div>
```

Update the settings API (`GET /api/settings`) to include `twoFactorEnabled` in the response.

- [ ] **Step 3: Update login page for 2FA flow**

In `catforcat/src/app/login/page.tsx`, add a state for the 2FA step. When `signIn` returns an error containing "2FA_REQUIRED", show a code input field and retry signIn with the `totpToken` credential:

```tsx
const [needs2FA, setNeeds2FA] = useState(false);
const [totpCode, setTotpCode] = useState("");

// In the signIn handler:
const result = await signIn("credentials", {
  redirect: false,
  email,
  password,
  ...(needs2FA ? { totpToken: totpCode } : {}),
});

if (result?.error) {
  if (result.error.includes("2FA_REQUIRED")) {
    setNeeds2FA(true);
    setError(null);
    return;
  }
  if (result.error.includes("2FA_INVALID")) {
    setError("Invalid 2FA code. Try again.");
    return;
  }
  setError("Invalid email or password");
}
```

Add the 2FA input UI conditionally when `needs2FA` is true:

```tsx
{needs2FA && (
  <div style={{ marginBottom: "16px" }}>
    <label style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
      Enter 2FA code from your authenticator app
    </label>
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      value={totpCode}
      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
      placeholder="000000"
      style={{
        width: "100%",
        padding: "10px",
        marginTop: "6px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        background: "var(--bg-panel)",
        color: "var(--text-primary)",
        fontSize: "18px",
        fontFamily: "monospace",
        letterSpacing: "6px",
        textAlign: "center",
      }}
      autoFocus
    />
  </div>
)}
```

- [ ] **Step 4: Verify build compiles**

Run: `cd catforcat && npx next build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd catforcat && git add src/components/TwoFactorSetup.tsx src/app/app/settings/page.tsx src/app/login/page.tsx
git commit -m "feat: add 2FA frontend — setup with QR code in Settings, code input on Login

Settings page shows 2FA setup with QR code for authenticator apps.
Login flow detects 2FA_REQUIRED and shows code input.
Disable flow requires code verification."
```

---

## Task 6: Persistent rate limiting

**Why:** Current rate limiting is in-memory (a Map in the translate API route). It resets on every server restart. Move to DB-backed rate limits.

**Files:**
- Create: `catforcat/src/lib/rate-limit.ts`
- Modify: `catforcat/src/app/api/translate/route.ts`

- [ ] **Step 1: Create rate-limit utility**

Create file `catforcat/src/lib/rate-limit.ts`:

```typescript
import { prisma } from "./prisma";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and increment a rate limit counter.
 * Uses a sliding window stored in the rate_limits table.
 *
 * @param key - Unique key, e.g. "translate:userId"
 * @param limit - Max requests per window
 * @param windowMs - Window duration in milliseconds (default: 60_000 = 1 minute)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const now = new Date();

  // Upsert the rate limit record
  const record = await prisma.rateLimit.upsert({
    where: { key },
    create: {
      key,
      count: 0,
      windowStart: now,
    },
    update: {},
  });

  const windowStart = new Date(record.windowStart);
  const windowEnd = new Date(windowStart.getTime() + windowMs);

  // If the window has expired, reset
  if (now >= windowEnd) {
    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, windowStart: now },
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }

  // Window still active — check count
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
    };
  }

  // Increment
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: limit - updated.count,
    resetAt: windowEnd,
  };
}
```

- [ ] **Step 2: Replace in-memory rate limit in translate route**

In `catforcat/src/app/api/translate/route.ts`, remove the in-memory Map-based rate limiting code and replace with:

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

// Inside the POST handler, replace the rate limit check with:
const rateKey = `translate:${session.user.id}`;
const rateLimit = await checkRateLimit(rateKey, 30, 60_000); // 30 per minute

if (!rateLimit.allowed) {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      retryAfter: Math.ceil(
        (rateLimit.resetAt.getTime() - Date.now()) / 1000,
      ),
    },
    { status: 429 },
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd catforcat && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd catforcat && git add src/lib/rate-limit.ts src/app/api/translate/route.ts
git commit -m "feat: persist rate limiting to DB instead of in-memory

Rate limits now survive server restarts. Uses rate_limits table
with sliding window. Reusable checkRateLimit() function for any
future API route that needs rate limiting."
```

---

## Task 7: Add CSP and remaining security headers

**Files:**
- Modify: `catforcat/next.config.ts`

- [ ] **Step 1: Add Content-Security-Policy and Strict-Transport-Security**

Update the headers in `catforcat/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["dexie"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://api.stripe.com https://*.deepl.com https://translation.googleapis.com",
              "frame-src https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify build and headers**

Run: `cd catforcat && npx next build`
Expected: Build succeeds.

Then run: `cd catforcat && npm run dev`
Test: Open DevTools → Network → check response headers for any page. Verify CSP, HSTS, and other headers are present.

- [ ] **Step 3: Commit**

```bash
cd catforcat && git add next.config.ts
git commit -m "security: add CSP, HSTS, DNS prefetch headers

CSP restricts scripts to self + Stripe, styles to self + Google Fonts,
connections to self + Stripe + DeepL + Google Translate.
HSTS enforces HTTPS for 1 year with subdomains."
```

---

## Task 8: Final verification

- [ ] **Step 1: Full build check**

```bash
cd catforcat && npx next build
```

Expected: Build succeeds with zero errors.

- [ ] **Step 2: TypeScript strict check**

```bash
cd catforcat && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Manual testing checklist**

Run: `cd catforcat && npm run dev`

Test the following:

```
VIRTUALIZATION:
[ ] Open a project with 50+ segments
[ ] Scroll up and down — smooth, no jank
[ ] Click a segment — it becomes active
[ ] Ctrl+Enter confirms and advances to next
[ ] Ctrl+Up/Down navigates between segments
[ ] QA panel click navigates to correct segment
[ ] Search/Replace finds and navigates to matches
[ ] Go To Segment (Ctrl+G) scrolls correctly
[ ] Filter (empty/draft/confirmed) works with virtual list

2FA:
[ ] Settings page shows "Enable 2FA" button
[ ] Clicking shows QR code
[ ] Scanning with authenticator app and entering code enables 2FA
[ ] Logging out and back in shows 2FA code input
[ ] Entering correct code logs in
[ ] Entering wrong code shows error
[ ] Disabling 2FA works from Settings

RATE LIMITING:
[ ] Translate button works normally
[ ] Rapid clicking (30+ times in a minute) returns 429 error
[ ] After a minute, rate limit resets

SECURITY HEADERS:
[ ] DevTools shows CSP, HSTS, X-Frame-Options headers
[ ] App still loads correctly (no CSP violations in console)
[ ] Stripe checkout still works (allowed in CSP)
```

- [ ] **Step 4: Commit any fixes from testing**

```bash
cd catforcat && git add -A
git commit -m "fix: address issues found during Fase 15 manual testing"
```

---

## Summary

```
TASK    WHAT                           FILES CREATED/MODIFIED
--------------------------------------------------------------
1       Install dependencies           package.json
2       Virtualize segment list        VirtualSegmentList.tsx, page.tsx
3       Prisma schema (2FA + rates)    schema.prisma, migration
4       2FA backend                    two-factor.ts, 3 API routes, auth.ts
5       2FA frontend                   TwoFactorSetup.tsx, settings, login
6       Persistent rate limiting       rate-limit.ts, translate/route.ts
7       CSP + security headers         next.config.ts
8       Final verification             Manual testing + fixes
```
