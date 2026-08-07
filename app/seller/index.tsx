import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSeller } from "@/context/SellerContext";
import { useConfirm } from "@/context/ConfirmContext";
import { fetchSellerDashboard, type SellerDashboard } from "@/lib/seller-api";
import { SELLER_QUICK } from "@/lib/seller-nav";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { SellerTabBar } from "@/components/SellerTabBar";

export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { seller, logoutSeller } = useSeller();
  const confirm = useConfirm();
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    try {
      const d = await fetchSellerDashboard(seller.token);
      setData(d);
    } catch (e) {
      notify.error("Dashboard", e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const onLogout = async () => {
    const ok = await confirm("Logout from Seller Hub?", {
      title: "Seller logout",
      confirmLabel: "Logout",
      destructive: true,
    });
    if (!ok) return;
    await logoutSeller();
    router.replace("/seller/login");
  };

  const todo = data?.todo;
  const insights = data?.insights;
  const initial = (seller?.businessName || "S").trim().charAt(0).toUpperCase();

  const todos = useMemo(
    () =>
      [
        {
          label: "Pending orders",
          value: todo?.pendingOrders ?? 0,
          icon: "cube" as const,
          href: "/seller/orders",
          tint: "#7c3aed",
        },
        {
          label: "Labels ready",
          value: todo?.downloadLabels ?? 0,
          icon: "barcode" as const,
          href: "/seller/packaging",
          tint: "#2563eb",
        },
        {
          label: "Out of stock",
          value: todo?.outOfStock ?? 0,
          icon: "warning" as const,
          href: "/seller/inventory?filter=out",
          tint: "#dc2626",
        },
        {
          label: "Low stock",
          value: todo?.lowStock ?? 0,
          icon: "exclamation-circle" as const,
          href: "/seller/inventory?filter=low",
          tint: "#d97706",
        },
      ].sort((a, b) => b.value - a.value),
    [todo]
  );

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Namaste</Text>
          <Text style={styles.title} numberOfLines={1}>
            {seller?.businessName || "Seller"}
          </Text>
          {data?.seller?.status ? (
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.status}>{data.seller.status}</Text>
            </View>
          ) : null}
        </View>
        <Pressable
          onPress={() => router.push("/seller/notices")}
          style={styles.headerBtn}
          accessibilityLabel="Notices"
        >
          <FontAwesome name="bell" size={15} color="#fff" />
        </Pressable>
        <Pressable onPress={onLogout} style={styles.headerBtn} accessibilityLabel="Logout">
          <FontAwesome name="sign-out" size={15} color="#fecaca" />
        </Pressable>
      </View>

      {loading && !data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.metrics}>
            <View style={[styles.metricCard, styles.metricPrimary]}>
              <Text style={styles.metricEyebrow}>Today</Text>
              <Text style={styles.metricValLight}>{insights?.todayOrders ?? 0}</Text>
              <Text style={styles.metricLabelLight}>Orders</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricEyebrowDark}>Sales</Text>
              <Text style={styles.metricVal}>
                {formatPrice(insights?.todaySales ?? 0)}
              </Text>
              <Text style={styles.metricLabel}>Today</Text>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.section}>Needs attention</Text>
            <Pressable onPress={() => router.push("/seller/orders")}>
              <Text style={styles.sectionLink}>View orders</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.todoRow}
          >
            {todos.map((item) => (
              <Pressable
                key={item.label}
                style={styles.todoCard}
                onPress={() => router.push(item.href as any)}
              >
                <View style={[styles.todoIcon, { backgroundColor: `${item.tint}18` }]}>
                  <FontAwesome name={item.icon} size={14} color={item.tint} />
                </View>
                <Text style={[styles.todoVal, item.value > 0 && { color: item.tint }]}>
                  {item.value}
                </Text>
                <Text style={styles.todoLabel} numberOfLines={2}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sectionHead}>
            <Text style={styles.section}>Quick access</Text>
            <Pressable onPress={() => router.push("/seller/more")}>
              <Text style={styles.sectionLink}>All tools</Text>
            </Pressable>
          </View>
          <View style={styles.grid}>
            {SELLER_QUICK.map((item) => (
              <Pressable
                key={item.href}
                style={styles.gridItem}
                onPress={() => router.push(item.href as any)}
              >
                <View style={styles.gridIcon}>
                  <FontAwesome name={item.icon} size={18} color={colors.primary} />
                </View>
                <Text style={styles.gridLabel} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.helpCard} onPress={() => router.push("/seller/support")}>
            <View style={styles.helpIcon}>
              <FontAwesome name="life-ring" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.helpTitle}>Need help?</Text>
              <Text style={styles.helpSub}>FAQs · packing · payouts</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color={colors.muted} />
          </Pressable>
        </ScrollView>
      )}

      <SellerTabBar active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.primaryDark,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  hello: { color: "#c4b5fd", fontSize: 11, fontWeight: "700" },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 1 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#86efac",
  },
  status: { color: "#ddd6fe", fontSize: 11, fontWeight: "600" },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: 16, paddingBottom: 110 },
  metrics: { flexDirection: "row", gap: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  metricPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metricEyebrow: { color: "#e9d5ff", fontSize: 11, fontWeight: "700" },
  metricEyebrowDark: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  metricValLight: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  metricVal: { color: colors.foreground, fontSize: 22, fontWeight: "800", marginTop: 4 },
  metricLabelLight: { color: "#e9d5ff", fontSize: 12, marginTop: 2 },
  metricLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  section: { fontSize: 15, fontWeight: "800", color: colors.foreground },
  sectionLink: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  todoRow: { gap: 10, paddingRight: 8 },
  todoCard: {
    width: 118,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  todoIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  todoVal: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  todoLabel: { color: colors.muted, fontSize: 11, marginTop: 2, lineHeight: 14 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "23%",
    flexGrow: 1,
    minWidth: "22%",
    maxWidth: "24%",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  helpCard: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  helpIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  helpTitle: { fontWeight: "800", color: colors.foreground, fontSize: 14 },
  helpSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
