import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSeller } from "@/context/SellerContext";
import { fetchSellerExtras, type SellerExtras } from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { SellerTabBar } from "@/components/SellerTabBar";

export default function SellerPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { seller } = useSeller();
  const [data, setData] = useState<SellerExtras["payments"] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const extras = await fetchSellerExtras(seller.token);
      setData(extras.payments);
    } catch (e) {
      notify.error("Payments", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const commission = data?.commissionPercent ?? 10;

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Payments</Text>
        <Text style={styles.sub}>Settled after delivery · weekly payout</Text>
      </View>
      {loading && !data ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListHeaderComponent={
            <View>
              <View style={styles.hint}>
                <Text style={styles.hintTitle}>How money works</Text>
                <Text style={styles.hintBody}>
                  {data?.flowHint ||
                    `Customer pays WorthKart (Cashfree/COD). After delivery, ${commission}% commission is cut and the rest is Pending Payout.`}
                </Text>
              </View>
              <View style={styles.stats}>
                <View style={[styles.stat, styles.statHero]}>
                  <Text style={styles.statValLight}>
                    {formatPrice(data?.pendingPayout || 0)}
                  </Text>
                  <Text style={styles.statLabelLight}>Pending payout</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{formatPrice(data?.paidOut || 0)}</Text>
                  <Text style={styles.statLabel}>Paid out</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>
                    {formatPrice(data?.totalEarnings || 0)}
                  </Text>
                  <Text style={styles.statLabel}>Total earnings</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{commission}%</Text>
                  <Text style={styles.statLabel}>Commission</Text>
                </View>
                <Text style={styles.note}>
                  {data?.payoutSchedule ||
                    "Payouts every Wednesday · verify bank in Warehouse"}
                </Text>
              </View>
              <Text style={styles.section}>Settlements</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No settlements yet — they appear after orders are delivered
            </Text>
          }
          renderItem={({ item }) => {
            const amount =
              item.netAmount ?? item.price * item.quantity * (1 - commission / 100);
            const pending =
              (item.settlementStatus || "PENDING") !== "PAID";
            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.meta}>
                    {item.order.orderNumber} · Qty {item.quantity}
                  </Text>
                  <Text style={[styles.badge, pending ? styles.badgePending : styles.badgePaid]}>
                    {pending ? "Pending payout" : "Paid out"}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatPrice(amount)}</Text>
              </View>
            );
          }}
        />
      )}
      <SellerTabBar active="payments" />
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
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: { color: "#ddd6fe", fontSize: 12, marginTop: 2 },
  list: { padding: 12, paddingBottom: 110 },
  hint: {
    backgroundColor: "#f5f3ff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    padding: 12,
    marginBottom: 10,
  },
  hintTitle: { fontWeight: "800", color: colors.primary, fontSize: 13 },
  hintBody: { color: "#5b21b6", fontSize: 12, marginTop: 4, lineHeight: 17 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  stat: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statHero: {
    width: "100%",
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statVal: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  statValLight: { fontSize: 24, fontWeight: "800", color: "#fff" },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  statLabelLight: { color: "#e9d5ff", fontSize: 12, marginTop: 4 },
  note: { width: "100%", color: colors.muted, fontSize: 12, marginTop: 4 },
  section: {
    fontWeight: "800",
    color: colors.foreground,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  empty: { textAlign: "center", color: colors.muted, marginTop: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontWeight: "800", color: colors.foreground },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  badge: { fontSize: 11, fontWeight: "700", marginTop: 6 },
  badgePending: { color: "#d97706" },
  badgePaid: { color: colors.success },
  amount: { color: colors.success, fontWeight: "800" },
});
