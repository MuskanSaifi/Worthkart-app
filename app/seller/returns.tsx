import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  fetchSellerExtras,
  sellerReturnAction,
  type SellerExtras,
} from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerReturnsScreen() {
  const { seller } = useSeller();
  const [items, setItems] = useState<SellerExtras["returns"]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const data = await fetchSellerExtras(seller.token);
      setItems(data.returns || []);
    } catch (e) {
      notify.error("Returns", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const act = async (id: string, status: string) => {
    if (!seller?.token) return;
    setBusy(id + status);
    try {
      await sellerReturnAction(seller.token, id, status);
      notify.success("Updated", status);
      await load();
    } catch (e) {
      notify.error("Action", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy("");
    }
  };

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Returns" subtitle="Manage return requests" />
      {loading && items.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No return requests</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.orderItem.product.name}
                </Text>
                <Text style={styles.badge}>{item.status}</Text>
              </View>
              <Text style={styles.meta}>
                {item.orderItem.order.orderNumber} ·{" "}
                {formatPrice(item.orderItem.price * item.orderItem.quantity)}
              </Text>
              <Text style={styles.reason}>Reason: {item.reason}</Text>
              {item.status === "PENDING" ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.approve}
                    disabled={!!busy}
                    onPress={() => act(item.id, "APPROVED")}
                  >
                    <Text style={styles.approveText}>
                      {busy === item.id + "APPROVED" ? "…" : "Approve"}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.complete}
                    disabled={!!busy}
                    onPress={() => act(item.id, "COMPLETED")}
                  >
                    <Text style={styles.completeText}>
                      {busy === item.id + "COMPLETED" ? "…" : "Complete"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
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
    padding: 14,
    marginBottom: 10,
  },
  top: { flexDirection: "row", gap: 8 },
  name: { flex: 1, fontWeight: "800", color: colors.foreground },
  badge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#a16207",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  meta: { color: colors.muted, fontSize: 12, marginTop: 6 },
  reason: { color: colors.foreground, fontSize: 13, marginTop: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  approve: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  approveText: { color: "#fff", fontWeight: "800" },
  complete: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  completeText: { color: colors.foreground, fontWeight: "700" },
});
