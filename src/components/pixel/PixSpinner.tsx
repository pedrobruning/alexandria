export function PixSpinner({ label }: { label?: string }) {
  return (
    <div className="row center gap-3">
      <div className="pixspin" />
      {label && (
        <span style={{ fontFamily: "var(--font-pixel)", color: "var(--sand-light)", fontSize: 14 }}>{label}</span>
      )}
    </div>
  );
}
