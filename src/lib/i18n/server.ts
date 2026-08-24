import { translate } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  return DEFAULT_LOCALE;
}

export async function getT(): Promise<(key: string, vars?: Record<string, string | number>) => string> {
  const locale = await getLocale();
  return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
}
