import { SECTOR_3_TOOLS } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function ToolsGrid() {
  return (
    <section className="border-t border-white/5 px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-10 text-center text-2xl font-semibold text-white sm:text-3xl">
          Sector 3 Tools
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SECTOR_3_TOOLS.map((tool) => (
            <article
              key={tool.name}
              className="group flex flex-col rounded-xl border border-white/10 bg-ni-navy/40 p-6 transition hover:border-cyan-500/30 hover:shadow-glow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-white">{tool.name}</h3>
                <StatusBadge status={tool.status} />
              </div>
              <p className="mb-1 text-xs text-ni-cyan/70">{tool.subdomain}</p>
              <p className="mb-6 flex-1 text-sm text-ni-muted">{tool.description}</p>
              {tool.url ? (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                >
                  Open Tool →
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-ni-muted">
                  Coming Soon
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
