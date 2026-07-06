/**
 * Single source of truth for the site's canonical URL.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL` environment variable (set per-environment
 *      in `.env` for local dev and in Vercel project settings for
 *      preview/production deployments).
 *   2. `VERCEL_URL` — automatically provided by Vercel for preview
 *      deployments (e.g. `pitwall-apex-abc123.vercel.app`).
 *   3. The production domain `https://pitwallapex.com` as a final
 *      fallback so production SEO output is always correct even when
 *      no environment variable is configured.
 *
 * The production custom domain must never be overridden by a Vercel
 * deployment URL, so `VERCEL_URL` is only consulted when
 * `NEXT_PUBLIC_SITE_URL` is absent.
 */
export const SITE_URL = resolveSiteUrl();

export function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }

  return "https://pitwallapex.com";
}