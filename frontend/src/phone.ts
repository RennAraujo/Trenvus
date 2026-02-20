import { getCountries, getCountryCallingCode, parsePhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

export type PhoneCountryOption = {
  iso2: CountryCode
  label: string
  callingCode: string
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '')
}

export function getPhoneCountryOptions(locale: string): PhoneCountryOption[] {
  const language = locale === 'pt-BR' || locale === 'en' ? locale : 'en'
  const display = typeof Intl !== 'undefined' ? new Intl.DisplayNames([language], { type: 'region' }) : null

  return getCountries()
    .map((iso2) => {
      const callingCode = `+${getCountryCallingCode(iso2)}`
      const name = display?.of(iso2) || iso2
      return { iso2, label: `${name} (${callingCode})`, callingCode }
    })
    .sort((a, b) => a.label.localeCompare(b.label, language))
}

export function splitE164Phone(
  value: string | null | undefined,
  fallbackIso2: CountryCode,
): { iso2: CountryCode; national: string } {
  const raw = String(value || '').trim()
  if (!raw) return { iso2: fallbackIso2, national: '' }
  try {
    const parsed = parsePhoneNumber(raw)
    const iso2 = (parsed.country as CountryCode | undefined) || fallbackIso2
    return { iso2, national: parsed.nationalNumber || '' }
  } catch {
    return { iso2: fallbackIso2, national: digitsOnly(raw) }
  }
}

export function buildE164Phone(iso2: CountryCode, national: string): string {
  return `+${getCountryCallingCode(iso2)}${digitsOnly(national)}`
}
