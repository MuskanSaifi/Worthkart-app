import { API_BASE_URL } from "./config";
import type { Address, Banner, Category, Order, Product } from "./types";

type Json = Record<string, unknown>;

export type ProductFacets = {
  brands: { name: string; count: number }[];
  subcategories: { name: string; slug: string }[];
  genders?: string[];
  colors?: string[];
};

export type ProductsResponse = {
  products: Product[];
  total: number;
  facets?: ProductFacets;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_BASE_URL}. Check Wi‑Fi + website npm run dev + .env IP.`
    );
  }

  let data: Json = {};
  try {
    data = (await res.json()) as Json;
  } catch {
    data = {};
  }

  if (!res.ok) {
    throw new Error((data.error as string) || `Request failed (${res.status})`);
  }

  return data as T;
}

async function authedRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  if (!token?.trim()) {
    throw new Error("Session expired. Please login again.");
  }
  try {
    return await request<T>(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        ...(init?.headers || {}),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    if (/unauthorized|session expired/i.test(msg)) {
      throw new Error("Session expired. Please login again.");
    }
    throw e;
  }
}

export async function fetchProducts(query = ""): Promise<Product[]> {
  const data = await request<ProductsResponse>(`/api/products?${query}`);
  const { rememberProducts } = await import("./product-cache");
  rememberProducts(data.products);
  return data.products || [];
}

export async function fetchProductsFull(query = ""): Promise<ProductsResponse> {
  const data = await request<ProductsResponse>(`/api/products?${query}`);
  const { rememberProducts } = await import("./product-cache");
  rememberProducts(data.products);
  return data;
}

export type ProductSuggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  brand?: string | null;
  image?: string | null;
  category?: string | null;
};

export type SuggestResponse = {
  products: ProductSuggestion[];
  categories: { name: string; slug: string }[];
  brands: { name: string }[];
};

export async function fetchProductSuggestions(q: string): Promise<SuggestResponse> {
  const query = q.trim();
  if (query.length < 2) {
    return { products: [], categories: [], brands: [] };
  }

  try {
    return await request<SuggestResponse>(
      `/api/products/suggest?q=${encodeURIComponent(query)}`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // Older deploys may not have /suggest — fall back to product list
    if (!/404|not found/i.test(msg)) {
      return { products: [], categories: [], brands: [] };
    }
  }

  try {
    const data = await fetchProductsFull(
      `search=${encodeURIComponent(query)}&limit=8&sort=best`
    );
    return {
      products: (data.products || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        mrp: p.mrp,
        brand: p.brand,
        image: p.images?.[0]?.url || null,
        category: p.category?.name || null,
      })),
      categories: (data.facets?.subcategories || [])
        .slice(0, 4)
        .map((c) => ({ name: c.name, slug: c.slug })),
      brands: (data.facets?.brands || []).slice(0, 4).map((b) => ({ name: b.name })),
    };
  } catch {
    return { products: [], categories: [], brands: [] };
  }
}

export async function fetchProductBySlug(slug: string): Promise<{
  product: Product;
  relatedProducts: Product[];
  similarProducts: Product[];
}> {
  const { recallProductBySlug, rememberProduct, rememberProducts } = await import(
    "./product-cache"
  );

  try {
    const data = await request<{
      product: Product;
      relatedProducts: Product[];
      similarProducts: Product[];
    }>(`/api/products/by-slug/${encodeURIComponent(slug)}`);
    rememberProduct(data.product);
    rememberProducts(data.relatedProducts);
    rememberProducts(data.similarProducts);
    return data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    // Prod may not have /by-slug yet (Next returns HTML 404 / Request failed (404))
    if (!/404|not found/i.test(msg)) throw e;
  }

  const cached = recallProductBySlug(slug);
  if (cached) {
    const pool = await fetchCatalogPool();
    return {
      product: cached,
      relatedProducts: pickRelated(pool, cached),
      similarProducts: pickSimilar(pool, cached),
    };
  }

  const pool = await fetchCatalogPool();
  const product = pool.find((p) => p.slug === slug);
  if (!product) {
    throw new Error("Product not found");
  }
  rememberProduct(product);
  return {
    product,
    relatedProducts: pickRelated(pool, product),
    similarProducts: pickSimilar(pool, product),
  };
}

async function fetchCatalogPool(): Promise<Product[]> {
  const { rememberProducts } = await import("./product-cache");
  const all: Product[] = [];
  for (let page = 1; page <= 8; page++) {
    const data = await request<ProductsResponse>(
      `/api/products?limit=50&page=${page}&sort=best`
    );
    const batch = data.products || [];
    rememberProducts(batch);
    all.push(...batch);
    if (batch.length < 50 || all.length >= (data.total || 0)) break;
  }
  return all;
}

function pickRelated(pool: Product[], product: Product): Product[] {
  const cat = product.category?.slug;
  return pool
    .filter((p) => p.id !== product.id && (!cat || p.category?.slug === cat))
    .slice(0, 10);
}

function pickSimilar(pool: Product[], product: Product): Product[] {
  const brand = product.brand?.trim();
  if (!brand) return [];
  return pool
    .filter((p) => p.id !== product.id && p.brand?.trim() === brand)
    .slice(0, 10);
}

export async function fetchBanners(placement?: string): Promise<Banner[]> {
  const q = placement ? `?placement=${placement}` : "";
  const data = await request<{ banners: Banner[] }>(`/api/banners${q}`);
  return data.banners || [];
}

export async function fetchCategories(tree = false): Promise<Category[]> {
  const q = tree ? "?tree=true" : "";
  const data = await request<{ categories: Category[] }>(`/api/categories${q}`);
  return data.categories || [];
}

export async function pingApi(): Promise<boolean> {
  try {
    // Prefer products: /api/health may be missing on older production deploys
    await fetchProducts("limit=1");
    return true;
  } catch {
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export async function sendLoginOtp(phone: string) {
  // Prefer app-specific route (never requires prior registration).
  // Fallbacks keep older deploys + shared website auth route working.
  const paths = [
    "/api/app/login-otp/send",
    "/api/auth/login-otp/send",
  ] as const;

  let lastError: Error | null = null;
  for (const path of paths) {
    try {
      return await request<{
        success?: boolean;
        type: "phone" | "email";
        target: string;
        devOtp?: string;
      }>(path, {
        method: "POST",
        body: JSON.stringify({ phone, accountType: "buyer" }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      lastError = e instanceof Error ? e : new Error(msg || "Could not send OTP");
      // Old live API still rejects new buyers — try next path / generic OTP
      if (/not registered|create an account|404|not found/i.test(msg)) {
        continue;
      }
      throw lastError;
    }
  }

  // Last resort: generic OTP send (no register purpose = any phone OK)
  try {
    const data = await request<{
      success?: boolean;
      type?: "phone" | "email";
      target?: string;
      message?: string;
      devOtp?: string;
    }>("/api/otp/send", {
      method: "POST",
      body: JSON.stringify({ target: phone, type: "phone" }),
    });
    return {
      success: data.success,
      type: "phone" as const,
      target: data.target || phone,
      devOtp: data.devOtp,
    };
  } catch {
    throw lastError || new Error("Could not send OTP");
  }
}

export async function verifyOtp(params: {
  target: string;
  type: "phone" | "email";
  code: string;
}) {
  return request<{ success: boolean }>("/api/otp/verify", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createAppSession(phone: string) {
  return request<{
    token: string;
    user: { id: string; phone: string; name?: string | null };
  }>("/api/app/session", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function fetchAppAddresses(token: string) {
  const data = await authedRequest<{ addresses: Address[] }>("/api/app/addresses", token);
  return data.addresses || [];
}

export async function createAppAddress(
  token: string,
  body: Omit<Address, "id" | "isDefault"> & { isDefault?: boolean }
) {
  const data = await authedRequest<{ address: Address }>("/api/app/addresses", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.address;
}

export async function createAppOrder(
  token: string,
  body: {
    addressId: string;
    paymentMethod: "COD" | "ONLINE";
    returnUrl?: string;
    items: { productId: string; quantity: number }[];
  }
) {
  return authedRequest<{
    order: Order;
    paymentSessionId?: string;
    paymentPageUrl?: string;
  }>("/api/app/orders", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAppOrders(token: string) {
  const data = await authedRequest<{ orders: Order[] }>("/api/app/orders", token);
  return data.orders || [];
}

export type OrderDetailResponse = {
  order: Order & {
    events?: {
      id: string;
      title: string;
      message?: string | null;
      createdAt: string;
    }[];
    deliveryOtpPending?: boolean;
    refundId?: string | null;
    refundStatus?: string | null;
    refundAmount?: number | null;
    refundEtaCopy?: string | null;
  };
  actions: {
    canCancel: boolean;
    canReturn: boolean;
    canReorder: boolean;
    canDownloadInvoice: boolean;
  };
};

export async function fetchAppOrder(token: string, orderId: string) {
  return authedRequest<OrderDetailResponse>(
    `/api/app/orders/${encodeURIComponent(orderId)}`,
    token
  );
}

export async function cancelAppOrder(token: string, orderId: string, reason?: string) {
  return authedRequest<{
    success: boolean;
    status: string;
    refundMessage?: string;
    refund?: { refunded?: boolean };
  }>(`/api/app/orders/${encodeURIComponent(orderId)}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      action: "cancel",
      reason: reason || "Cancelled by customer",
    }),
  });
}

export async function verifyAppPayment(token: string, orderId: string) {
  return authedRequest<{
    status: string;
    orderNumber: string;
    orderId?: string;
  }>(`/api/app/payments/cashfree/verify?order_id=${encodeURIComponent(orderId)}`, token);
}

export async function downloadAppOrderInvoice(
  token: string,
  orderId: string,
  orderNumber: string
) {
  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");
  const uri = `${API_BASE_URL}/api/app/orders/${encodeURIComponent(orderId)}/invoice`;
  const dest = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}invoice-${orderNumber}.pdf`;
  const result = await FileSystem.downloadAsync(uri, dest, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (result.status !== 200) {
    throw new Error("Invoice is not available yet. It appears after the order is shipped.");
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: `Invoice ${orderNumber}`,
    });
  }
  return result.uri;
}

export { API_BASE_URL };
