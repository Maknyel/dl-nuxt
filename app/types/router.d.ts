// The site's route meta (router.ts).
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** The nav and footer always show (the home page), whatever template_config.sections says. */
    alwaysShell?: boolean
    /** false: the page draws its own frame (the vehicle page). */
    layout?: false
  }
}

export {}
