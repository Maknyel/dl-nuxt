<script setup lang="ts">
/**
 * A filter's list of choices (custom-components/multiple-checkbox.blade.php, as the sidebar shows it: always open):
 * a round checkbox, the value and its count per row. A click anywhere on the row ticks it; a tick is postThisForm().
 * Rows counting 0 are hidden unless ticked, except in the field just touched (sidebar-live's sfHideZeroCountRows).
 */
import { MULTI_FIELDS, type FacetRow, type MultiId } from '~/composables/useInventorySearch'

const props = defineProps<{ id: MultiId; choices: FacetRow[] }>()
const search = useInventorySearch()
const field = MULTI_FIELDS[props.id]

const rows = computed(() =>
  props.choices
    .map((option, key) => ({ key, value: option[field.key], count: option.count ?? 0 }))
    .filter((r) => r.value !== '' && r.value !== null && r.value !== undefined)
    .map((r) => ({ ...r, value: String(r.value) })),
)

const isChecked = (value: string) => search.form.multi[props.id].includes(value)

function onChange(value: string, checked: boolean) {
  const list = search.form.multi[props.id].filter((v) => v !== value)
  if (checked) list.push(value)
  search.form.multi[props.id] = list
  search.postThisForm(props.id)
}

function rowClick(e: MouseEvent) {
  const row = e.currentTarget as HTMLElement
  const cb = row.querySelector('input[type=checkbox]') as HTMLInputElement | null
  if (cb && e.target !== cb) cb.click()
}

function hidden(value: string, count: unknown) {
  if (search.lastTouched.value === props.id) return false
  const n = parseInt(String(count), 10)
  return !Number.isNaN(n) && n === 0 && !isChecked(value)
}
</script>

<template>
  <div :id="`${id}searchdropdown-container`" class="relative dropdown-top">
    <div :id="`${id}dropdown`" class="dropdown-content w-full z-50 flex flex-col bg-white rounded text-sm">
      <div
        v-for="row in rows"
        :id="row.value"
        :key="row.value"
        v-show="!hidden(row.value, row.count)"
        class="choices w-full text-black py-2 px-3 cursor-pointer flex gap-2 items-center justify-between"
        role="option"
        tabindex="0"
        :aria-label="`Select option ${row.value}`"
        @click="rowClick"
      >
        <div class="flex gap-2 items-center">
          <input
            :id="`${id}_${row.key}`"
            :checked="isChecked(row.value)"
            :name="`${field.param}[]`"
            type="checkbox"
            :value="row.value"
            class="w-[20px] h-[20px]"
            @change="onChange(row.value, ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ row.value }}</span>
        </div>
        <span class="text-black text-xs">{{ row.count }}</span>
      </div>
    </div>
  </div>
</template>
