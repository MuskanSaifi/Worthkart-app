import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSeller } from "@/context/SellerContext";
import {
  downloadSellerLabel,
  fetchSellerOrders,
  updateSellerOrderStatus,
  type SellerOrderItem,
} from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { SellerTabBar } from "@/components/SellerTabBar";

const FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

const NEXT: Record<string, { status: string; label: string }> = {
  CONFIRMED: { status: "PACKED", label: "Mark Packed" },
  PACKED: { status: "SHIPPED", label: "Mark Shipped" },
  SHIPPED: { status: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Payment pending",
  CONFIRMED: "Order placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

function statusStyle(status: string) {
  switch (status) {
    case "PENDING":
      return { bg: "#fef9c3", fg: "#a16207" };
    case "CONFIRMED":
      return { bg: "#dbeafe", fg: "#1d4ed8" };
    case "PACKED":
      return { bg: "#e0e7ff", fg: "#4338ca" };
    case "SHIPPED":
      return { bg: "#ede9fe", fg: "#6d28d9" };
    case "OUT_FOR_DELIVERY":
      return { bg: "#ffedd5", fg: "#c2410c" };
    case "DELIVERED":
      return { bg: "#dcfce7", fg: "#15803d" };
    case "CANCELLED":
    case "RETURNED":
      return { bg: "#fee2e2", fg: "#b91c1c" };
    default:
      return { bg: "#f3f4f6", fg: "#4b5563" };
  }
}

function formatEdd(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { seller } = useSeller();
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState<SellerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const list = await fetchSellerOrders(seller.token, filter || undefined);
      setItems(list);
    } catch (e) {
      notify.error("Orders", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token, filter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const actionCount = useMemo(
    () =>
      items.filter(
        (i) =>
          !!NEXT[i.order.status] &&
          i.order.status !== "CANCELLED" &&
          i.order.status !== "RETURNED"
      ).length,
    [items]
  );

  const advance = async (item: SellerOrderItem) => {
    const next = NEXT[item.order.status];
    if (!next || !seller?.token) return;
    setBusyId(item.id);
    try {
      await updateSellerOrderStatus(seller.token, item.id, next.status);
      notify.success("Updated", next.label);
      await load();
    } catch (e) {
      notify.error("Status", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId("");
    }
  };

  const onLabel = async (item: SellerOrderItem) => {
    if (!seller?.token) return;
    setBusyId(`label-${item.id}`);
    try {
      const res = await downloadSellerLabel(seller.token, item.id);
      if (res.labelUrl) {
        const url = res.labelUrl.startsWith("http")
          ? res.labelUrl
          : res.labelUrl;
        await Linking.openURL(url);
      }
      notify.success(
        "Label",
        res.awbCode ? `AWB ${res.awbCode}` : "Label ready"
      );
      setItems((prev) =>
        prev.map((o) =>
          o.id === item.id
            ? {
                ...o,
                labelDownloaded: true,
                awbCode: res.awbCode ?? o.awbCode,
                courierName: res.courierName ?? o.courierName,
                labelUrl: res.labelUrl ?? o.labelUrl,
              }
            : o
        )
      );
    } catch (e) {
      notify.error("Label", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId("");
    }
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Orders</Text>
            <Text style={styles.sub}>Manage and fulfill customer orders</Text>
          </View>
          {actionCount > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{actionCount} action</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <Pressable
                key={f.key || "all"}
                onPress={() => setFilter(f.key)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <FontAwesome name="cube" size={28} color="#d1d5db" />
              </View>
              <Text style={styles.empty}>No orders found</Text>
              <Text style={styles.emptySub}>
                Try another filter or pull to refresh
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const next = NEXT[item.order.status];
            const img = item.product.images?.[0]?.url;
            const st = statusStyle(item.order.status);
            const edd = formatEdd(item.order.estimatedDeliveryAt);
            const canLabel =
              !!item.awbCode ||
              item.order.status === "CONFIRMED" ||
              item.order.status === "PACKED";
            const inactive =
              item.order.status === "CANCELLED" ||
              item.order.status === "RETURNED";

            return (
              <View style={[styles.card, inactive && styles.cardInactive]}>
                <View style={styles.cardTop}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.img} />
                  ) : (
                    <View style={[styles.img, styles.imgPh]}>
                      <FontAwesome name="image" size={16} color="#c4b5fd" />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={2}>
                        {item.product.name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.badgeText, { color: st.fg }]}>
                          {STATUS_LABEL[item.order.status] || item.order.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>
                      {item.order.orderNumber} · Qty: {item.quantity} ·{" "}
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                    {item.order.address ? (
                      <Text style={styles.addr} numberOfLines={1}>
                        {item.order.address.name
                          ? `${item.order.address.name} · `
                          : ""}
                        {item.order.address.city} - {item.order.address.pincode}
                      </Text>
                    ) : null}
                    {item.awbCode ? (
                      <Text style={styles.awb}>
                        AWB: {item.awbCode}
                        {item.courierName ? ` · ${item.courierName}` : ""}
                      </Text>
                    ) : null}
                    {edd ? <Text style={styles.edd}>EDD: {edd}</Text> : null}
                    {item.order.status === "OUT_FOR_DELIVERY" ? (
                      <Text style={styles.hint}>
                        Waiting for delivery OTP — customer / courier confirms
                      </Text>
                    ) : null}
                  </View>
                </View>

                {!inactive && (next || canLabel) ? (
                  <View style={styles.actions}>
                    {next ? (
                      <Pressable
                        style={styles.action}
                        disabled={busyId === item.id}
                        onPress={() => advance(item)}
                      >
                        {busyId === item.id ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.actionText}>{next.label}</Text>
                        )}
                      </Pressable>
                    ) : null}
                    {canLabel ? (
                      <Pressable
                        style={styles.labelBtn}
                        disabled={busyId === `label-${item.id}`}
                        onPress={() => onLabel(item)}
                      >
                        {busyId === `label-${item.id}` ? (
                          <ActivityIndicator
                            color={colors.primary}
                            size="small"
                          />
                        ) : (
                          <>
                            <FontAwesome
                              name="download"
                              size={12}
                              color={colors.foreground}
                            />
                            <Text style={styles.labelText}>
                              {item.labelDownloaded
                                ? "Label again"
                                : "Download label"}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
      <SellerTabBar active="orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: { color: "#ddd6fe", fontSize: 12, marginTop: 2 },
  countPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  filterBar: {
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  chipTextOn: { color: "#fff" },
  list: { padding: 12, paddingBottom: 110 },
  emptyWrap: { alignItems: "center", marginTop: 56, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  empty: {
    textAlign: "center",
    color: colors.foreground,
    fontWeight: "800",
    fontSize: 15,
  },
  emptySub: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  cardInactive: { opacity: 0.72 },
  cardTop: { flexDirection: "row", gap: 10 },
  img: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  imgPh: { borderWidth: 1, borderColor: colors.border },
  nameRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  name: {
    flex: 1,
    fontWeight: "700",
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 18,
  },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  addr: { color: "#9ca3af", fontSize: 11, marginTop: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 120,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  awb: {
    color: colors.foreground,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  edd: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  hint: { color: "#c2410c", fontSize: 11, marginTop: 6, lineHeight: 15 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    minWidth: 120,
  },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  labelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  labelText: { color: colors.foreground, fontWeight: "700", fontSize: 12 },
});
