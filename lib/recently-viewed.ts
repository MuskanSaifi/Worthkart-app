import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "@/lib/types";

const KEY = "wk_recent_v1";
const MAX = 12;

export async function addRecentlyViewed(product: Product) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const prev: Product[] = raw ? JSON.parse(raw) : [];
    const next = [product, ...prev.filter((p) => p.id !== product.id)].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export async function getRecentlyViewed(excludeId?: string): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const prev: Product[] = raw ? JSON.parse(raw) : [];
    return excludeId ? prev.filter((p) => p.id !== excludeId) : prev;
  } catch {
    return [];
  }
}
