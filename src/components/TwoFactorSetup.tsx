"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

type Stage = "idle" | "scanning" | "enabled" | "disabling";

interface Props {
  isEnabled: boolean;
  onStatusChange: () => void;
}

export default function TwoFactorSetup({ isEnabled, onStatusChange }: Props) {
  const [stage, setStage] = useState<Stage>(isEnabled ? "enabled" : "idle");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const codeInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm)",
    fontSize: 22,
    fontFamily: "'Courier New', Courier, monospace",
    fontWeight: 600,
    letterSpacing: "0.35em",
    textAlign: "center",
    background: "var(--bg-deep)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 150ms",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "8px 18px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    fontWeight: 500,
    background: "var(--btn-bg)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 150ms",
  };

  const btnDanger: React.CSSProperties = {
    padding: "8px 18px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    fontWeight: 500,
    background: "var(--red-soft)",
    border: "1px solid var(--red)",
    color: "var(--red-text)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 150ms",
  };

  const btnGhost: React.CSSProperties = {
    padding: "8px 18px",
    borderRadius: "var(--radius-sm)",
    fontSize: 13,
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 150ms",
  };

  const handleStartSetup = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start 2FA setup");
        return;
      }
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setToken("");
      setStage("scanning");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (token.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code. Try again.");
        setLoading(false);
        return;
      }
      setToken("");
      setStage("enabled");
      onStatusChange();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [token, onStatusChange]);

  const handleDisableConfirm = useCallback(async () => {
    if (token.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid code. Try again.");
        setLoading(false);
        return;
      }
      setToken("");
      setStage("idle");
      onStatusChange();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [token, onStatusChange]);

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (stage === "scanning") handleVerify();
      else if (stage === "disabling") handleDisableConfirm();
    }
  };

  if (stage === "idle") {
    return (
      <div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
          Two-factor authentication adds an extra layer of security to your account.
          After enabling, you&apos;ll need to enter a code from your authenticator app when signing in.
        </p>
        <button
          onClick={handleStartSetup}
          disabled={loading}
          style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Loading..." : "Enable 2FA"}
        </button>
      </div>
    );
  }

  if (stage === "scanning") {
    return (
      <div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.),
          then enter the 6-digit code to confirm.
        </p>

        {qrCode && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
            <div
              style={{
                padding: 8,
                background: "#fff",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                display: "inline-block",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="2FA QR Code"
                width={160}
                height={160}
                style={{ display: "block" }}
              />
            </div>
          </div>
        )}

        {secret && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
              Can&apos;t scan? Enter this code manually in your authenticator app:
            </p>
            <div
              style={{
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-deep)",
                border: "1px solid var(--border)",
                fontSize: 12,
                fontFamily: "'Courier New', Courier, monospace",
                letterSpacing: "0.15em",
                color: "var(--text-primary)",
                wordBreak: "break-all",
                userSelect: "all",
              }}
            >
              {secret}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
            Verification code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setToken(v);
              setError("");
            }}
            onKeyDown={handleCodeKeyDown}
            placeholder="000000"
            style={codeInputStyle}
            autoFocus
            autoComplete="one-time-code"
          />
        </div>

        {error && (
          <div style={{ marginBottom: 10, fontSize: 12, color: "var(--red)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleVerify}
            disabled={loading || token.length !== 6}
            style={{ ...btnPrimary, opacity: loading || token.length !== 6 ? 0.5 : 1 }}
          >
            {loading ? "Verifying..." : "Confirm & Enable"}
          </button>
          <button
            onClick={() => { setStage("idle"); setError(""); setToken(""); }}
            style={btnGhost}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (stage === "enabled") {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 20,
              background: "var(--green-soft)",
              border: "1px solid var(--green)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--green-text)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            2FA is enabled
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
          Your account is protected with two-factor authentication.
        </p>
        <button
          onClick={() => { setStage("disabling"); setToken(""); setError(""); }}
          style={btnDanger}
        >
          Disable 2FA
        </button>
      </div>
    );
  }

  // disabling
  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
        Enter the 6-digit code from your authenticator app to disable two-factor authentication.
      </p>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
          Verification code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={token}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
            setToken(v);
            setError("");
          }}
          onKeyDown={handleCodeKeyDown}
          placeholder="000000"
          style={codeInputStyle}
          autoFocus
          autoComplete="one-time-code"
        />
      </div>

      {error && (
        <div style={{ marginBottom: 10, fontSize: 12, color: "var(--red)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleDisableConfirm}
          disabled={loading || token.length !== 6}
          style={{ ...btnDanger, opacity: loading || token.length !== 6 ? 0.5 : 1 }}
        >
          {loading ? "Disabling..." : "Confirm Disable"}
        </button>
        <button
          onClick={() => { setStage("enabled"); setError(""); setToken(""); }}
          style={btnGhost}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
