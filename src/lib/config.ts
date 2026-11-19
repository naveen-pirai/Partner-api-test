/**
 * HiringJet Partner API base (visible in browser Network tab).
 * Paths: /v2/jobs, /v2/master-data, /v2/master-data/country
 */
export const PARTNER_API_BASE =
  process.env.NEXT_PUBLIC_PARTNER_API_BASE?.replace(/\/$/, "") ||
  process.env.HJ_API_BASE_URL?.replace(/\/$/, "") ||
  "https://apii.dev.hiring-jet.com/api";
