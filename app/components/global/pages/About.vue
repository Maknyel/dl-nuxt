<script setup lang="ts">
/**
 * global/about/index.blade.php (the About Us mock-up): a centred welcome under an About Us badge; Meet the Team with
 * each enabled position in a white card (its name in a primary pill, its people as staff cards); Hours of Operation
 * and Company Information side by side; then the same two cards for each of a group's locations.
 *
 * Members come from the position's `teams` when there are any, else from the legacy `{position}_users` lists. The
 * Blade's Management special case (company ids 5097 / 5022 / 5023) is inside an HTML comment there, so nothing shows.
 * The group locations' map card is commented out in the Blade, so it isn't rendered here either.
 */
const { company, mainCompany, site } = useSite()

interface Member {
  image: string | null
  display_name: string
  role: string
}

const positions = computed<any[]>(() => (Array.isArray(company.value.team_position) ? company.value.team_position : []))
const enabledCount = computed(() => positions.value.filter((p) => p?.enabled == 1).length)

const teams = computed(() => {
  const out: { position: Record<string, any>; members: Member[] }[] = []
  if (!positions.value.length || enabledCount.value === 0) return out
  for (const position of positions.value) {
    if (position?.enabled != 1) continue
    let members: Member[]
    if (Array.isArray(position.teams) && position.teams.length > 0) {
      members = position.teams.map((t: any) => ({
        image: t?.image ?? null,
        display_name: t?.name ?? '',
        role: t?.position ?? '',
      }))
    } else {
      const legacy = company.value[`${String(position.position_name ?? '').toLowerCase()}_users`]
      members = (Array.isArray(legacy) ? legacy : []).map((u: any) => ({
        image: u?.image ?? null,
        display_name: `${u?.name ?? ''} ${u?.l_name ?? ''}`.trim(),
        role: u?.title ?? '',
      }))
    }
    if (members.length > 0) out.push({ position, members })
  }
  return out
})

/** `str_starts_with(image, 'http') ? image : MAIN_WEBSITE_URL . image`. */
const photoUrl = (image: string) =>
  image.startsWith('http') ? image : `${String(site.value?.mediaBase ?? '/')}${image}`

const PROFILE_FALLBACK = '/frontendassets/assets/images/profile-picture.jpg'
const onPhotoError = (e: Event) => {
  const img = e.target as HTMLImageElement
  if (!img.src.endsWith(PROFILE_FALLBACK)) img.src = PROFILE_FALLBACK
}
</script>

<template>
  <div class="ab-page">
    <section class="ab-hero">
      <span class="ab-badge"><Icon name="ion:people-outline" aria-hidden="true" /> ABOUT US</span>
      <h1 class="ab-title"><span>Welcome</span> to {{ company.name }}</h1>
      <div class="ab-lead" v-html="company.aboutus ?? ''" />
    </section>

    <section v-if="teams.length > 0" class="meet-team-section ab-team">
      <h2 class="ab-h2">
        <span class="ab-h2-txt"><span>Meet</span> the Team</span>
      </h2>

      <div v-for="(team, i) in teams" :key="i" class="team-profile ab-pos">
        <div class="ab-pos-h">
          <span class="ab-pill"
            ><Icon name="ion:briefcase-outline" aria-hidden="true" /> {{ team.position.position_name }}</span
          >
        </div>
        <!-- Each member: a staff card, the photo or a "Staff photo" placeholder, then the name and the job title. -->
        <div class="ab-members">
          <div v-for="(member, j) in team.members" :key="j" class="ab-member">
            <div class="ab-member-photo">
              <span v-if="!member.image" class="ab-member-ph">
                <Icon name="ion:person-outline" aria-hidden="true" />
                <small>STAFF PHOTO</small>
              </span>
              <img
                v-else
                :src="photoUrl(member.image)"
                :alt="member.display_name"
                loading="lazy"
                @error="onPhotoError"
              />
            </div>
            <div class="ab-member-txt">
              <strong>{{ member.display_name }}</strong>
              <small>{{ member.role }}</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-12 gap-4 w-full">
      <div class="col-span-12 lg:col-span-7">
        <UiHoursOfOperation :valuearray="company" />
      </div>
      <div class="col-span-12 lg:col-span-5">
        <UiCompanyInformation :valuearray="company" />
      </div>
    </div>

    <template v-for="(location, k) in mainCompany" :key="`loc-${k}`">
      <div class="w-full">
        <h4 class="font-semibold form-label text-xl my-2 lg:text-left text-center">
          {{ location.name }}
        </h4>
      </div>
      <div class="grid grid-cols-12 gap-4 py-6 w-full">
        <div class="col-span-12 md:col-span-7">
          <UiHoursOfOperation :valuearray="location" />
        </div>
        <div class="col-span-12 md:col-span-5">
          <UiCompanyInformation :valuearray="location" />
        </div>
      </div>
    </template>
  </div>
