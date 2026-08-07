export const TRACKING_STEPS = [
  { key: "ordered", label: "Ordered" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
] as const;

const STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PACKED: 1,
  SHIPPED: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  RETURNED: -1,
};

export function getTrackingStepIndex(status: string): number {
  const rank = STATUS_RANK[status];
  if (rank === undefined || rank < 0) return 0;
  if (rank <= 1) return 0;
  if (rank === 2) return 1;
  if (rank === 3) return 2;
  return 3;
}

export function getTrackingHeadline(
  status: string,
  estimatedDeliveryAt?: string | Date | null
): string {
  const edd =
    estimatedDeliveryAt != null
      ? new Date(estimatedDeliveryAt).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : null;

  switch (status) {
    case "PENDING":
      return "Payment pending";
    case "CONFIRMED":
    case "PACKED":
      return edd ? `Arriving by ${edd}` : "Order placed";
    case "SHIPPED":
      return edd ? `Arriving by ${edd}` : "Shipped";
    case "OUT_FOR_DELIVERY":
      return edd ? `Arriving today · EDD ${edd}` : "Arriving today";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    case "RETURNED":
      return "Returned";
    default:
      return "Order placed";
  }
}

export const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#b45309" },
  CONFIRMED: { bg: "#dbeafe", text: "#1d4ed8" },
  PACKED: { bg: "#e0e7ff", text: "#4338ca" },
  SHIPPED: { bg: "#f3e8ff", text: "#7e22ce" },
  OUT_FOR_DELIVERY: { bg: "#ffedd5", text: "#c2410c" },
  DELIVERED: { bg: "#dcfce7", text: "#15803d" },
  CANCELLED: { bg: "#fee2e2", text: "#b91c1c" },
  RETURNED: { bg: "#f3f4f6", text: "#4b5563" },
};
