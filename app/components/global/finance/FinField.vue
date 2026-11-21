<script lang="ts">
/*
 * The Blade page's input helpers (new_form.blade.php's script and the layout's public/js/helpers.js), exported for the
 * other credit application parts. Each returns the value the Blade's handler writes into the field (null: none).
 */

/** isNumericInput / isModifierKey / enforceFormat: keydown keeps digits and editing keys only. */
const isNumericInput = (e: KeyboardEvent) => {
  const key = e.keyCode
  return (key >= 48 && key <= 57) || (key >= 96 && key <= 105)
}
export const isModifierKey = (e: KeyboardEvent) => {
  const key = e.keyCode
  return (
    e.shiftKey === true ||
    key === 35 ||
    key === 36 ||
    key === 8 ||
    key === 9 ||
    key === 13 ||
    key === 46 ||
    (key > 36 && key < 41) ||
    ((e.ctrlKey === true || e.metaKey === true) && (key === 65 || key === 67 || key === 86 || key === 88 || key === 90))
  )
}
export function enforceFormat(e: KeyboardEvent) {
  if (!isNumericInput(e) && !isModifierKey(e)) e.preventDefault()
}

/** formatToPhone (keyup): (xxx) xxx-xxxx from the first ten digits. */
export function formatToPhone(e: KeyboardEvent, value: string): string | null {
  if (isModifierKey(e)) return null
  const input = value.replace(/\D/g, '').substring(0, 10)
  const zip = input.substring(0, 3)
  const middle = input.substring(3, 6)
  const last = input.substring(6, 10)
  if (input.length > 6) return `(${zip}) ${middle}-${last}`
  if (input.length > 3) return `(${zip}) ${middle}`
  if (input.length > 0) return `(${zip}`
  return null
}

/** formatToSSN (keydown, before the key lands): xxx-xx-xxx from the first eight digits. */
export function formatToSSN(e: KeyboardEvent, value: string): string | null {
  if (isModifierKey(e)) return null
  const input = value.replace(/\D/g, '').substring(0, 8)
  const part1 = input.substring(0, 3)
  const part2 = input.substring(3, 5)
  const part3 = input.substring(5, 8)
  if (input.length > 5) return `${part1}-${part2}-${part3}`
  if (input.length > 3) return `${part1}-${part2}`
  if (input.length > 0) return `${part1}`
  return null
}

/** helpers.js isNumber (keypress): no characters but digits. */
export function isNumberKey(e: KeyboardEvent) {
  const charCode = e.which ? e.which : e.keyCode
  if (charCode > 31 && (charCode < 48 || charCode > 57)) e.preventDefault()
}

/** isNumberSSN (keypress): digits and '-'. */
export function isNumberSSNKey(e: KeyboardEvent) {
  const charCode = e.which ? e.which : e.keyCode
  if (charCode !== 45 && (charCode < 48 || charCode > 57)) e.preventDefault()
}

/** The years / months input listeners: leading zeros dropped, empty or invalid = 0, at most `max`. */
export function clampNumber(raw: string, max: number): string {
  const value = raw.replace(/^0+/, '')
  let n = Number.parseInt(value, 10)
  if (Number.isNaN(n) || n < 0) n = 0
  else if (n > max) n = max
  return String(n)
}

