"use client";

import Link from "next/link";

/**
 * Inline SVG cat — from visuals/catforcat_cat.svg.
 * Uses fill: currentColor with color: var(--text-primary)
 * so the cat adapts to every theme automatically.
 */
function CatLogo({ className }: { className?: string }) {
  return (
    <svg
      suppressHydrationWarning
      viewBox="0 0 300 409"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "block",
        margin: "0 auto",
        color: "var(--text-primary)",
      }}
    >
      <g
        transform="translate(0.000000,409.000000) scale(0.100000,-0.100000)"
        fill="currentColor"
        stroke="none"
      >
        <path d="M2346 3957 c-23 -23 -68 -94 -101 -157 l-61 -115 -129 -5 c-72 -3 -136 -9 -143 -14 -16 -9 -44 8 -131 82 -144 122 -231 160 -250 108 -11 -28 -2 -74 44 -218 44 -136 44 -152 -7 -254 -36 -74 -41 -93 -41 -152 0 -86 27 -231 52 -280 28 -56 123 -138 182 -159 27 -10 49 -20 48 -23 -1 -11 -166 -126 -223 -156 -34 -18 -117 -53 -186 -79 -212 -81 -337 -151 -459 -260 -333 -297 -505 -768 -462 -1262 19 -212 11 -228 -154 -318 -250 -137 -306 -322 -142 -472 164 -151 383 -162 917 -45 399 88 547 80 658 -35 48 -50 59 -33 17 29 -52 77 -202 125 -360 114 -85 -5 -134 -14 -471 -85 -386 -82 -626 -57 -744 77 -111 125 -59 258 145 368 196 106 202 118 188 373 -9 169 -5 321 12 406 91 458 319 791 661 967 49 26 141 67 205 91 159 62 229 99 302 160 122 103 148 114 277 118 216 6 451 142 426 245 -16 63 -76 49 -204 -49 -202 -151 -354 -178 -489 -87 -84 56 -102 90 -130 233 -22 115 -22 125 -8 181 57 222 239 346 506 346 129 0 117 -9 199 147 86 162 108 184 144 144 49 -54 117 -316 102 -395 l-7 -37 -44 40 c-63 58 -107 78 -140 63 -14 -6 -25 -19 -25 -27 0 -68 151 -191 198 -161 32 20 88 -185 101 -369 6 -93 18 -172 36 -235 131 -479 124 -554 -91 -982 -120 -238 -137 -302 -196 -718 -49 -350 -29 -436 105 -465 58 -12 96 -80 68 -123 -6 -10 -10 -6 -15 15 -9 35 -44 73 -68 73 -24 0 -23 -12 2 -35 37 -34 23 -69 -29 -75 -25 -3 -46 -11 -49 -17 -5 -18 47 -36 83 -29 17 4 37 7 45 7 116 5 122 168 8 218 -24 10 -56 23 -73 28 -59 17 -63 71 -26 365 55 434 68 481 211 773 190 384 207 524 110 860 -56 192 -60 213 -75 413 -8 99 -35 203 -74 281 -24 47 -27 60 -18 76 52 88 -33 433 -126 511 -39 33 -54 30 -101 -19z m-709 -158 c51 -35 187 -147 190 -157 2 -4 -16 -16 -39 -27 -23 -11 -66 -42 -95 -69 l-53 -48 0 33 c0 36 -6 59 -38 174 -41 143 -40 145 35 94z m811 -297 c18 -14 37 -33 43 -44 19 -35 -29 -20 -76 25 -75 72 -53 84 33 19z m-71 -508 c19 -57 -164 -166 -317 -189 -44 -7 -44 -7 33 33 44 23 98 57 121 75 93 77 154 107 163 81z" />
        <path d="M2305 1992 c-97 -60 -198 -238 -242 -427 -27 -118 -24 -386 6 -555 54 -303 95 -403 177 -430 58 -19 103 -121 65 -145 -5 -3 -9 7 -9 23 1 35 -16 68 -42 82 -33 18 -41 2 -18 -35 25 -44 18 -85 -15 -85 -17 0 -22 6 -23 26 -2 31 -40 74 -66 74 -23 0 -23 -6 1 -36 29 -37 17 -64 -29 -64 -81 0 -123 66 -186 287 -24 87 -49 169 -54 183 -25 68 -182 478 -190 497 -6 15 -3 36 12 75 56 139 11 478 -63 478 -65 0 -76 -223 -23 -463 17 -76 17 -79 -2 -98 -19 -19 -20 -19 -57 31 -156 209 -479 239 -641 60 -74 -82 -41 -106 88 -62 153 52 219 41 411 -73 50 -30 68 -35 108 -33 l47 3 21 -55 c65 -169 20 -377 -109 -512 -89 -93 -106 -101 -236 -104 -145 -3 -206 -27 -206 -80 0 -70 131 -67 280 5 60 29 66 30 234 33 l172 3 36 -27 c39 -29 56 -75 40 -104 -8 -14 -13 -9 -33 27 -25 45 -79 82 -105 72 -22 -8 -16 -32 10 -44 30 -14 50 -54 33 -67 -7 -6 -165 -6 -407 -2 -468 10 -529 19 -600 95 -34 37 -35 110 -1 155 29 40 14 65 -20 34 -78 -71 -62 -204 33 -262 93 -57 211 -70 655 -74 l352 -3 24 23 c16 15 27 20 32 13 23 -38 80 12 79 69 -2 54 -37 98 -102 128 -56 25 -92 27 -267 8 l-40 -5 70 73 c149 153 198 378 122 564 -23 57 -23 62 -8 76 21 20 172 -364 250 -636 82 -284 128 -338 286 -336 62 0 101 5 113 14 9 7 27 14 39 14 31 0 63 46 63 90 0 51 -35 100 -94 130 -59 31 -79 64 -112 193 -127 487 -81 915 120 1105 86 82 133 69 123 -36 -7 -76 -39 -145 -132 -282 -136 -200 -160 -279 -144 -460 15 -167 93 -480 120 -480 12 0 13 -8 -17 116 -66 280 -80 469 -45 583 12 39 53 111 114 203 132 199 166 287 147 374 -16 70 -81 95 -145 56z m-649 -173 c23 -84 29 -207 14 -285 -12 -63 -14 -66 -22 -39 -20 75 -39 215 -37 278 4 132 18 146 45 46z m-293 -317 c46 -23 83 -52 122 -95 l57 -62 -37 -3 c-26 -2 -50 5 -88 28 -188 112 -298 133 -426 82 -69 -27 -72 -24 -16 17 113 81 264 94 388 33z m-153 -932 c-59 -20 -130 -26 -130 -11 0 17 53 29 120 29 l65 0 -55 -18z" />
      </g>
    </svg>
  );
}

