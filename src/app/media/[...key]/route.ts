import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/cf";

// Serverar bilder och filer från R2. Nycklarna är unika per uppladdning,
// så filerna kan cachas i ett år i webbläsare och i Cloudflares nät.
export async function GET(req: NextRequest, ctx: RouteContext<"/media/[...key]">) {
  const { key } = await ctx.params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (objectKey.includes("..")) return new Response("Ogiltig sökväg", { status: 400 });

  const { MEDIA } = await getEnv();
  const object = await MEDIA.get(objectKey, { onlyIf: req.headers });
  if (!object) return new Response("Filen finns inte", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  if (!headers.has("cache-control")) headers.set("cache-control", "public, max-age=31536000, immutable");

  // onlyIf ger ett objekt utan innehåll när webbläsarens kopia fortfarande gäller.
  if (!("body" in object) || !object.body) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}
