/** Formatting helpers ported from the Laravel site's Helper.php / helpers.js. */

/**
 * `caps_only()`: a state as its capitals. "NY" stays "NY"; "New York" becomes "NY" (the first letter of each word),
 * exactly as the Laravel helper does.
 */
export function capsOnly(value?: string | null): string {
  const data = String(value ?? '').replace(/[\t\n]/g, ' ').replace(/\s{2,}/g, ' ')
  if (data === '') return ''
  if (/^[A-Z]+$/.test(data)) return data
  return data
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
}

/** "123 Main St, Rochester NY 14604" (the Laravel navs' address line). */
export function formatAddress(loc: Record<string, any> | undefined): string {
  if (!loc) return ''
  const street = loc.street_address ?? ''
  const city = loc.city ?? ''
  const state = capsOnly(loc.state ?? '')
  const zip = loc.zip_code ?? ''
  const address = `${street}, ${city} ${state} ${zip}`.trim()
  return address === ',' ? '' : address.replace(/^,\s*/, '').replace(/\s{2,}/g, ' ')
}

/** The Laravel `format_phone_number()`: "(585) 866-1200" for 10 digits (or 11 starting with 1), else as stored. */
export function formatPhone(phone?: string | null): string {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1)
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  return phone
}

/** "$20,998" (whole dollars). Empty or 0 gives ''. */
export function money(value: unknown): string {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n) || n === 0) return ''
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/** "55,140" (miles). */
export function mileage(value: unknown): string {
  const n = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(n)) return ''
  return Math.round(n).toLocaleString('en-US')
}

/** The first photo of a vehicle's pipe-separated `features.image_urls`. */
export function firstImage(imageUrls?: string | null): string {
  return String(imageUrls ?? '')
    .split('|')
    .map((s) => s.trim())
    .find(Boolean) ?? ''
}

/** Dealer Lion's logo: the fallback when a dealer has none or theirs fails to load. */
export const DEALER_LION_LOGO = '/imgfav/dealer-lion-logo.png'

/** A file in a company's media folder: the Laravel site's MAIN_WEBSITE_URL + media/company/{id}/{file}. */
export function buildMediaUrl(base: string | undefined, file?: string | null, companyId?: number | string): string {
  if (!file) return ''
  if (/^(https?:)?\/\//.test(file) || file.startsWith('data:')) return file
  return `${String(base ?? '/').replace(/\/?$/, '/')}media/company/${companyId}/${file}`
}

/** `disabledOption()`: the four Dealer Lion demo sites show a "Demo Site" banner and their forms don't submit. */
export function isDemoHost(host?: string): boolean {
  return /^template-[1-4]\.dealerlion\.com$/.test(String(host ?? ''))
}
