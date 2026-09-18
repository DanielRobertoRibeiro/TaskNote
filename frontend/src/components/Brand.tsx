import { Check } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="TaskNote">
      <span className="brand-mark">
        <Check size={18} strokeWidth={3} />
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>TaskNote</strong>
          <small>Organize. Anote. Realize.</small>
        </span>
      )}
    </div>
  );
}
