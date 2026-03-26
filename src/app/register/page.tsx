"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
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
                minLength={6}
                style={inputStyle}
                placeholder="Min. 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: "var(--btn-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--btn-border)",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "background 150ms",
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
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
