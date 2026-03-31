import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — catforcat",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p
          style={{
            fontFamily: "var(--font-ui-family)",
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 48,
          }}
        >
          Last updated: March 31, 2026
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            fontFamily: "var(--font-ui-family)",
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--text-secondary)",
          }}
        >
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              What we collect
            </h2>
            <p>
              When you create an account, we store your email address, name, and a hashed version of your password.
              We never store your password in plain text. If you enable Two-Factor Authentication, we store
              an encrypted TOTP secret.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Your translation data
            </h2>
            <p>
              Your projects, segments, translation memories, and glossaries are stored on our servers to provide
              the service. We do not read, analyze, sell, or share your translation content with any third party.
              Your work is yours.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              AI-powered features
            </h2>
            <p>
              When you use Pre-translate or Smart Review, your source segments are sent to third-party AI providers
              (Google, DeepL) to generate translations. These providers process the text according to their own
              privacy policies. We do not use your content to train any AI models.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Payments
            </h2>
            <p>
              Payments are processed by Stripe. We never see or store your full credit card number. Stripe
              handles all payment data according to PCI DSS standards.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Cookies
            </h2>
            <p>
              We use a single session cookie to keep you logged in. We do not use tracking cookies,
              analytics cookies, or any third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Data deletion
            </h2>
            <p>
              You can delete your account and all associated data at any time from Settings. Once deleted,
              your data is permanently removed from our servers within 30 days.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Contact
            </h2>
            <p>
              If you have questions about this policy, contact us at{" "}
              <span style={{ color: "var(--accent)" }}>hello@catforcat.app</span>.
            </p>
          </section>
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
