import { useEffect, useState } from 'react'

// Chrome's favicon cache (needs the "favicon" permission). Nothing is sent to third parties.
// Chrome never errors for a missing icon: it serves a default globe instead, so we
// compare against that default to tell "no icon cached" from a real icon.
const iconUrl = (pageUrl: string) =>
  chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=32`)

async function fetchBytes(pageUrl: string) {
  const res = await fetch(iconUrl(pageUrl))
  return new Uint8Array(await res.arrayBuffer())
}

const sameBytes = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])

let defaultIcon: Promise<Uint8Array> | undefined
const resolved = new Map<string, Promise<string | null>>()

/** Tries the www. and bare-domain pages, since the cache is keyed by the exact page visited. */
async function resolveIcon(url: string): Promise<string | null> {
  defaultIcon ??= fetchBytes('https://blockr-no-such-site.invalid/')
  const fallback = await defaultIcon
  const host = url.split('/')[0]
  for (const page of [`https://www.${host}/`, `https://${host}/`, `https://${url}`]) {
    try {
      const bytes = await fetchBytes(page)
      if (!sameBytes(bytes, fallback)) {
        return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' }))
      }
    } catch {
      // try the next candidate
    }
  }
  return null
}

type FaviconProps = {
  url: string
  /** A bundled icon; used instead of the cache when given. */
  src?: string
}

export function Favicon({ url, src }: FaviconProps) {
  const [found, setFound] = useState<{ url: string; src: string | null } | null>(null)

  useEffect(() => {
    if (!url || src) return
    let active = true
    let promise = resolved.get(url)
    if (!promise) {
      promise = resolveIcon(url)
      resolved.set(url, promise)
    }
    promise.then((result) => active && setFound({ url, src: result }))
    return () => {
      active = false
    }
  }, [url, src])

  const shown = src ?? (found?.url === url ? found.src : null)
  if (!shown) return <span className="favicon favicon-fallback" aria-hidden />
  return <img className="favicon" src={shown} alt="" />
}
