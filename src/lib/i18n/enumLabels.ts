type T = (key: string, vars?: Record<string, string | number>) => string;

export function qualityLabel(t: T, value: string): string {
  return t(`enum.quality.${value}`);
}

export function feedstockLabel(t: T, value: string): string {
  return t(`enum.feedstock.${value}`);
}

export function smokeLabel(t: T, value: string): string {
  return t(`enum.smoke.${value}`);
}
