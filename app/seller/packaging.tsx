import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { useSeller } from "@/context/SellerContext";
import {
  downloadSellerLabel,
  fetchSellerOrders,
  type SellerOrderItem,
} from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { API_BASE_URL } from "@/lib/config";

export default function SellerPackagingScreen() {
  const { seller } = useSeller();
  const [items, setItems] = useState<SellerOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const [confirmed, packed] = await Promise.all([
        fetchSellerOrders(seller.token, "CONFIRMED"),
        fetchSellerOrders(seller.token, "PACKED"),
      ]);
      setItems([...confirmed, ...packed]);
    } catch (e) {
      notify.error("Packaging", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const download = async (item: SellerOrderItem) => {
    if (!seller?.token) return;
    setBusy(item.id);
    try {
      const res = await downloadSellerLabel(seller.token, item.id);
      const url = res.labelUrl?.startsWith("http")
        ? res.labelUrl
        : `${API_BASE_URL}${res.labelUrl || `/api/seller/labels/${item.id}`}`;
      notify.success("Label ready", res.awbCode ? `AWB ${res.awbCode}` : "Opening label");
      await Linking.openURL(url);
      await load();
    } catch (e) {
      notify.error("Label", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Barcoded Packaging" subtitle="Download shipping labels" />
      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No labels pending</Text>}
          renderItem={({ item }) => {
            const img = item.product.images?.[0]?.url;
            return (
              <View style={styles.card}>
                <View style={styles.row}>
                  {img ? <Image source={{ uri: img }} style={styles.img} /> : <View style={styles.img} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.order}>#{item.order.orderNumber}</Text>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.meta}>
                      Qty {item.quantity} · {formatPrice(item.price * item.quantity)} ·{" "}
                      {item.order.status}
                    </Text>
                    {item.awbCode ? <Text style={styles.awb}>AWB {item.awbCode}</Text> : null}
                  </View>
                </View>
                <Pressable
                  style={styles.btn}
                  disabled={busy === item.id}
                  onPress={() => download(item)}
                >
                  <Text style={styles.btnText}>
                    {busy === item.id ? "Preparing…" : "Download label"}
                  </Text>
                </Pressable>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  img: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#f3e8ff" },
  order: { fontSize: 11, fontWeight: "800", color: colors.primary },
  name: { fontWeight: "700", color: colors.foreground, marginTop: 2, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  awb: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  btn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