/** helpers.js priceInputEvent: digits and one dot, no leading 0 or dot, two decimals at most. */
export function priceInput(raw: string): string {
  let val = raw.replace(/[^0-9.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = `${parts[0]}.${parts.slice(1).join('')}`
  if (val.length > 0 && (val[0] === '0' || val[0] === '.')) val = ''
  if (val.includes('.')) {
    const [intPart, decPart = ''] = val.split('.')
    const dec = decPart.slice(0, 2)
    val = dec.length > 0 ? `${intPart}.${dec}` : `${intPart}.`
  }
  return val
}

/** helpers.js priceFocusInEvent: the commas come off while editing. */
export function priceFocus(raw: string): string {
  return raw.replace(/,/g, '')
}

/** helpers.js priceBlurEvent (padAndTruncate): 1,234.50 on leaving the field; zero = empty. */
export function priceBlur(raw: string): string {
  if (raw === '') return ''
  if (raw === '0' || raw === '0.' || raw === '0.0' || raw === '0.00') return ''
  const [rawInt = '', rawDec] = raw.split('.')
  const intPart = rawInt.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  let decPart = rawDec ? rawDec.replace(/\D/g, '').slice(0, 2) : ''
  if (decPart.length === 0) decPart = '00'
  if (decPart.length === 1) decPart += '0'
  return `${intPart}.${decPart}`
}

/** helpers.js priceKeydown: digits, a dot and the editing keys. */
export function priceKeydown(e: KeyboardEvent) {
  const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete']
  const isDigit = /^[0-9]$/.test(e.key)
  if (!isDigit && !allowed.includes(e.key) && e.key !== '.') e.preventDefault()
}

/** helpers.js mileageInputEvent: thousands separators as the miles are typed. */
export function mileageInput(raw: string): string {
  const val = raw.replace(/,/g, '')
  return !Number.isNaN(Number(val)) && val !== '' ? Number(val).toLocaleString() : ''
}
</script>

<script setup lang="ts">
/**
 * One field of the credit application: the label (with its required star), the control and its validation line, as
 * new_form.blade.php writes each of them. The value lives in the form's shared state (CreditApp.vue), keyed by the
 * Blade's element id; so do its error (`input-error` + the `{id}_vt` text) and its dynamic star.
 *
 * `kind` gives the Blade's per-field scripts:
 *  - 'phone': digits only, formatted (xxx) xxx-xxxx on keyup (enforceFormat / formatToPhone);
 *  - 'ssn': digits and '-', formatted xxx-xx-xxx on keydown (enforceFormat / formatToSSN, which format the value
 *    before the key lands, so the last digit is added after the formatting, as on :8002);
 *  - 'number': type=number, clamped on input to 0..`clamp` with leading zeros dropped (the Blade's input listeners);
 *  - 'money': the $ group-input with helpers.js priceInputEvent / priceFocusInEvent / priceBlurEvent / priceKeydown;
 *  - 'zip': digits only (helpers.js isNumber on keypress);
 *  - 'email', 'text'.
 * Other attributes (and listeners, e.g. @keyup / @change for the "previous address" checks) land on the control.
 */
import type { FinCtx } from './CreditApp.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    id: string
    label: string
    /** The column classes of the field's wrapper (lg:col-span-3 md:col-span-6 col-span-full, ...). */
    col: string
    kind?: 'text' | 'email' | 'phone' | 'ssn' | 'number' | 'money' | 'zip'
    /** Clamp for 'number' (99 for years, 11 for months). */
    clamp?: number
    /** A static red star. */
    req?: boolean
    /** A star the page sets and clears (its Blade id): the text comes from the shared `ind[indKey]`. */
    indId?: string
    indKey?: string
    /** The validation line ({id}_vt); a few Blade fields have none. */
    vt?: boolean
    /** When typing clears the field's error: 'keyup' (most), 'change', 'click' or never. */
    resetOn?: 'keyup' | 'change' | 'click' | 'none'
    /** The input's type, where the Blade sets one the kind doesn't imply. */
    type?: string
  }>(),
  { kind: 'text', clamp: 99, req: false, indId: undefined, indKey: undefined, vt: true, resetOn: 'keyup', type: undefined },
)

const ctx = inject<FinCtx>('finCtx')!
const { form, bad, msg, ind, dis } = ctx

const PHONE_PATTERN = '^((\\+\\d{1,3}(-| )?\\(?\\d\\)?(-| )?\\d{1,5})|(\\(?\\d{2,6}\\)?))(-| )?(\\d{3,4})(-| )?(\\d{4})(( x| ext)\\d{1,5}){0,1}$'
const SSN_PATTERN = '^\\d{3}-\\d{2}-\\d{4}$'

