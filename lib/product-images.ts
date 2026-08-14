import { API_BASE_URL } from "@/lib/config";

export const PRODUCT_IMAGE_PLACEHOLDER = `${API_BASE_URL}/product-placeholder.svg`;

export function resolveImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${API_BASE_URL}${trimmed}`;
  return trimmed;
}

export function pickProductImageUrl(
  images?: { url?: string | null; isPrimary?: boolean }[] | null
): string {
  if (!images?.length) return PRODUCT_IMAGE_PLACEHOLDER;

  const primary = images.find((img) => img.isPrimary && resolveImageUrl(img.url));
  const first = images.find((img) => resolveImageUrl(img.url));
  return resolveImageUrl(primary?.url || first?.url) || PRODUCT_IMAGE_PLACEHOLDER;
}
