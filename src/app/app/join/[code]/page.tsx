"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, Check, AlertCircle } from "lucide-react";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const join = async () => {
      try {
        const res = await fetch("/api/classrooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "You have joined the classroom!");
          setTimeout(() => {
            router.push(`/app/classrooms/${data.classroomId}`);
          }, 1500);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to join");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong");
      }
    };
    join();
  }, [code, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: 24,
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: 40,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          maxWidth: 400,
          width: "100%",
        }}
      >
        {status === "loading" && (
          <>
            <GraduationCap size={36} style={{ color: "var(--accent)", marginBottom: 12 }} />
            <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Joining classroom...</p>
          </>
        )}
        {status === "success" && (
          <>
            <Check size={36} style={{ color: "var(--green)", marginBottom: 12 }} />
            <p style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 500 }}>{message}</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle size={36} style={{ color: "var(--red)", marginBottom: 12 }} />
            <p style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 500 }}>{message}</p>
            <button
              onClick={() => router.push("/app/classrooms")}
              style={{
                marginTop: 16,
                padding: "10px 24px",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: 600,
                background: "var(--btn-secondary-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--btn-secondary-border)",
                cursor: "pointer",
                fontFamily: "var(--font-ui-family)",
              }}
            >
              Go to Classrooms
            </button>
          </>
        )}
      </div>
    </div>
  );
}
