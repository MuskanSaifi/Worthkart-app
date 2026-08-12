import type { Product } from "./types";

const bySlug = new Map<string, Product>();
const byId = new Map<string, Product>();

/** Remember products seen in lists so detail works before by-slug API exists on prod. */
export function rememberProduct(product: Product | null | undefined) {
  if (!product?.slug) return;
  bySlug.set(product.slug, product);
  if (product.id) byId.set(product.id, product);
}

export function rememberProducts(products: Product[] | null | undefined) {
  for (const p of products || []) rememberProduct(p);
}

export function recallProductBySlug(slug: string): Product | undefined {
  return bySlug.get(slug);
}
