"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/pixel/Wordmark";
import { PixSpinner } from "@/components/pixel/PixSpinner";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const t = useTranslations("login");
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
          {t("intro")}
        </p>

        {status === "sent" ? (
          <div className="frame frame--flat" style={{ padding: "16px", background: "var(--basalt)" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--sand-light)", textAlign: "center", lineHeight: 1.6 }}>
              {t.rich("sentTitle", {
                email,
                em: (chunks) => <strong style={{ color: "var(--gold)" }}>{chunks}</strong>,
              })}
            </p>
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
