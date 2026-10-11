import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Cloudflare-bindningarna: DB (D1-databasen) och MEDIA (R2-bilderna). */
export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
