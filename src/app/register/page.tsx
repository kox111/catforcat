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
