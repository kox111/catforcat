"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credentials: Record<string, string> = {
        email,
        password,
        redirect: "false",
      };
      if (needs2FA) {
        credentials.totpToken = totpCode;
      }

      const result = await signIn("credentials", {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("2FA_REQUIRED")) {
          setNeeds2FA(true);
          setError("");
        } else if (result.error.includes("2FA_INVALID")) {
          setError("Invalid 2FA code. Please try again.");
        } else {
          setError("Invalid email or password");
        }
      } else {
        router.push("/app/projects");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 14,
    outline: "none",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    fontFamily: "inherit",
  };

  return (
    <PageTransition>
      <div
        suppressHydrationWarning
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-deep)",
        }}
      >
        <div
          suppressHydrationWarning
          style={{
            width: "100%",
            maxWidth: 448,
            padding: 32,
            borderRadius: "var(--radius)",
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
          }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: "0.03em",
              color: "var(--brand-wordmark)",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            catforcat.
          </h1>
          <p
            style={{
              textAlign: "center",
              marginBottom: 24,
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            Sign in to your account
          </p>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 6,
                fontSize: 14,
                background: "var(--red-soft)",
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!needs2FA && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      color: "var(--text-muted)",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                    placeholder="you@example.com"
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      color: "var(--text-muted)",
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            {needs2FA && (
              <div style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    marginBottom: 14,
                    textAlign: "center",
                  }}
                >
                  Enter the 6-digit code from your authenticator app.
                </p>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    marginBottom: 6,
                    color: "var(--text-muted)",
                  }}
                >
                  Authentication code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setTotpCode(v);
                    setError("");
                  }}
                  placeholder="000000"
                  autoFocus
                  autoComplete="one-time-code"
                  style={{
                    ...inputStyle,
                    fontSize: 22,
                    fontFamily: "'Courier New', Courier, monospace",
                    fontWeight: 600,
                    letterSpacing: "0.35em",
                    textAlign: "center",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (needs2FA && totpCode.length !== 6)}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: "var(--btn-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--btn-border)",
                cursor: loading || (needs2FA && totpCode.length !== 6) ? "not-allowed" : "pointer",
                opacity: loading || (needs2FA && totpCode.length !== 6) ? 0.6 : 1,
                transition: "background 150ms",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {loading ? "Signing in..." : needs2FA ? "Verify & Sign In" : "Sign In"}
            </button>

            {needs2FA && (
              <button
                type="button"
                onClick={() => {
                  setNeeds2FA(false);
                  setTotpCode("");
                  setError("");
                }}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "8px 0",
                  borderRadius: 8,
                  fontSize: 12,
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                Back to login
              </button>
            )}
          </form>

          <p
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
