import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { OrderTrackingProgress } from "@/components/OrderTrackingProgress";
import { colors } from "@/constants/theme";
import { formatPrice } from "@/lib/format";
import { getTrackingHeadline, STATUS_BADGE } from "@/lib/order-status";
import type { Order } from "@/lib/types";

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Props = {
  order: Order;
  onDownloadInvoice?: () => void;
  invoiceLoading?: boolean;
};

export function OrderListCard({ order, onDownloadInvoice, invoiceLoading }: Props) {
  const router = useRouter();
  const badge = STATUS_BADGE[order.status] || { bg: "#f3f4f6", text: "#4b5563" };
  const headline = getTrackingHeadline(order.status, order.estimatedDeliveryAt);
  const refundHint =
    order.status === "CANCELLED" && order.paymentStatus === "REFUNDED"
      ? "Refund in progress / completed"
      : order.status === "CANCELLED" && order.paymentStatus === "PAID"
        ? "Refund pending"
        : null;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.card} onPress={() => router.push(`/order/${order.id}`)}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNo}>{order.orderNumber}</Text>
          <Text style={styles.date}>{formatOrderDate(order.createdAt)}</Text>
          {refundHint ? <Text style={styles.refundHint}>{refundHint}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]} numberOfLines={1}>
              {headline}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={12} color={colors.muted} />
        </View>
      </View>

      {order.status !== "CANCELLED" && order.status !== "RETURNED" ? (
        <View style={styles.tracker}>
          <OrderTrackingProgress
            status={order.status}
            estimatedDeliveryAt={order.estimatedDeliveryAt}
            showHeadline={false}
          />
        </View>
      ) : null}

      {order.items.map((item, index) => {
        const img = item.product.images?.[0]?.url;
        return (
          <View
            key={item.id || `${order.id}-${index}`}
            style={[styles.line, index === 0 && styles.lineFirst]}
          >
            <View style={styles.thumb}>
              {img ? (
                <Image source={{ uri: img }} style={styles.thumbImg} contentFit="contain" />
              ) : (
                <View style={styles.thumbPlaceholder} />
              )}
            </View>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.lineQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.linePrice}>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        );
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
      </View>
      </Pressable>

      {order.canDownloadInvoice && onDownloadInvoice ? (
        <Pressable
          style={styles.invoiceBtn}
          onPress={onDownloadInvoice}
          disabled={invoiceLoading}
        >
          {invoiceLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.invoiceBtnText}>Download Tax Invoice (PDF)</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "52%" },
  orderNo: { fontSize: 14, fontWeight: "800", color: colors.foreground },
  date: { fontSize: 11, color: colors.muted, marginTop: 2 },
  refundHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  tracker: { marginTop: 12, marginBottom: 8 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  lineFirst: { borderTopWidth: 0, paddingTop: 4 },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbPlaceholder: { flex: 1, backgroundColor: "#f3f4f6" },
  lineInfo: { flex: 1, minWidth: 0 },
  lineName: { fontSize: 13, color: colors.foreground },
  lineQty: { fontSize: 11, color: colors.muted, marginTop: 2 },
  linePrice: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 13, color: colors.muted },
  totalValue: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  invoiceBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  invoiceBtnText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
});
