import { useState } from 'react'

/** Uses Chrome's local favicon cache (needs the "favicon" permission); nothing is sent to third parties. */
function faviconSrc(url: string) {
  const pageUrl = encodeURIComponent(`https://${url}`)
  return chrome.runtime.getURL(`/_favicon/?pageUrl=${pageUrl}&size=32`)
}

export function Favicon({ url }: { url: string }) {
  // Remember which URL failed, so editing a row to a new URL retries the icon.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!url || failedUrl === url) return <span className="favicon favicon-fallback" aria-hidden />
  return (
    <img
      className="favicon"
      src={faviconSrc(url)}
      alt=""
      onError={() => setFailedUrl(url)}
    />
  )
}
