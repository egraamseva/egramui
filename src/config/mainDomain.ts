/**
 * Main website domain(s): hostnames that show the platform landing page,
 * not a panchayat custom-domain site. Configurable via env for different deployments.
 *
 * - VITE_APP_MAIN_DOMAINS: comma-separated list (e.g. "egram.up.railway.app,egram.com")
 * - VITE_APP_DOMAIN: single primary domain (legacy, also included if set)
 */

const DEFAULT_MAIN_DOMAINS = ["localhost", "127.0.0.1"];

function parseMainDomains(): string[] {
  const fromList =
    (import.meta.env.VITE_APP_MAIN_DOMAINS as string | undefined)
      ?.split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean) ?? [];
  const single = (import.meta.env.VITE_APP_DOMAIN as string | undefined)
    ?.trim()
    .toLowerCase();
  const combined = [...new Set([...DEFAULT_MAIN_DOMAINS, single, ...fromList].filter(Boolean))];
  return combined;
}

let cached: string[] | null = null;

/** List of hostnames treated as the main website (show landing page, not panchayat by domain). */
export function getMainDomains(): string[] {
  if (cached === null) cached = parseMainDomains();
  return cached;
}

/** True if the given hostname is the main website (not a panchayat custom domain). */
export function isMainWebsiteDomain(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return getMainDomains().some((d) => h === d || h.endsWith("." + d));
}
