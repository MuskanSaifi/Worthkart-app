export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  discount: number;
  rating: number;
  reviewCount: number;
  brand?: string | null;
  description?: string | null;
  stock?: number;
  isFeatured?: boolean;
  isDeal?: boolean;
  images: { url: string; alt?: string | null }[];
  category?: { id?: string; name: string; slug: string };
  seller?: { businessName: string; rating?: number; status?: string } | null;
  reviews?: {
    id: string;
    rating: number;
    comment?: string | null;
    user?: { name: string | null };
  }[];
};

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  appImage?: string | null;
  link?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  ctaLabel?: string | null;
  variant?: string;
  placement: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  children?: Category[];
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  createdAt: string;
  estimatedDeliveryAt?: string | null;
  canDownloadInvoice?: boolean;
  address?: Address;
  items: {
    id: string;
    quantity: number;
    price: number;
    awbCode?: string | null;
    courierName?: string | null;
    trackingUrl?: string | null;
    product: Product;
    returnRequests?: { status: string }[];
  }[];
};
