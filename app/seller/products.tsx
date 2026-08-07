import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { useSeller } from "@/context/SellerContext";
import { fetchSellerCatalog, type SellerProduct } from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerProductsScreen() {
  const { seller } = useSeller();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      setProducts(await fetchSellerCatalog(seller.token));
    } catch (e) {
      notify.error("Catalog", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.page}>
      <SellerScreenHeader
        title="Catalog"
        subtitle="QC status · Add new on website"
      />

      {loading && products.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No products yet</Text>}
          ListFooterComponent={
            <Text style={styles.hint}>
              New listings & bulk upload: worthkart.in/seller/products/new
            </Text>
          }
          renderItem={({ item }) => {
            const img = item.images?.[0]?.url;
            return (
              <View style={styles.card}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.imgPh]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta}>
                    {formatPrice(item.price)} · Stock {item.stock}
                  </Text>
                  {item.category?.name ? (
                    <Text style={styles.cat}>{item.category.name}</Text>
                  ) : null}
                </View>
                <View style={styles.qc}>
                  <Text style={styles.qcText}>{item.qcStatus || "—"}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  hint: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 11,
    marginTop: 16,
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  img: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#f3e8ff" },
  imgPh: {},
  name: { fontWeight: "700", color: colors.foreground, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cat: { color: colors.primary, fontSize: 11, marginTop: 4, fontWeight: "600" },
  qc: {
    alignSelf: "flex-start",
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 90,
  },
  qcText: { fontSize: 9, fontWeight: "800", color: colors.primary },
});