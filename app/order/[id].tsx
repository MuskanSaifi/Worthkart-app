import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { OrderTrackingProgress } from "@/components/OrderTrackingProgress";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useShop } from "@/context/ShopContext";
import {
  cancelAppOrder,
  confirmAppDelivery,
  downloadAppOrderInvoice,
  fetchAppOrder,
  requestAppReturn,
  type OrderDetailResponse,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { getTrackingHeadline, STATUS_BADGE } from "@/lib/order-status";
import { notify } from "@/lib/notify";
import { useBottomInset } from "@/lib/safe-layout";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { addToCart } = useShop();
  const bottom = useBottomInset();
  const [data, setData] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);

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

  const onConfirmDelivery = async () => {
    if (!user?.token || !order) return;
    const code = otp.replace(/\D/g, "");
    if (code.length < 4) {
      notify.error("OTP", "Enter the 4-digit delivery OTP");
      return;
    }
    setOtpLoading(true);
    try {
      await confirmAppDelivery(user.token, order.id, code);
      notify.success("Delivered", "Delivery confirmed with OTP");
      setOtp("");
      await load();
    } catch (e) {
      notify.error("OTP", e instanceof Error ? e.message : "Invalid or expired OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const onReturn = async () => {
    if (!user?.token || !order) return;
    if (returnReason.trim().length < 5) {
      notify.error("Return", "Please write a reason (min 5 characters)");
      return;
    }
    setReturnLoading(true);
    try {
      await requestAppReturn(user.token, order.id, returnReason.trim());
      notify.success("Return requested", "Seller will review your request");
      setShowReturn(false);
      setReturnReason("");
      await load();
    } catch (e) {
      notify.error("Return", e instanceof Error ? e.message : "Failed");
    } finally {
      setReturnLoading(false);
    }
  };

  const onReorder = () => {
    if (!order) return;
    let added = 0;
    for (const item of order.items) {
      if (!item.product?.id) continue;
      addToCart(item.product, item.quantity);
      added += 1;
    }
    if (!added) {
      notify.error("Reorder", "Items are no longer available");
      return;
    }
    notify.success("Added to cart", `${added} item${added > 1 ? "s" : ""} added`);
    router.push("/(tabs)/cart");
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
  const shippedItems = order.items.filter((i) => !!i.awbCode);

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Order details" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 32 + bottom }]}>
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
          {order.estimatedDeliveryAt && order.status !== "DELIVERED" && order.status !== "CANCELLED" ? (
            <Text style={styles.edd}>
              Estimated delivery:{" "}
              {new Date(order.estimatedDeliveryAt).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          ) : null}
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

          {shippedItems.length > 0 ? (
            <View style={styles.shipBox}>
              <Text style={styles.sectionTitle}>Delivery partner</Text>
              {shippedItems.map((item) => (
                <View key={item.id} style={styles.shipRow}>
                  <Text style={styles.shipName}>
                    {item.courierName || "Courier"} · AWB {item.awbCode}
                  </Text>
                  {item.trackingUrl && !item.trackingUrl.endsWith("/orders") ? (
                    <Pressable onPress={() => Linking.openURL(item.trackingUrl!)}>
                      <Text style={styles.trackLink}>Track on partner site</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {order.deliveryOtpPending ? (
            <View style={styles.otpBox}>
              <Text style={styles.otpTitle}>Confirm delivery with OTP</Text>
              <Text style={styles.otpSub}>
                Delivery partner ke aane par jo 4-digit OTP SMS/email pe aaya hai, yahan enter karein.
              </Text>
              <View style={styles.otpRow}>
                <TextInput
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="4-digit OTP"
                  placeholderTextColor={colors.muted}
                  style={styles.otpInput}
                />
                <Pressable
                  style={[styles.otpBtn, otp.length < 4 && styles.otpBtnOff]}
                  onPress={onConfirmDelivery}
                  disabled={otpLoading || otp.length < 4}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.otpBtnText}>Confirm</Text>
                  )}
                </Pressable>
              </View>
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
            const returnStatus = item.returnRequests?.[0]?.status;
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
                  {item.awbCode ? (
                    <Text style={styles.lineAwb}>
                      AWB {item.awbCode}
                      {item.courierName ? ` · ${item.courierName}` : ""}
                    </Text>
                  ) : null}
                  {returnStatus ? (
                    <Text style={styles.returnChip}>Return: {returnStatus}</Text>
                  ) : null}
                </View>
                <Text style={styles.linePrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>

          <View style={styles.actions}>
            {actions?.canDownloadInvoice ? (
              <Pressable style={styles.invoiceBtn} onPress={onInvoice} disabled={invoiceLoading}>
                {invoiceLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.invoiceText}>Tax Invoice (PDF)</Text>
                )}
              </Pressable>
            ) : null}
            {actions?.canReorder ? (
              <Pressable style={styles.invoiceBtn} onPress={onReorder}>
                <Text style={styles.invoiceText}>Reorder</Text>
              </Pressable>
            ) : null}
            {actions?.canCancel ? (
              <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={cancelLoading}>
                {cancelLoading ? (
                  <ActivityIndicator color={colors.danger} />
                ) : (
                  <Text style={styles.cancelText}>Cancel order</Text>
                )}
              </Pressable>
            ) : null}
            {actions?.canReturn ? (
              <Pressable style={styles.invoiceBtn} onPress={() => setShowReturn((v) => !v)}>
                <Text style={styles.invoiceText}>
                  {showReturn ? "Close return" : "Request return"}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {showReturn ? (
            <View style={styles.returnBox}>
              <TextInput
                value={returnReason}
                onChangeText={setReturnReason}
                placeholder="Why are you returning this order?"
                placeholderTextColor={colors.muted}
                multiline
                style={styles.returnInput}
              />
              <Pressable
                style={[styles.otpBtn, returnReason.trim().length < 5 && styles.otpBtnOff]}
                onPress={onReturn}
                disabled={returnLoading || returnReason.trim().length < 5}
              >
                {returnLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.otpBtnText}>Submit return request</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>

        {order.address ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <Text style={styles.addrName}>{order.address.name}</Text>
            <Text style={styles.addrLine}>
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
            </Text>
            <Text style={styles.addrLine}>
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </Text>
            <Text style={styles.addrLine}>{order.address.phone}</Text>
          </View>
        ) : null}

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
  date: { fontSize: 12, color: colors.muted, marginTop: 4 },
  edd: { fontSize: 12, fontWeight: "700", color: colors.primary, marginTop: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 8, marginTop: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  tracker: { marginTop: 8, marginBottom: 12 },
  shipBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  shipRow: { marginTop: 6 },
  shipName: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  trackLink: { color: colors.primary, fontSize: 12, fontWeight: "700", marginTop: 4 },
  otpBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  otpTitle: { fontWeight: "800", color: "#92400e", fontSize: 14 },
  otpSub: { color: "#b45309", fontSize: 12, marginTop: 4, lineHeight: 17 },
  otpRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" },
  otpInput: {
    width: 120,
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    backgroundColor: "#fff",
    color: colors.foreground,
  },
  otpBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 96,
  },
  otpBtnOff: { opacity: 0.45 },
  otpBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
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
  lineAwb: { fontSize: 11, color: colors.primary, marginTop: 3, fontWeight: "600" },
  returnChip: { fontSize: 11, color: "#b45309", marginTop: 3, fontWeight: "700" },
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
  actions: { marginTop: 8 },
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
  returnBox: { marginTop: 12 },
  returnInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    color: colors.foreground,
    fontSize: 13,
    marginBottom: 8,
  },
  addrName: { fontWeight: "700", fontSize: 14, color: colors.foreground },
  addrLine: { color: colors.muted, fontSize: 13, marginTop: 3, lineHeight: 18 },
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
