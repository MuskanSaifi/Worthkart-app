import { API_BASE_URL } from "./config";

type Json = Record<string, unknown>;

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new Error(`Cannot reach API at ${API_BASE_URL}`);
  }
  let data: Json = {};
  try {
    data = (await res.json()) as Json;
  } catch {
    data = {};
  }
  if (!res.ok) {
    const err = new Error((data.error as string) || `Request failed (${res.status})`) as Error & {
      code?: string;
      loginUrl?: string;
    };
    err.code = data.code as string | undefined;
    err.loginUrl = data.loginUrl as string | undefined;
    throw err;
  }
  return data as T;
}

async function sellerRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  return publicRequest<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}

export async function sendSellerLoginOtp(phone: string) {
  return publicRequest<{
    success?: boolean;
    type: "phone" | "email";
    target: string;
    devOtp?: string;
  }>("/api/auth/login-otp/send", {
    method: "POST",
    body: JSON.stringify({ phone, accountType: "seller" }),
  });
}

export async function createSellerSession(phone: string) {
  return publicRequest<{
    token: string;
    user: {
      id: string;
      email: string;
      phone?: string | null;
      name?: string | null;
      role: string;
      businessName: string;
      sellerStatus?: string | null;
    };
  }>("/api/app/seller/session", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function sendSellerRegisterOtp(target: string, type: "phone" | "email") {
  return publicRequest<{
    success?: boolean;
    message?: string;
    devOtp?: string;
    code?: string;
    loginUrl?: string;
  }>("/api/otp/send", {
    method: "POST",
    body: JSON.stringify({ target, type, purpose: "seller_register" }),
  });
}

export async function registerSellerStep1(body: {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}) {
  return publicRequest<{ success: boolean; userId: string }>("/api/seller/register", {
    method: "POST",
    body: JSON.stringify({ step: 1, ...body }),
  });
}

export async function verifySellerGst(gstin: string, panNumber?: string) {
  return publicRequest<{
    verified: boolean;
    error?: string;
    legalName?: string;
    pan?: string;
    message?: string;
  }>("/api/seller/verify-gst", {
    method: "POST",
    body: JSON.stringify({ gstin, panNumber }),
  });
}

export async function registerSellerStep2(body: Record<string, unknown>) {
  return publicRequest<{ success: boolean; profileId: string }>("/api/seller/register", {
    method: "POST",
    body: JSON.stringify({ step: 2, ...body }),
  });
}

export type SellerDashboard = {
  todo: {
    pendingOrders: number;
    downloadLabels: number;
    outOfStock: number;
    lowStock: number;
  };
  insights: {
    todayOrders: number;
    todaySales: number;
    salesChart: { date: string; sales: number; label: string }[];
  };
  setup: { steps: { id: string; label: string; done: boolean }[]; progress: number };
  seller: { businessName: string; status: string };
};

export async function fetchSellerDashboard(token: string) {
  return sellerRequest<SellerDashboard>("/api/seller/dashboard", token);
}

export type SellerOrderItem = {
  id: string;
  quantity: number;
  price: number;
  awbCode?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  labelUrl?: string | null;
  labelDownloaded?: boolean;
  shiprocketShipmentId?: string | null;
  product: {
    id: string;
    name: string;
    images?: { url: string }[];
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    paymentMethod: string;
    estimatedDeliveryAt?: string | null;
    address?: {
      name: string;
      phone: string;
      line1: string;
      city: string;
      state: string;
      pincode: string;
    };
    user?: { name: string | null };
  };
};

export async function fetchSellerOrders(token: string, status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await sellerRequest<{ orders: SellerOrderItem[] }>(`/api/seller/orders${q}`, token);
  return data.orders || [];
}

export async function updateSellerOrderStatus(
  token: string,
  orderItemId: string,
  status: string
) {
  return sellerRequest<{ success?: boolean; order?: unknown; shipment?: unknown }>(
    "/api/seller/orders",
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "update_status", orderItemId, status }),
    }
  );
}

export type SellerProduct = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  sku?: string | null;
  qcStatus?: string;
  isActive: boolean;
  images?: { url: string }[];
  category?: { name: string } | null;
};

export async function fetchSellerInventory(token: string, filter?: string) {
  const q = filter ? `?filter=${encodeURIComponent(filter)}` : "";
  const data = await sellerRequest<{ products: SellerProduct[] }>(
    `/api/seller/inventory${q}`,
    token
  );
  return data.products || [];
}

export async function updateSellerInventory(
  token: string,
  body: { productId: string; stock?: number; price?: number; mrp?: number }
) {
  return sellerRequest<{ product: SellerProduct }>("/api/seller/inventory", token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchSellerCatalog(token: string) {
  const data = await sellerRequest<{ products: SellerProduct[]; stats?: unknown }>(
    "/api/seller/catalog",
    token
  );
  return data.products || [];
}

export type SellerExtras = {
  returns: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    orderItem: {
      product: { name: string };
      quantity: number;
      price: number;
      order: { orderNumber: string };
    };
  }>;
  claims: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  notices: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
  profile: {
    id: string;
    businessName: string;
    businessType: string | null;
    status: string;
    gstNumber: string | null;
    gstVerified: boolean;
    panNumber: string | null;
    panVerified: boolean;
    bankAccount: string | null;
    bankIfsc: string | null;
    bankVerified: boolean;
    bankName: string | null;
    pickupAddress: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    rating: number;
    totalSales: number;
  };
  payments: {
    totalEarnings: number;
    pendingPayout: number;
    paidOut?: number;
    onHold?: number;
    commissionRate?: number;
    commissionPercent?: number;
    payoutSchedule?: string;
    flowHint?: string;
    items: Array<{
      id: string;
      price: number;
      quantity: number;
      netAmount?: number;
      settlementStatus?: string;
      product: { name: string };
      order: { orderNumber: string; paymentStatus: string; status: string };
    }>;
  };
};

export async function fetchSellerExtras(token: string) {
  return sellerRequest<SellerExtras>("/api/seller/extras", token);
}

export async function sellerReturnAction(
  token: string,
  returnId: string,
  status: string
) {
  return sellerRequest("/api/seller/extras", token, {
    method: "POST",
    body: JSON.stringify({ type: "return_action", returnId, status }),
  });
}

export async function createSellerClaim(
  token: string,
  title: string,
  description: string
) {
  return sellerRequest("/api/seller/extras", token, {
    method: "POST",
    body: JSON.stringify({ type: "claim", title, description }),
  });
}

export async function downloadSellerLabel(token: string, orderItemId: string) {
  return sellerRequest<{
    success: boolean;
    labelUrl?: string;
    awbCode?: string;
    courierName?: string;
  }>("/api/seller/orders", token, {
    method: "PATCH",
    body: JSON.stringify({ action: "download_label", orderItemId }),
  });
}

