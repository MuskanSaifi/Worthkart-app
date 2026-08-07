import type FontAwesome from "@expo/vector-icons/FontAwesome";

export type SellerIcon = React.ComponentProps<typeof FontAwesome>["name"];

export type SellerNavItem = {
  label: string;
  href: string;
  icon: SellerIcon;
  sub: string;
};

/** Daily tools — shown as Home icon grid */
export const SELLER_QUICK: SellerNavItem[] = [
  { label: "Orders", href: "/seller/orders", icon: "cube", sub: "Fulfill" },
  { label: "Returns", href: "/seller/returns", icon: "reply", sub: "Returns" },
  { label: "Pricing", href: "/seller/pricing", icon: "tag", sub: "Prices" },
  { label: "Stock", href: "/seller/inventory", icon: "archive", sub: "Inventory" },
  { label: "Labels", href: "/seller/packaging", icon: "barcode", sub: "Packaging" },
  { label: "Payments", href: "/seller/payments", icon: "credit-card", sub: "Payouts" },
  { label: "Catalog", href: "/seller/products", icon: "th-large", sub: "Listings" },
  { label: "Claims", href: "/seller/claims", icon: "exclamation-circle", sub: "Claims" },
];

export const SELLER_MORE_GROUPS: { title: string; items: SellerNavItem[] }[] = [
  {
    title: "Orders & fulfillment",
    items: [
      { label: "Orders", href: "/seller/orders", icon: "cube", sub: "Pack · ship · labels" },
      { label: "Returns", href: "/seller/returns", icon: "reply", sub: "Approve customer returns" },
      { label: "Barcoded Packaging", href: "/seller/packaging", icon: "barcode", sub: "Download shipping labels" },
      { label: "Claims", href: "/seller/claims", icon: "exclamation-circle", sub: "File & track claims" },
    ],
  },
  {
    title: "Catalog & stock",
    items: [
      { label: "Inventory", href: "/seller/inventory", icon: "archive", sub: "Stock levels" },
      { label: "Pricing", href: "/seller/pricing", icon: "tag", sub: "MRP & selling price" },
      { label: "Catalog Uploads", href: "/seller/products", icon: "upload", sub: "Listings & QC" },
      { label: "Quality", href: "/seller/quality", icon: "star", sub: "Ratings overview" },
    ],
  },
  {
    title: "Money & warehouse",
    items: [
      { label: "Payments", href: "/seller/payments", icon: "credit-card", sub: "Earnings & payouts" },
      { label: "Warehouse", href: "/seller/warehouse", icon: "map-marker", sub: "Pickup address & KYC" },
      { label: "Services", href: "/seller/services", icon: "wrench", sub: "Seller tools & tips" },
    ],
  },
  {
    title: "Help",
    items: [
      { label: "Notices", href: "/seller/notices", icon: "bell", sub: "Platform updates" },
      { label: "Support", href: "/seller/support", icon: "life-ring", sub: "Help & FAQs" },
    ],
  },
];
