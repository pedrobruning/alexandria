// Guards the magic-link callback against open redirects: only same-origin
// relative paths are allowed. `//host` and `/\host` escape the origin in
// browsers, so a single leading slash is required and a second is rejected.
export function safeNextPath(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }
  return "/stories";
}
