"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { isCompleteOtp, normalizeOtp, OTP_LENGTH } from "@/lib/auth/otp";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixSpinner } from "@/components/pixel/PixSpinner";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

type Status = "idle" | "sending" | "sent" | "verifying" | "error";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const awaitingCode = status === "sent" || status === "verifying";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    // No emailRedirectTo: that makes Supabase issue a pure 6-digit OTP rather
    // than a magic link. A link would share the same token and get consumed by
    // inbox prefetchers, invalidating the code the user types.
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });

    if (otpError) {
      setStatus("error");
      setError(otpError.message);
    } else {
      setStatus("sent");
    }
  }

  async function onVerify(event: React.FormEvent) {
    event.preventDefault();
    setStatus("verifying");
    setError(null);

    const supabase = createClient();
    // A returning user's code is an "email" (sign-in) OTP; a brand-new user's code
    // is a "signup" confirmation token. They're indistinguishable client-side, and
    // a type-mismatch verify doesn't consume the other token, so we try both.
    let { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (verifyError) {
      ({ error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" }));
    }

    if (verifyError) {
      setStatus("sent");
      setError(verifyError.message || t("codeError"));
    } else {
      window.location.assign("/stories");
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
          {t("intro")}
        </p>

        {awaitingCode ? (
          <div className="col gap-3">
            <div className="frame frame--flat" style={{ padding: "16px", background: "var(--basalt)" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--sand-light)", textAlign: "center", lineHeight: 1.6 }}>
                {t.rich("sentTitle", {
                  email,
                  em: (chunks) => <strong style={{ color: "var(--gold)" }}>{chunks}</strong>,
                })}
              </p>
            </div>
            <form onSubmit={onVerify} className="col gap-3">
              <label className="label" htmlFor="code">{t("codeLabel")}</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                value={code}
                onChange={(e) => setCode(normalizeOtp(e.target.value))}
                placeholder={t("codePlaceholder")}
                className="field field--dark"
                style={{ textAlign: "center", letterSpacing: "0.4em", fontFamily: "var(--font-mono)" }}
                autoFocus
              />
              {status === "verifying" ? (
                <div className="frame frame--flat" style={{ padding: "14px", display: "grid", placeItems: "center", background: "var(--basalt)", marginTop: 8 }}>
                  <PixSpinner label={t("verifying")} />
                </div>
              ) : (
                <button type="submit" className="btn btn--block btn--lg" style={{ marginTop: 8 }} disabled={!isCompleteOtp(code)}>
                  {t("verify")}
                </button>
              )}
              {error && <p className="hint hint--err">{error}</p>}
            </form>
            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={() => {
                setStatus("idle");
                setCode("");
                setError(null);
              }}
            >
              {t("resend")}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="col gap-3">
            <label className="label" htmlFor="email">{t("emailLabel")}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="field field--dark"
              autoFocus
            />
            {status === "sending" ? (
              <div className="frame frame--flat" style={{ padding: "14px", display: "grid", placeItems: "center", background: "var(--basalt)", marginTop: 8 }}>
                <PixSpinner label={t("sending")} />
              </div>
            ) : (
              <button type="submit" className="btn btn--block btn--lg" style={{ marginTop: 8 }} disabled={!email.trim()}>
                {t("submit")}
              </button>
            )}
            {error && <p className="hint hint--err">{error}</p>}
          </form>
        )}
        <p className="caption" style={{ textAlign: "center", marginTop: 16 }}>{t("caption")}</p>
        <div className="center-col" style={{ marginTop: 18 }}>
          <LocaleSwitcher />
        </div>
      </div>
    </div>
  );
}