</template>

<style>
/* The Laravel page's body rules: the tinted page background, and on a tall window the page fills it with the footer
   at the bottom. The Laravel body holds the nav, the page and the footer; here the layout's wrapper does. */
body:has(.ab-page) {
  background: color-mix(in srgb, var(--company-primary-base, #6d28d9) 3%, #f6f6f8) !important;
}

[data-template]:has(> .ab-page) {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

[data-template]:has(> .ab-page) > .ab-page {
  width: 100%;
  margin-bottom: auto;
}

[data-template]:has(> .ab-page) > footer {
  flex-shrink: 0;
}
</style>

<style scoped>
.border-primary {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border: 2px solid var(--company-primary-base);
  border-radius: 0.5rem;
}

.ab-page {
  --ab-p: var(--company-primary-base, #6d28d9);
  --ab-ink: #16131f;
  --ab-muted: #6b6880;
  --ab-line: #e7e7ec;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: none;
  margin: 0 auto;
  /* 40px over and 52px under, the content on the header's and footer's 1280px column, 16px each side on a phone. */
  padding: 40px max(16px, calc((100% - 1280px) / 2)) 52px;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  color: var(--ab-ink);
}

.ab-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 1.5rem;
}

.ab-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, var(--ab-p) 80%, #000000);
  background: color-mix(in srgb, var(--ab-p) 9%, #ffffff);
  border: 1px solid color-mix(in srgb, var(--ab-p) 18%, #ffffff);
}

.ab-badge .ion-icon {
  color: #f59e0b;
}

.ab-page .ab-title {
  margin: 1rem 0 0;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 3.25rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--ab-ink);
}

.ab-title span,
.ab-h2-txt > span {
  color: color-mix(in srgb, var(--ab-p) 75%, #ffffff);
}

.ab-lead {
  max-width: 50rem;
  margin-top: 1rem;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--ab-muted);
}

.ab-team {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ab-page .ab-h2 {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin: 0;
  font-family: 'Outfit', 'Inter', sans-serif;
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ab-ink);
}

.ab-page .ab-h2::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #dcdbe2;
}

.ab-pos {
  padding: 1.25rem 1.5rem;
  border-radius: 1.25rem;
  background: #fff;
  border: 1px solid var(--ab-line);
  box-shadow: 0 18px 40px -28px rgba(16, 12, 40, 0.35), 0 1px 2px rgba(16, 12, 40, 0.04);
}

/* The members: four staff cards a row (two on phones), the photo over the name and job title. */
.ab-members {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 767px) {
  .ab-members {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.ab-member {
  overflow: hidden;
  border-radius: 0.875rem;
  background: #fff;
  border: 1px solid var(--ab-line);
  box-shadow: 0 10px 24px -18px rgba(16, 12, 40, 0.45);
}

.ab-member-photo {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4 / 3.4;
  background: #f1f1f4;
}

.ab-member-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ab-member-ph {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  color: color-mix(in srgb, var(--ab-p) 60%, #9a98a8);
}

.ab-member-ph .ion-icon {
  font-size: 1.75rem;
}

.ab-member-ph small {
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ab-muted);
}

.ab-member-txt {
  padding: 0.75rem 0.9rem 0.9rem;
}

.ab-member-txt strong {
  display: block;
  font-size: 0.9375rem;
  font-weight: 700;
}

.ab-member-txt small {
  display: block;
  font-size: 0.8125rem;
  color: color-mix(in srgb, var(--ab-p) 55%, #6b6880);
}

.ab-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 1.125rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: color-mix(in srgb, var(--ab-p) 75%, #ffffff);
  box-shadow: 0 12px 24px -14px color-mix(in srgb, var(--ab-p) 80%, transparent);
}

@media (max-width: 640px) {
  .ab-page .ab-title {
    font-size: 2.25rem;
  }

  .ab-page .ab-h2 {
    font-size: 1.75rem;
  }
}
</style>
