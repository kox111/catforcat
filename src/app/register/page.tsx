"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import PageTransition from "@/components/PageTransition";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Registered but could not sign in. Please try logging in.");
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
            Create your account
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
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  marginBottom: 4,
                  color: "var(--text-muted)",
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                placeholder="Your name"
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
                Username
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    fontSize: 15,
                    pointerEvents: "none",
                  }}
                >
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
                    setUsername(val);
                    if (val.length > 0 && val.length < 3) {
                      setUsernameError("Min. 3 characters");
                    } else if (val.length > 20) {
                      setUsernameError("Max. 20 characters");
                    } else {
                      setUsernameError("");
                    }
                  }}
                  required
                  minLength={3}
                  maxLength={20}
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  placeholder="your.alias"
                />
              </div>
              {usernameError && (
                <p style={{ fontSize: 11, color: "var(--red)", marginTop: 2 }}>
                  {usernameError}
                </p>
              )}
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
                  minLength={6}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="Min. 6 characters"
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
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 0",
                borderRadius: "var(--radius-sm)",
                fontSize: 15,
                fontWeight: 600,
                background: submitHover
                  ? "var(--cta-bg-gradient-hover)"
                  : "var(--cta-bg-gradient)",
                color: "var(--cta-text)",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 200ms ease",
                fontFamily: "var(--font-ui-family)",
                boxShadow: submitHover
                  ? "var(--cta-shadow-hover)"
                  : "var(--cta-shadow)",
                transform: submitHover ? "translateY(-1px)" : "translateY(0)",
              }}
              onMouseEnter={() => !loading && setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Free plan. No credit card required.
            </p>
          </form>

          {/* OAuth divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "20px 0",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-ui-family)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* OAuth buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/app/projects" })}
              style={{
                width: "100%",
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: "1.5px solid var(--border)",
                background: "var(--bg-deep)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-ui-family)",
                fontSize: 14,
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-deep)")}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => signIn("apple", { callbackUrl: "/app/projects" })}
              style={{
                width: "100%",
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: "1.5px solid var(--border)",
                background: "var(--bg-deep)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-ui-family)",
                fontSize: 14,
                color: "var(--text-primary)",
                cursor: "pointer",
                transition: "background 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-deep)")}
            >
              <svg width="16" height="20" viewBox="0 0 17 21" fill="currentColor">
                <path d="M8.29 5.07c.9 0 2.03-.61 2.7-1.42.6-.73 1.04-1.75 1.04-2.76 0-.14-.01-.28-.04-.39-.99.04-2.18.66-2.9 1.5-.56.64-1.08 1.65-1.08 2.67 0 .15.03.3.04.35.07.01.18.04.24.04zM5.8 21c1.23 0 1.77-.82 3.31-.82 1.56 0 1.9.8 3.27.8 1.35 0 2.26-1.25 3.12-2.47.97-1.4 1.37-2.76 1.4-2.83-.09-.03-2.72-1.1-2.72-4.1 0-2.6 2.08-3.76 2.18-3.85-1.35-1.95-3.42-2-4.01-2-.55-.04-1.08.12-1.52.26-.33.1-.62.2-.86.2-.27 0-.57-.1-.91-.21-.43-.14-.91-.29-1.45-.29-2.44 0-4.91 2.01-4.91 5.81 0 2.36.92 4.86 2.06 6.48C5.62 19.41 5.18 21 5.8 21z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <p
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 14,
              color: "var(--text-secondary)",
            }}
          >
            Already have an account?{" "}
            <Link
              href="/login"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
