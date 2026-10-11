import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sidorna hämtar sitt innehåll från D1 vid varje anrop,
// så ingen extra cache behöver konfigureras.
export default defineCloudflareConfig({});
