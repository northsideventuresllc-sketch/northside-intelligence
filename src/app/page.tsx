import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ToolsGrid } from "@/components/landing/ToolsGrid";
import { Mission } from "@/components/landing/Mission";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <Hero />
      <ToolsGrid />
      <Mission />
      <Footer />
    </main>
  );
import { tools } from '@/lib/tools'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-sm font-medium tracking-widest text-accent uppercase">Northside Intelligence</p>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-6 py-16 sm:py-24">
        <section className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
            Northside Intelligence
          </h1>
          <p className="mt-4 text-xl text-muted text-balance">
            Practical AI tools for real work — built fast, shipped clean.
          </p>
          <p className="mt-6 text-lg text-foreground/90 leading-relaxed text-balance">
            <span className="text-accent font-medium">Sector 3</span> is our product studio: focused SaaS tools
            with shared auth, billing, and deployment — each on its own subdomain, one standard pipeline.
          </p>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold">Tools</h2>
          <p className="mt-2 text-muted">Live products and what&apos;s next.</p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {tools.map((tool) => (
              <li
                key={tool.name}
                className="rounded-xl border border-border bg-card p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{tool.name}</h3>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                      tool.status === 'live'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-border text-muted'
                    }`}
                  >
                    {tool.status === 'live' ? 'Live' : 'Coming soon'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted flex-1">{tool.description}</p>
                {tool.status === 'live' ? (
                  <a
                    href={tool.subdomain}
                    className="mt-6 inline-flex text-sm font-medium text-accent hover:underline"
                  >
                    Open {tool.name} →
                  </a>
                ) : (
                  <p className="mt-6 text-sm text-muted">{tool.subdomain.replace('https://', '')}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted">
          A Northside Ventures Company
        </div>
      </footer>
    </div>
  )
}
