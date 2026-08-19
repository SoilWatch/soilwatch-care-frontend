import { cookies } from "next/headers";
import { translate } from "./dictionaries";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getT(): Promise<(key: string, vars?: Record<string, string | number>) => string> {
  const locale = await getLocale();
  return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
