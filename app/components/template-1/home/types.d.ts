/** GET /api/site/home (server/api/site/home.get.ts), as the template-1 home sections read it. A .d.ts so Nuxt does not scan it as a component. */

export interface T1Review {
  id?: number
  firstname?: string
  lastname?: string
  description?: string
  rating?: number | string
  created_at?: string | null
  source?: string
  [key: string]: any
}

export interface T1HomeData {
  getavailablemake?: { make?: string; count?: number }[]
  getavailablemodel?: { model?: string; make?: string; count?: number }[]
  getavailabletrim?: { trim?: string; count?: number }[]
  getavailabledrivetrain?: { drivetrain?: string; count?: number }[]
  vehiclebodytype?: { body_type?: string; count?: number }[]
  getavailableinternetprice?: { internet_price?: number | string; count?: number | string }[]
  getavailableyear?: { year?: number; count?: number }[]
  getavailablemileage?: { mileage?: number; count?: number }[]
  under_20k_count?: number
  unfiltered_body_type_counts?: { body_type?: string; count?: number }[]
  getavailablecompanies?: { id?: number; name?: string; count?: number }[]
}

export interface T1Home {
  reviews?: T1Review[]
  vehicles?: any[]
  requestcurrentHeroImage?: string
  data?: T1HomeData
}
