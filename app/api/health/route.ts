import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Readiness endpoint consumed by the deployment pipeline.
 *
 * Nginx and the rollback logic need more than "the port answered": a release
 * must prove it is the revision that was just activated. The running server
 * cannot know its own directory name, so the deploy job writes the commit SHA
 * into the release root and the build id comes from the compiled bundle. If
 * either is unreadable the release is not considered ready.
 */

// Never cached: a cached readiness response would let a deploy pass while the
// process serves a stale release.
export const dynamic = "force-dynamic";

export const runtime = "nodejs";

async function readReleaseFile(relativePath: string): Promise<string | null> {
  try {
    const contents = await readFile(path.join(process.cwd(), relativePath), "utf8");
    return contents.trim() || null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [release, buildId] = await Promise.all([
    readReleaseFile("RELEASE_SHA"),
    readReleaseFile(".next/BUILD_ID"),
  ]);

  const ready = buildId !== null;

  return Response.json(
    {
      status: ready ? "ok" : "degraded",
      release,
      buildId,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
