import { NextResponse } from 'next/server';
import { fetchLeadById } from '@/lib/axon/leads';
import { requireAxonOperatorId } from '@/lib/axon/operator';
import { resolveGithubPat } from '@/lib/axon/github-pat.mjs';

// AX-DELIVERABLE-UPLOAD-LIVE (2026-08-03): renders a lead's attached
// deliverable (currently: a private nv-vault file, referenced by its raw
// GitHub URL in lead.meta.deliverable_url) inline in the portal. The GH PAT
// stays server-side only — this route proxies the fetch so JB's browser
// never needs GitHub credentials of its own.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAxonOperatorId();
    const { id } = await params;
    const lead = await fetchLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const url = lead.meta.deliverable_url;
    if (!url) {
      return NextResponse.json({ error: 'No deliverable attached to this lead' }, { status: 404 });
    }

    const pat = await resolveGithubPat();
    const isGithubRaw = url.includes('raw.githubusercontent.com');
    const upstream = await fetch(url, {
      headers: isGithubRaw && pat ? { Authorization: `token ${pat}` } : undefined,
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Deliverable fetch failed: HTTP ${upstream.status}` },
        { status: 502 }
      );
    }

    const body = await upstream.text();
    const contentType = url.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : upstream.headers.get('content-type') || 'text/plain; charset=utf-8';

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Deliverables can reference the operator's own lead — never cache
        // stale content behind a CDN edge.
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Deliverable fetch failed';
    const status = message === 'AXON access denied' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
