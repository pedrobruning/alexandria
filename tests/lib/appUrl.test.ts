import { afterEach, describe, expect, it } from "vitest";
import { appBaseUrl } from "@/lib/appUrl";

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
});

describe("appBaseUrl", () => {
  it("prefers the configured public URL over the request origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alexandria.app";
    expect(appBaseUrl("http://localhost:3000")).toBe("https://alexandria.app");
  });

  it("strips a trailing slash from the configured URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://alexandria.app/";
    expect(appBaseUrl("http://localhost:3000")).toBe("https://alexandria.app");
  });

  it("falls back to the request origin when no URL is configured", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(appBaseUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("ignores a blank configured value", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    expect(appBaseUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });
});
