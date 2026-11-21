import type { Company, MenuItem, NavLocation, SiteLayout } from '~/types/site'

/**
 * The dealer's site data for any component: company, locations, template, menu. Loaded by plugins/01.site.ts.
 *
 * The menu and locations follow the Laravel navs exactly (template-1..4/nav/layout-4.blade.php).
 */
export function useSite() {
  const state = useState<SiteLayout | null>('site')

  const site = computed(() => state.value as SiteLayout)
  const company = computed<Company>(() => state.value?.company ?? ({ id: 0 } as Company))
  const mainCompany = computed<Company[]>(() => state.value?.mainCompany ?? [])
  const template = computed(() => state.value?.template ?? 'template-1')
  const templateNav = computed(() => state.value?.templateNav ?? {})
  const isMulti = computed(() => company.value.account_type === 'Multi')

  /** The menu, from the dealer's template_nav flags (the same labels, order and pages as the Laravel navs). */
  const menus = computed<MenuItem[]>(() => {
    const nav = templateNav.value
    const on = (flag: string) => String(nav?.[flag] ?? '') === '1'
    const items: MenuItem[] = []
    if (on('show_view_inventory')) items.push({ label: 'View Inventory', to: '/pre-owned-cars' })
    if (on('show_sell')) items.push({ label: 'Sell Us Your Car', to: '/sell' })
    if (on('show_credit')) items.push({ label: 'Credit App', to: '/finance' })
    if (on('show_prequal')) items.push({ label: 'Get Pre Qual', to: '/prequal' })
    if (on('show_service')) items.push({ label: 'Book Service', to: '/services' })
    if (on('show_team')) items.push({ label: 'Our Team', to: '/aboutus' })
    if (on('show_contact')) items.push({ label: 'Contact Us', to: '/contactus' })
    return items
  })

  /** The dealer's locations (a group's sites), else the company itself. */
  const locations = computed<NavLocation[]>(() => {
    const rows = mainCompany.value.length ? mainCompany.value : [company.value]
    return rows.map((loc) => {
      const address = formatAddress(loc)
      return {
        name: loc.name ?? '',
        phone: loc.phone_number ?? '',
        email: loc.email ?? '',
        address,
        mapUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
        website: loc.dl_website ?? '',
        accountType: loc.account_type ?? '',
        raw: loc,
      }
    })
  })

  /** On inner pages the nav / footer render only when template_config.sections lists them (the Laravel shell). */
  function hasSection(part: 'nav' | 'footer'): boolean {
    const sections = company.value.template_config?.sections
    if (!Array.isArray(sections)) return true
    return sections.some((s) => s?.section === part)
  }

  /** A file in the dealer's (or a location's) media folder. Safe to call anywhere, e.g. inside computed values. */
  const mediaUrl = (file?: string | null, companyId?: number | string): string =>
    buildMediaUrl(state.value?.mediaBase, file, companyId ?? company.value.id)

  /** A company's logo (the dealer's by default), else Dealer Lion's (the Laravel navs' onerror fallback). */
  const logoUrl = (c: Company = company.value): string =>
    c?.logo ? mediaUrl(c.logo, c.id) : DEALER_LION_LOGO

  return { site, company, mainCompany, template, templateNav, isMulti, menus, locations, hasSection, mediaUrl, logoUrl }
}
