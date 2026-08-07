import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { OrderTrackingProgress } from "@/components/OrderTrackingProgress";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import {
  cancelAppOrder,
  downloadAppOrderInvoice,
  fetchAppOrder,
  type OrderDetailResponse,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { getTrackingHeadline, STATUS_BADGE } from "@/lib/order-status";
import { notify } from "@/lib/notify";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const confirm = useConfirm();
  const [data, setData] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.token || !id) return;
    setLoading(true);
    try {
      const res = await fetchAppOrder(user.token, id);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id, user?.token]);

  useEffect(() => {
    void load();
  }, [load]);

  const order = data?.order;
  const actions = data?.actions;

  const onInvoice = async () => {
    if (!user?.token || !order) return;
    setInvoiceLoading(true);
    try {
      await downloadAppOrderInvoice(user.token, order.id, order.orderNumber);
    } catch (e) {
      notify.error("Invoice", e instanceof Error ? e.message : "Could not download");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const onCancel = async () => {
    if (!user?.token || !order) return;
    const ok = await confirm(
      order.paymentStatus === "PAID"
        ? "Cancel this order?\n\nOnline payment refund will go to your original method:\n• UPI: 1–3 business days\n• Card / Net banking: 3–5 business days"
        : "Cancel this order?",
      { title: "Cancel order", confirmLabel: "Cancel order", destructive: true }
    );
    if (!ok) return;
    setCancelLoading(true);
    try {
      const res = await cancelAppOrder(user.token, order.id);
      notify.success("Cancelled", res.refundMessage || "Order cancelled");
      await load();
    } catch (e) {
      notify.error("Cancel", e instanceof Error ? e.message : "Failed");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="Order" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="Order" />
        <Text style={styles.error}>Order not found</Text>
      </View>
    );
  }

  const badge = STATUS_BADGE[order.status] || { bg: "#f3f4f6", text: "#4b5563" };
  const headline = getTrackingHeadline(order.status, order.estimatedDeliveryAt);
  const showRefund = order.paymentStatus === "REFUNDED" || !!order.refundId;

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Order details" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.orderNo}>{order.orderNumber}</Text>
          <Text style={styles.date}>
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg, alignSelf: "flex-start" }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{headline}</Text>
          </View>

          {order.status !== "CANCELLED" && order.status !== "RETURNED" ? (
            <View style={styles.tracker}>
              <OrderTrackingProgress
                status={order.status}
                estimatedDeliveryAt={order.estimatedDeliveryAt}
              />
            </View>
          ) : null}

          {showRefund ? (
            <View style={styles.refundBox}>
              <Text style={styles.refundTitle}>
                {order.refundStatus === "SUCCESS"
                  ? "Refund completed"
                  : order.refundStatus === "FAILED"
                    ? "Refund needs attention"
                    : "Refund initiated"}
              </Text>
              {order.refundAmount != null ? (
                <Text style={styles.refundAmount}>
                  Amount: {formatPrice(order.refundAmount)}
                </Text>
              ) : null}
              <Text style={styles.refundBody}>
                Online payment cancel/return ke baad refund original payment method pe jata hai:
              </Text>
              <View style={styles.etaList}>
                <Text style={styles.etaItem}>• Debit / Credit Card — usually 3–5 business days</Text>
                <Text style={styles.etaItem}>• Net Banking — usually 3–5 business days</Text>
                <Text style={styles.etaItem}>• UPI — usually 1–3 business days</Text>
              </View>
              <Text style={styles.refundNote}>
                Important: WorthKart refund initiate ke baad bank/UPI provider ko credit mein extra time lag sakta hai.
              </Text>
              {order.refundEtaCopy ? (
                <Text style={[styles.refundBody, { marginTop: 6 }]}>{order.refundEtaCopy}</Text>
              ) : null}
            </View>
          ) : null}

          {order.items.map((item, index) => {
            const img = item.product.images?.[0]?.url;
            return (
              <View key={item.id || index} style={styles.line}>
                <View style={styles.thumb}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.thumbImg} contentFit="contain" />
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{item.product.name}</Text>
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

          {actions?.canCancel ? (
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={cancelLoading}>
              {cancelLoading ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <Text style={styles.cancelText}>Cancel order</Text>
              )}
            </Pressable>
          ) : null}

          {actions?.canDownloadInvoice ? (
            <Pressable style={styles.invoiceBtn} onPress={onInvoice} disabled={invoiceLoading}>
              {invoiceLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.invoiceText}>Download Tax Invoice (PDF)</Text>
              )}
            </Pressable>
          ) : null}
        </View>

        {order.events && order.events.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Live timeline</Text>
            {order.events.map((ev) => (
              <View key={ev.id} style={styles.event}>
                <Text style={styles.eventTitle}>{ev.title}</Text>
                {ev.message ? <Text style={styles.eventMsg}>{ev.message}</Text> : null}
                <Text style={styles.eventTime}>
                  {new Date(ev.createdAt).toLocaleString("en-IN")}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 32 },
  error: { textAlign: "center", marginTop: 40, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  orderNo: { fontSize: 16, fontWeight: "800" },
  date: { fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  tracker: { marginTop: 8, marginBottom: 12 },
  refundBox: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  refundTitle: { fontWeight: "800", color: "#065f46", fontSize: 14 },
  refundAmount: { color: "#065f46", fontWeight: "700", fontSize: 13, marginTop: 4 },
  refundBody: { color: "#047857", fontSize: 12, marginTop: 6, lineHeight: 17 },
  etaList: { marginTop: 8, gap: 4 },
  etaItem: { color: "#065f46", fontSize: 12, lineHeight: 17 },
  refundNote: {
    marginTop: 8,
    color: "#92400e",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  line: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
  },
  thumb: {
    width: 56,
    height: 56,
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    overflow: "hidden",
  },
  thumbImg: { width: "100%", height: "100%" },
  lineName: { fontSize: 13, fontWeight: "600" },
  lineQty: { fontSize: 11, color: colors.muted, marginTop: 2 },
  linePrice: { fontWeight: "700" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: { color: colors.muted },
  totalValue: { fontSize: 17, fontWeight: "800" },
  cancelBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: colors.danger, fontWeight: "800" },
  invoiceBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  invoiceText: { color: colors.primary, fontWeight: "800" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  event: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eventTitle: { fontWeight: "700", fontSize: 14 },
  eventMsg: { color: colors.muted, fontSize: 12, marginTop: 4 },
  eventTime: { color: colors.muted, fontSize: 10, marginTop: 4 },
});
