<script setup lang="ts">
/** global/home/review.blade.php (via template-{2,3,4}/review/layout-4): the dealer's reviews in 3 columns. */
const props = defineProps<{ reviews: any[] }>()

const { company } = useSite()
const home = computed(() => company.value.pre_define?.home ?? {})

/** Helper.php `cut_string()`: cut at the last space before `max`, with "...". */
function cutString(value: unknown, max: number): string {
  const s = String(value ?? '')
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const pos = cut.lastIndexOf(' ')
  return `${pos === -1 ? cut : cut.slice(0, pos)}...`
}

const rows = computed(() =>
  (props.reviews ?? []).map((r: any) => {
    const rating = Number(r.rating) || 0
    return {
      key: r.id ?? `${r.firstname}-${r.lastname}-${r.description}`,
      rating,
      ratingText: rating.toFixed(1),
      text: cutString(r.description, 150),
      name: `${r.firstname ?? ''} ${r.lastname ?? ''}`,
    }
  }),
)
</script>

<template>
  <div class="flex">
    <div class="container my-10 gap-8 flex flex-col">
      <div class="flex flex-col gap-4 items-center">
        <span class="font-semibold lg:text-4xl text-3xl" v-html="home.reviews_title ?? ''" />
        <span class="text-lg" v-html="home.reviews_subtitle ?? ''" />
      </div>
      <div class="grid lg:grid-cols-3 grid-cols-1 gap-4">
        <div
          v-for="review in rows"
          :key="review.key"
          class="p-7 lg:border-r-[3px] lg:last:border-r-0 lg:border-b-0 border-b-[3px] last:border-b-0 border-black"
        >
          <div class="flex gap-2 text-left">
            <p class="font-semibold text-xl text-left border-solid border-r-2 pr-2 border-black">
              {{ review.ratingText }}
            </p>
            <Icon
              v-for="n in 5"
              :key="n"
              :name="n <= review.rating ? 'ion:star' : 'ion:star-outline'"
              class="text-primary text-lg my-auto company-primary-base-text"
            />
          </div>
          <p class="text-left mb-3">{{ review.text }}</p>
          <p class="font-normal w-full text-right text-primary company-primary-base-text">- {{ review.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
