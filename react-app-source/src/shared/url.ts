/** Strips scheme, "www.", query, hash and trailing slashes; lowercases. */
export function normalizeUrl(input: string): string {
  const withoutScheme = input.trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
  const withoutQuery = withoutScheme.split(/[?#]/)[0]
  return withoutQuery.replace(/^www\./, '').replace(/\/+$/, '')
}

const HOST_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

const INVALID_URL = 'That doesn’t look like a valid URL.'

export type SiteValidation =
  | { ok: true; name: string; url: string }
  | { ok: false; error: string }

/**
 * @param existingUrls normalised URLs already in the list (excluding the site being edited)
 */
export function validateSite(
  nameInput: string,
  urlInput: string,
  existingUrls: string[],
): SiteValidation {
  if (!urlInput.trim()) return { ok: false, error: 'Enter a URL.' }
  if (/\s/.test(urlInput.trim())) return { ok: false, error: 'URLs can’t contain spaces.' }

  const url = normalizeUrl(urlInput)
  const [host, ...pathParts] = url.split('/')
  if (!HOST_RE.test(host) || pathParts.some((part) => part === '')) {
    return { ok: false, error: INVALID_URL }
  }
  if (existingUrls.includes(url)) return { ok: false, error: 'That site is already in the list.' }

  // Blank name falls back to the domain, e.g. "tiktok.com" -> "Tiktok".
  const label = host.split('.').slice(-2, -1)[0]
  const name = nameInput.trim() || label.charAt(0).toUpperCase() + label.slice(1)
  return { ok: true, name, url }
}

/** Epoch ms -> "DD/MM/YY". */
export function formatDate(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${pad(d.getFullYear() % 100)}`
}
