/**
 * The few Nitro (h3) functions the site's API routes use (app/site-api/api), for the browser: the routes, written for
 * the Nuxt server, run here unchanged and call the Dealer Lion API directly (ADR-0002). `dispatch.ts` runs a route
 * for an `/api/site/...` URL.
 */

/** A request to one of the site's routes: its query, its path params, and the status the route sets. */
export interface SiteEvent {
  path: string
  query: Record<string, any>
  params: Record<string, string>
  statusCode: number
  statusMessage?: string
}

/** For the routes' type annotations (h3's H3Event). */
export type H3Event = SiteEvent

export function defineEventHandler<T>(handler: (event: SiteEvent) => T | Promise<T>) {
  return handler
}

export function getQuery(event: SiteEvent): Record<string, any> {
  return event.query
}

export function getRouterParam(event: SiteEvent, name: string): string | undefined {
  return event.params[name]
}

export function setResponseStatus(event: SiteEvent | null | undefined, code: number, message?: string): void {
  if (!event) return
  event.statusCode = code
  event.statusMessage = message
}

/** An error with a status, like h3's (and what $fetch throws for one): `statusCode`, `statusMessage`, `data`. */
export class SiteError extends Error {
  statusCode: number
  status: number
  statusMessage: string
  data: unknown
  response: { status: number; _data: unknown }

  constructor(statusCode: number, statusMessage: string, data?: unknown) {
    super(statusMessage)
    this.statusCode = statusCode
    this.status = statusCode
    this.statusMessage = statusMessage
    this.data = data
    this.response = { status: statusCode, _data: data }
  }
}

export function createError(input: { statusCode?: number; statusMessage?: string; message?: string; data?: unknown; fatal?: boolean }) {
  return new SiteError(input.statusCode ?? 500, input.statusMessage ?? input.message ?? 'Error', input.data)
}
