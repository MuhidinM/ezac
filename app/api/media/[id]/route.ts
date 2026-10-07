import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api/config";

/**
 * Public zakat media (cause/story images, report PDFs). Served through
 * the site so browsers never talk to the gateway directly (its UAT
 * certificate is self-signed). Media ids never change content.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) return new NextResponse(null, { status: 404 });
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/zakat/v1/media/${id}`, { next: { revalidate: 86_400 } });
    if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 });
    const headers = new Headers({
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    });
    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);
    const disposition = upstream.headers.get("Content-Disposition");
    if (disposition) headers.set("Content-Disposition", disposition);
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