export default function LandingPage() {

  return (
    <>
      {/* Responsive sizes via CSS classes — 3 breakpoints */}
      <style>{`
        .landing-nav { height: 80px; padding: 0 48px; }
        .landing-wordmark { font-size: 24px; }
        .landing-login { font-size: 18px; }
        .landing-login-btn { font-size: 15px; padding: 8px 20px; }
        .landing-cat { width: 240px; }
        .landing-cat-spacer { height: 40px; }
        .landing-headline { font-size: 56px; margin-bottom: 16px; }
        .landing-meow { font-size: 24px; margin-bottom: 40px; }
        .landing-cta { font-size: 20px; padding: 18px 52px; }
        .landing-hero { padding: 0 40px 60px; min-height: calc(100vh - 80px - 60px); }

        @media (max-width: 1600px) {
          .landing-nav { height: 70px; }
          .landing-wordmark { font-size: 20px; }
          .landing-login { font-size: 15px; }
          .landing-login-btn { font-size: 14px; padding: 7px 18px; }
          .landing-cat { width: 180px; }
          .landing-cat-spacer { height: 32px; }
          .landing-headline { font-size: 44px; margin-bottom: 12px; }
          .landing-meow { font-size: 18px; margin-bottom: 32px; }
          .landing-cta { font-size: 16px; padding: 14px 40px; }
          .landing-hero { min-height: calc(100vh - 70px - 60px); }
        }

        @media (max-width: 1024px) {
          .landing-nav { height: 60px; padding: 0 20px; }
          .landing-wordmark { font-size: 17px; }
          .landing-login { font-size: 13px; }
          .landing-login-btn { font-size: 13px; padding: 6px 16px; }
          .landing-cat { width: 120px; }
          .landing-cat-spacer { height: 20px; }
          .landing-headline { font-size: 32px; margin-bottom: 8px; }
          .landing-meow { font-size: 14px; margin-bottom: 24px; }
          .landing-cta { font-size: 14px; padding: 10px 28px; }
          .landing-hero { padding: 0 20px 48px; min-height: calc(100vh - 60px - 60px); }
        }
      `}</style>

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
          className="landing-nav"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Link
            href="/"
            className="landing-wordmark"
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 400,
              color: "var(--brand-wordmark)",
              letterSpacing: "0.03em",
              textDecoration: "none",
              cursor: "pointer",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            catforcat.
          </Link>

          <Link
            href="/login"
            className="landing-login-btn"
            style={{
              fontFamily: "var(--font-ui-family)",
              fontWeight: 500,
              color: "var(--text-primary)",
              textDecoration: "none",
              borderRadius: 9999,
              border: "1px solid var(--border)",
              background: "transparent",
            }}
          >
            Log in
          </Link>
        </nav>

        {/* Hero — vertically centered */}
        <main
          className="landing-hero"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <CatLogo className="landing-cat" />

          <div className="landing-cat-spacer" />

          <h1
            className="landing-headline"
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 400,
              color: "var(--text-primary)",
              letterSpacing: "0.01em",
            }}
          >
            A cat tool, provided by a cat
          </h1>

          <p
            className="landing-meow"
            style={{
              fontFamily: "var(--font-display-family)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--text-secondary)",
            }}
          >
            meow
          </p>

          <Link
            href="/register"
            className="landing-cta"
            style={{
              fontFamily: "var(--font-ui-family)",
              fontWeight: 500,
              color: "var(--cta-text)",
              background: "var(--cta-bg)",
              borderRadius: 9999,
              textDecoration: "none",
              cursor: "pointer",
              display: "inline-block",
              boxShadow: "var(--cta-shadow)",
              border: "1px solid var(--btn-primary-border)",
              transition: "all 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          >
            Start translating — free
          </Link>
        </main>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
            gap: 8,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display-family)",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
              textDecoration: "none",
              transition: "opacity 150ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            catforcat.
          </Link>
          <span
            style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.5 }}
          >
            ·
          </span>
          <button
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
          >
            FAQ
          </button>
          <span
            style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.5 }}
          >
            ·
          </span>
          <button
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
          >
            Privacy
          </button>
          <span
            style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.5 }}
          >
            ·
          </span>
          <Link
            href="/changelog"
            style={{
              fontFamily: "var(--font-ui-family)",
              fontSize: 12,
              fontWeight: 400,
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
          >
            Changelog
          </Link>
        </footer>
      </div>
    </>
  );
}
