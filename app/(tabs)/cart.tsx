import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";

export default function CartScreen() {
  const router = useRouter();
  const { cart, cartTotal, updateQty, removeFromCart, clearCart } = useShop();
  const { isLoggedIn, ready } = useAuth();
  const confirm = useConfirm();

  const onCheckout = () => {
    if (!ready) return;
    if (isLoggedIn) {
      router.push("/checkout");
      return;
    }
    router.push("/login?returnTo=checkout");
  };

  return (
    <View style={styles.page}>
      <AppHeader showSearch={false} title={`My Cart (${cart.length})`} />

      {cart.length === 0 ? (
        <View style={styles.emptyWrap}>
          <FontAwesome name="shopping-cart" size={42} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add products from home or search to continue.</Text>
          <Link href="/(tabs)" asChild>
            <Pressable style={styles.shopBtn}>
              <Text style={styles.shopBtnText}>Continue shopping</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 24 }]}>
            {cart.map((line) => {
              const img = line.product.images?.[0]?.url;
              return (
                <View key={line.product.id} style={styles.card}>
                  <Link href={`/product/${line.product.slug}`} asChild>
                    <Pressable>
                      {img ? (
                        <Image source={{ uri: img }} style={styles.image} contentFit="contain" />
                      ) : (
                        <View style={[styles.image, styles.placeholder]} />
                      )}
                    </Pressable>
                  </Link>
                  <View style={styles.info}>
                    <Text numberOfLines={2} style={styles.name}>
                      {line.product.name}
                    </Text>
                    <Text style={styles.price}>{formatPrice(line.product.price)}</Text>
                    <View style={styles.qtyRow}>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => updateQty(line.product.id, line.quantity - 1)}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </Pressable>
                      <Text style={styles.qty}>{line.quantity}</Text>
                      <Pressable
                        style={styles.qtyBtn}
                        onPress={() => updateQty(line.product.id, line.quantity + 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => removeFromCart(line.product.id)}
                        style={styles.remove}
                      >
                        <FontAwesome name="trash-o" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
            <Pressable
              onPress={async () => {
                const ok = await confirm("Remove all items from your cart?", {
                  title: "Clear cart?",
                  confirmLabel: "Clear",
                  destructive: true,
                });
                if (ok) clearCart();
              }}
            >
              <Text style={styles.clear}>Clear cart</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <View>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{formatPrice(cartTotal)}</Text>
            </View>
            <Pressable style={styles.checkout} onPress={onCheckout}>
              <Text style={styles.checkoutText}>
                {isLoggedIn ? "Checkout" : "Login & Checkout"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  emptyTitle: { marginTop: 14, fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptySub: { marginTop: 8, color: colors.muted, textAlign: "center", lineHeight: 20 },
  shopBtn: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: { color: colors.white, fontWeight: "700" },
  list: { padding: 14, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  image: { width: 88, height: 88, borderRadius: 8, backgroundColor: "#fafafa" },
  placeholder: { backgroundColor: "#eee" },
  info: { flex: 1 },
  name: { fontWeight: "600", color: colors.foreground, lineHeight: 18 },
  price: { marginTop: 6, fontWeight: "800", fontSize: 16, color: colors.foreground },
  qtyRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  qty: { minWidth: 20, textAlign: "center", fontWeight: "700" },
  remove: { marginLeft: "auto", padding: 6 },
  clear: { textAlign: "center", color: colors.danger, fontWeight: "600", marginTop: 8 },
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { color: colors.muted, fontSize: 12 },
  total: { fontSize: 20, fontWeight: "800", color: colors.foreground },
  checkout: {
    backgroundColor: colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutText: { color: colors.white, fontWeight: "800" },
});
