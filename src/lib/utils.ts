export function formatPrice(amount: number): string {
  return '৳' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export async function generateOrderNumber(): Promise<string> {
  const ts = Date.now().toString().slice(-5);
  const rand = Math.floor(100 + Math.random() * 900);
  return `DG-${ts}${rand}`;
}
