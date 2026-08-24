export type Locale = "en" | "am";

export const LOCALES: Locale[] = ["en", "am"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "sw_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "am";
}
