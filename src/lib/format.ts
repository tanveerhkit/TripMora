/** Small presentation helpers — currency and durations. */

export function formatMoney(amount: number, currency: string): string {
  const rounded = Math.round(amount)
  const grouped = rounded.toLocaleString('en-US')
  // currency here is a symbol/short code we simply prefix.
  return `${currency}${grouped}`
}

export function formatDuration(min: number | null): string {
  if (min === null || min <= 0) return ''
  if (min < 60) return `${min} min`
  const hours = Math.floor(min / 60)
  const rem = min % 60
  return rem ? `${hours}h ${rem}m` : `${hours}h`
}

/** A Google Images search URL for a place (opens real photos in a new tab). */
export function googleImagesUrl(...parts: string[]): string {
  const query = parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ')
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hours = Math.round(min / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}
