import { Link, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppHeader } from "@/components/AppHeader";
import { OrderListCard } from "@/components/OrderListCard";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { downloadAppOrderInvoice, fetchAppOrders } from "@/lib/api";
import { notify } from "@/lib/notify";
import type { Order } from "@/lib/types";

export default function OrdersTabScreen() {
  const { isLoggedIn, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.token) return;
      setLoading(true);
      fetchAppOrders(user.token)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }, [user?.token])
  );

  const onDownloadInvoice = async (order: Order) => {
    if (!user?.token) return;
    setInvoiceOrderId(order.id);
    try {
      await downloadAppOrderInvoice(user.token, order.id, order.orderNumber);
    } catch (e) {
      notify.error("Invoice", e instanceof Error ? e.message : "Could not download invoice");
    } finally {
      setInvoiceOrderId(null);
    }
  };

  return (
    <View style={styles.page}>
      <AppHeader showSearch={false} title="My Orders" />
      {!isLoggedIn ? (
        <View style={styles.body}>
          <FontAwesome name="cube" size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
          <Text style={styles.title}>Login to see orders</Text>
          <Text style={styles.sub}>
            Login once with OTP — next time checkout won’t ask for number again.
          </Text>
          <Link href="/login?returnTo=orders" asChild>
            <Pressable style={styles.btn}>
              <Text style={styles.btnText}>Login to track orders</Text>
            </Pressable>
          </Link>
        </View>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={orders.length === 0 ? styles.body : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="cube" size={56} color="#d1d5db" />
              <Text style={styles.title}>No orders yet</Text>
              <Text style={styles.sub}>Place an order from cart to see it here.</Text>
              <Link href="/(tabs)" asChild>
                <Pressable style={styles.linkBtn}>
                  <Text style={styles.linkBtnText}>Start shopping</Text>
                </Pressable>
              </Link>
            </View>
          }
          renderItem={({ item }) => (
            <OrderListCard
              order={item}
              onDownloadInvoice={
                item.canDownloadInvoice ? () => onDownloadInvoice(item) : undefined
              }
              invoiceLoading={invoiceOrderId === item.id}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  body: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  empty: { alignItems: "center", paddingVertical: 24 },
  list: { padding: 14, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: "800", color: colors.foreground, marginTop: 12 },
  sub: {
    marginTop: 10,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    fontSize: 13,
  },
  btn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: colors.white, fontWeight: "700" },
  linkBtn: { marginTop: 14 },
  linkBtnText: { color: colors.primary, fontWeight: "700" },
});
