"use client";

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

export function CurrencyInput({ label, value, onChange, id }: CurrencyInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={id}>
      <span className="text-ni-muted">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ni-muted">
          $
        </span>
        <input
          id={id}
          type="number"
          min={0}
          step={0.01}
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-lg border border-white/10 bg-ni-bg py-2 pl-7 pr-3 text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
        />
      </div>
    </label>
  );
}
