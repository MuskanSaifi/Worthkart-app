import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { useSeller } from "@/context/SellerContext";
import {
  fetchSellerExtras,
  fetchSellerInventory,
  type SellerProduct,
} from "@/lib/seller-api";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerQualityScreen() {
  const { seller } = useSeller();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [sellerRating, setSellerRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const [list, extras] = await Promise.all([
        fetchSellerInventory(seller.token),
        fetchSellerExtras(seller.token),
      ]);
      setProducts(list);
      setSellerRating(extras.profile?.rating || 0);
    } catch (e) {
      notify.error("Quality", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const stats = useMemo(
    () => ({
      rating: sellerRating,
      listings: products.length,
      active: products.filter((p) => p.isActive).length,
    }),
    [products, sellerRating]
  );

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Quality" subtitle="Ratings overview" />
      {loading && products.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListHeaderComponent={
            <View style={styles.stats}>
              <Stat
                label="Seller rating"
                value={stats.rating ? stats.rating.toFixed(1) : "—"}
              />
              <Stat label="Listings" value={String(stats.listings)} />
              <Stat label="Active" value={String(stats.active)} />
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>No products</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.rating}>
                <FontAwesome name="cube" size={12} color={colors.primary} />
                <Text style={styles.ratingText}>
                  Stock {item.stock} · QC {item.qcStatus || "—"}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12, paddingBottom: 40 },
  stats: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  statVal: { fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 4 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontWeight: "800", color: colors.foreground },
  rating: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  ratingText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
});
