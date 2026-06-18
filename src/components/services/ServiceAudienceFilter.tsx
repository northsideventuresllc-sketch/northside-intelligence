"use client";

export type AudienceFilter = "all" | "individual" | "business";

interface ServiceAudienceFilterProps {
  value: AudienceFilter;
  onChange: (value: AudienceFilter) => void;
}

const FILTERS: { value: AudienceFilter; label: string }[] = [
  { value: "all", label: "All Services" },
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business & Enterprise" },
];

export function ServiceAudienceFilter({ value, onChange }: ServiceAudienceFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            value === filter.value
              ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
              : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20 hover:text-white"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
