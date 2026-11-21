/** The dealer's company row from the API (new-get-company-data-optimized). Loosely typed: ~60 fields, many optional. */
export type Company = Record<string, any> & {
  id: number
  name?: string
  template?: string
  account_type?: 'Single' | 'Multi' | string
  logo?: string
  favicon_logo?: string
  color_primary?: string
  color_secondary?: string
  color_dark_primary?: string
  phone_number?: string
  email?: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  dl_website?: string
  template_nav?: TemplateNav[]
  template_config?: { sections?: { section?: string; layoutName?: string; isVisible?: boolean }[]; [k: string]: any }
  footer_setting?: any
  pre_define?: Record<string, any>
}

/** A `template_nav` row: which menu links and home sections the dealer's template shows ('1' / '0'). */
export type TemplateNav = Record<string, any> & {
  template_id?: string
  show_view_inventory?: string
  show_car_price?: string
  show_sell?: string
  show_credit?: string
  show_prequal?: string
  show_service?: string
  show_team?: string
  show_contact?: string
  show_review?: string
}

export type TemplateKey = 'template-1' | 'template-2' | 'template-3' | 'template-4'

/** GET /api/site/layout. */
export interface SiteLayout {
  template: TemplateKey
  templateNav: TemplateNav
  company: Company
  mainCompany: Company[]
  yearLimit: any[]
  seo: Record<string, any> | null
  googleScript: Record<string, any> | null
  mediaBase: string
}

export interface MenuItem {
  label: string
  to: string
}

/** One of the dealer's locations as the navs and footers show it (the company itself when there's no group). */
export interface NavLocation {
  name: string
  phone: string
  email: string
  address: string
  mapUrl: string
  website: string
  accountType: string
  raw: Company
}
