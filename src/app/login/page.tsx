"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import PageTransition from "@/components/PageTransition";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

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
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    fontSize: 15,
    outline: "none",
    background: "var(--bg-deep)",
    border: "1.5px solid var(--border)",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    transition: "border-color 150ms, box-shadow 150ms",
    boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
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
            maxWidth: 420,
            padding: 40,
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display-family)",
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
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ ...inputStyle, paddingRight: 44 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                padding: "14px 0",
                borderRadius: 9999,
                fontSize: 15,
                fontWeight: 600,
                background: submitHover
                  ? "var(--cta-bg-gradient-hover)"
                  : "var(--cta-bg-gradient)",
                color: "var(--cta-text)",
                border: "none",
                cursor: loading || (needs2FA && totpCode.length !== 6) ? "not-allowed" : "pointer",
                opacity: loading || (needs2FA && totpCode.length !== 6) ? 0.6 : 1,
                transition: "all 200ms ease",
                fontFamily: "var(--font-ui-family)",
                boxShadow: submitHover
                  ? "var(--cta-shadow-hover)"
                  : "var(--cta-shadow)",
                transform: submitHover ? "translateY(-1px)" : "translateY(0)",
              }}
              onMouseEnter={() => {
                if (!loading && !(needs2FA && totpCode.length !== 6)) setSubmitHover(true);
              }}
              onMouseLeave={() => setSubmitHover(false)}
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
                  fontFamily: "var(--font-ui-family)",
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
