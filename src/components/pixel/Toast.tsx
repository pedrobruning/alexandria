import { PixelIcon } from "./PixelIcon";

export type ToastState = { kind: "ok" | "err"; msg: string } | null;

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div className={"toast" + (toast.kind === "err" ? " toast--err" : "")}>
      <PixelIcon name={toast.kind === "err" ? "x" : "check"} size={16} color={toast.kind === "err" ? "#d07350" : "#E0A82E"} />
      <span>{toast.msg}</span>
    </div>
  );
}
