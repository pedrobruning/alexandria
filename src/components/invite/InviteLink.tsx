"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PixelIcon } from "@/components/pixel/PixelIcon";

// Shows the user's personal invite link with copy-to-clipboard. The absolute URL
// is resolved server-side from the request host and passed in, so it renders the
// same on server and client (no hydration flicker) and needs no base-URL env var.
export function InviteLink({ link }: { link: string }) {
  const t = useTranslations("invite");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is still visible to copy manually */
    }
  }

  return (
    <div className="row center wrap gap-2">
      <code
        className="frame frame--basalt"
        style={{
          padding: "8px 14px",
          fontFamily: "var(--font-pixel)",
          fontSize: 14,
          color: "var(--sand-light)",
          wordBreak: "break-all",
          flex: "1 1 220px",
        }}
      >
        {link}
      </code>
      <button type="button" className="btn" onClick={copy}>
        <PixelIcon name={copied ? "check" : "copy"} size={15} color="#2B2118" />{" "}
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