const inputType = computed(() => {
  if (props.type) return props.type
  if (props.kind === 'phone') return 'tel'
  if (props.kind === 'email') return 'email'
  if (props.kind === 'ssn') return 'text'
  if (props.kind === 'number') return 'number'
  return undefined
})

const target = (e: Event) => e.target as HTMLInputElement
/** Write a value the Blade's scripts would have written into the field: on the element and in the form. */
function put(e: Event, value: string) {
  target(e).value = value
  form[props.id] = value
}

function onInput(e: Event) {
  if (props.kind === 'number') return put(e, clampNumber(target(e).value, props.clamp))
  if (props.kind === 'money') return put(e, priceInput(target(e).value))
  form[props.id] = target(e).value
}

function onKeydown(e: KeyboardEvent) {
  if (props.kind === 'phone' || props.kind === 'ssn') enforceFormat(e)
  if (props.kind === 'ssn') {
    const v = formatToSSN(e, target(e).value)
    if (v !== null) put(e, v)
  }
  if (props.kind === 'money') priceKeydown(e)
}

function onKeypress(e: KeyboardEvent) {
  if (props.kind === 'phone' || props.kind === 'zip') isNumberKey(e)
  if (props.kind === 'ssn') isNumberSSNKey(e)
}

function onKeyup(e: KeyboardEvent) {
  if (props.resetOn === 'keyup') ctx.reset(props.id)
  if (props.kind === 'phone') {
    const v = formatToPhone(e, target(e).value)
    if (v !== null) put(e, v)
  }
}

function onFocus(e: Event) {
  if (props.kind === 'money') put(e, priceFocus(target(e).value))
}
function onBlur(e: Event) {
  if (props.kind === 'money') put(e, priceBlur(target(e).value))
}
function onChange() {
  if (props.resetOn === 'change') ctx.reset(props.id)
}
function onClick() {
  if (props.resetOn === 'click') ctx.reset(props.id)
}

const controlAttrs = computed(() => ({
  id: props.id,
  name: props.id,
  type: inputType.value,
  value: form[props.id] ?? '',
  disabled: dis[props.id] || undefined,
  pattern: props.kind === 'phone' ? PHONE_PATTERN : props.kind === 'ssn' ? SSN_PATTERN : undefined,
  inputmode: (props.kind === 'number' ? 'numeric' : undefined) as 'numeric' | undefined,
  autocorrect: props.kind === 'email' ? 'off' : undefined,
  autocapitalize: props.kind === 'email' ? 'none' : undefined,
}))
</script>

<template>
  <div :class="col" class="flex flex-col">
    <label class="form-label text-sm font-bold">
      {{ label }}
      <span v-if="req" class="required-indicator">*</span>
      <span v-else-if="indId" :id="indId" class="required-indicator">{{ indKey ? ind[indKey] : '' }}</span>
    </label>
    <slot name="before" />
    <div v-if="kind === 'money'" class="mt-2.5 group-input">
      <div class="icon">
        <span>$</span>
      </div>
      <input
        class="input"
        :class="{ 'input-error': bad[id] }"
        @input="onInput"
        @keydown="onKeydown"
        @keyup="onKeyup"
        @focus="onFocus"
        @blur="onBlur"
        v-bind="{ ...controlAttrs, ...$attrs }"
      />
    </div>
    <input
      v-else
      class="mt-2.5 input"
      :class="{ 'input-error': bad[id] }"
      @input="onInput"
      @keydown="onKeydown"
      @keypress="onKeypress"
      @keyup="onKeyup"
      @change="onChange"
      @click="onClick"
      v-bind="{ ...controlAttrs, ...$attrs }"
    />
    <span v-if="vt" :id="`${id}_vt`" class="validation-text">{{ msg[id] }}</span>
  </div>
</template>
