"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixSpinner } from "@/components/pixel/PixSpinner";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });

    if (otpError) {
      setStatus("error");
      setError(otpError.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="screen bg-dune vignette" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(28,21,14,.55)" }} />
      <div className="frame frame--basalt" style={{ position: "relative", width: "min(440px,92vw)", padding: "34px 30px" }}>
        <div className="center-col" style={{ marginBottom: 8 }}>
          <Wordmark size={34} light />
        </div>
        <div className="fret" style={{ margin: "14px 0 22px" }} />
        <p style={{ fontFamily: "var(--font-body)", fontSize: 16, color: "var(--sand-light)", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
          Sign the register, archivist. A sealed link will be sent to your name.
        </p>

        {status === "sent" ? (
          <div className="frame frame--flat" style={{ padding: "16px", background: "var(--basalt)" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--sand-light)", textAlign: "center", lineHeight: 1.6 }}>
              A sign-in link is on its way to <strong style={{ color: "var(--gold)" }}>{email}</strong>. Follow it to enter the archive.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="col gap-3">
            <label className="label" htmlFor="email">Your email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="archivist@example.com"
              className="field field--dark"
              autoFocus
            />
            {status === "sending" ? (
              <div className="frame frame--flat" style={{ padding: "14px", display: "grid", placeItems: "center", background: "var(--basalt)", marginTop: 8 }}>
                <PixSpinner label="sealing your link…" />
              </div>
            ) : (
              <button type="submit" className="btn btn--block btn--lg" style={{ marginTop: 8 }} disabled={!email.trim()}>
                Send the sealed link
              </button>
            )}
            {error && <p className="hint hint--err">{error}</p>}
          </form>
        )}
        <p className="caption" style={{ textAlign: "center", marginTop: 16 }}>No password. The desert keeps your secrets.</p>
      </div>
    </div>
  );
}
