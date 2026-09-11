import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { BottomDock } from "@/components/BottomDock";
import { useAuth } from "@/context/AuthContext";
import { useShop } from "@/context/ShopContext";
import { formatPrice } from "@/lib/format";
import { API_BASE_URL, createAppAddress, createAppOrder, fetchAppAddresses } from "@/lib/api";
import type { Address } from "@/lib/types";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { useBottomInset } from "@/lib/safe-layout";

/** Phone cannot open localhost — rewrite to the LAN API host the app already uses. */
function toPhoneReachableUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      const api = new URL(API_BASE_URL);
      parsed.protocol = api.protocol;
      parsed.host = api.host;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function buildAppReturnUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/checkout-return`;
  }
  return Linking.createURL("checkout-return");
}

function buildPaymentReturnUrl() {
  const appReturn = buildAppReturnUrl();
  const base = `${API_BASE_URL}/app-pay/return`;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}app_return=${encodeURIComponent(appReturn)}`;
}
export default function CheckoutScreen() {
  const router = useRouter();
  const bottom = useBottomInset();
  const { isLoggedIn, ready, user, logout } = useAuth();
  const { cart, cartTotal, clearCart } = useShop();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("ONLINE");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);

  const handleSessionExpired = async (message?: string) => {
    notify.error("Session expired", message || "Please login again to continue");
    await logout();
    router.replace("/login?returnTo=checkout");
  };

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/login?returnTo=checkout");
    }
  }, [ready, isLoggedIn, router]);

  useEffect(() => {
    if (!user?.token) return;
    setLoadingAddresses(true);
    fetchAppAddresses(user.token)
      .then((list) => {
        setAddresses(list);
        const def = list.find((item) => item.isDefault);
        if (def) setSelectedAddress(def.id);
      })
      .catch(async (e) => {
        const msg = e instanceof Error ? e.message : "Could not load";
        if (/session expired|unauthorized/i.test(msg)) {
          await handleSessionExpired(msg);
          return;
        }
        notify.error("Addresses", msg);
      })
      .finally(() => setLoadingAddresses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.phone) setPhone(user.phone);
  }, [user?.name, user?.phone]);

  const shipping = cartTotal > 499 ? 0 : 40;
  const grandTotal = useMemo(() => cartTotal + shipping, [cartTotal, shipping]);

  const saveAddress = async () => {
    const cleanedPhone = phone.replace(/\D/g, "").slice(-10);
    if (
      !user?.token ||
      !name.trim() ||
      cleanedPhone.length !== 10 ||
      !line1.trim() ||
      !city.trim() ||
      !state.trim() ||
      pincode.trim().length !== 6
    ) {
      notify.error("Missing details", "Please complete name, phone, address, city, state and pincode");
      return;
    }
    setSavingAddress(true);
    try {
      const address = await createAppAddress(user.token, {
        name: name.trim(),
        phone: cleanedPhone,
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
      setAddresses((prev) => {
        const next = prev.map((item) => ({ ...item, isDefault: false }));
        return [address, ...next];
      });
      setSelectedAddress(address.id);
      setLine1("");
      setLine2("");
      setCity("");
      setState("");
      setPincode("");
      notify.success("Address saved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save address";
      if (/session expired|unauthorized/i.test(msg)) {
        await handleSessionExpired(msg);
        return;
      }
      notify.error("Address", msg);
    } finally {
      setSavingAddress(false);
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      notify.error("Empty cart", "Add products before checkout");
      return;
    }
    if (!selectedAddress || !user?.token) {
      notify.error("Address required", "Please select or save a delivery address");
      return;
    }
    setPlacing(true);
    try {
      const order = await createAppOrder(user.token, {
        addressId: selectedAddress,
        paymentMethod,
        returnUrl: buildPaymentReturnUrl(),
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      });

      if (paymentMethod === "COD") {
        clearCart();
        notify.success("Order placed", order.order.orderNumber);
        router.replace("/(tabs)/orders");
        return;
      }

      if (!order.paymentPageUrl) {
        throw new Error("Payment gateway did not start");
      }

      const paymentUrl = toPhoneReachableUrl(order.paymentPageUrl);

      if (Platform.OS === "web") {
        // Same-tab open so Cashfree JS SDK / redirects work (popup often breaks session)
        if (typeof window !== "undefined") {
          window.location.assign(paymentUrl);
          return;
        }
      }

      await WebBrowser.openBrowserAsync(paymentUrl, {
        dismissButtonStyle: "close",
        enableBarCollapsing: false,
      });
      router.replace(`/checkout-return?order_id=${encodeURIComponent(order.order.orderNumber)}`);
    } catch (e) {
      notify.error("Checkout", e instanceof Error ? e.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!ready || !isLoggedIn) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="Checkout" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Checkout" />
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + bottom }]}
        ListHeaderComponent={
          <>
        <View style={styles.card}>
          <Text style={styles.label}>Logged in as</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Saved addresses</Text>
          {loadingAddresses ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
          ) : addresses.length === 0 ? (
            <Text style={styles.emptyText}>No saved addresses yet. Add one below.</Text>
          ) : (
            addresses.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.addressCard, selectedAddress === item.id && styles.addressCardActive]}
                onPress={() => setSelectedAddress(item.id)}
              >
                <Text style={styles.addressTitle}>
                  {item.name} · {item.phone}
                </Text>
                <Text style={styles.addressText}>
                  {item.line1}
                  {item.line2 ? `, ${item.line2}` : ""}, {item.city}, {item.state} - {item.pincode}
                </Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Add address</Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="House / Flat / Landmark"
            placeholderTextColor={colors.muted}
            value={line1}
            onChangeText={setLine1}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Area / Locality"
            placeholderTextColor={colors.muted}
            value={line2}
            onChangeText={setLine2}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor={colors.muted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor={colors.muted}
            value={city}
            onChangeText={setCity}
          />
          <TextInput
            style={styles.input}
            placeholder="State"
            placeholderTextColor={colors.muted}
            value={state}
            onChangeText={setState}
          />
          <TextInput
            style={styles.input}
            placeholder="Pincode"
            placeholderTextColor={colors.muted}
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <Pressable style={styles.secondaryBtn} onPress={saveAddress} disabled={savingAddress}>
            {savingAddress ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryBtnText}>Save Address</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Payment method</Text>
          <View style={styles.paymentRow}>
            {(["ONLINE", "COD"] as const).map((method) => (
              <Pressable
                key={method}
                style={[styles.methodCard, paymentMethod === method && styles.methodCardActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.methodTitle, paymentMethod === method && styles.methodTitleActive]}>
                  {method === "ONLINE" ? "Pay Online" : "Cash on Delivery"}
                </Text>
                <Text style={styles.methodHint}>
                  {method === "ONLINE"
                    ? "Secure pay to WorthKart · UPI / Card / NetBanking (Cashfree)"
                    : "Pay cash to courier when delivered"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Order summary</Text>
          <View style={[styles.line, styles.totalRow]}>
            <Text style={styles.lineName}>Items total</Text>
            <Text style={styles.linePrice}>{formatPrice(cartTotal)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineName}>Delivery</Text>
            <Text style={styles.linePrice}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</Text>
          </View>
          <View style={[styles.line, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand total</Text>
            <Text style={styles.totalValue}>{formatPrice(grandTotal)}</Text>
          </View>
        </View>
          </>
        }
        renderItem={({ item: line }) => (
          <View style={styles.orderLine}>
            <Text style={styles.lineName} numberOfLines={1}>
              {line.product.name} × {line.quantity}
            </Text>
            <Text style={styles.linePrice}>{formatPrice(line.product.price * line.quantity)}</Text>
          </View>
        )}
      />

      <BottomDock>
        <Pressable style={styles.btn} onPress={placeOrder} disabled={placing || cart.length === 0 || !selectedAddress}>
          {placing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.btnText}>
              {cart.length === 0
                ? "Cart is empty"
                : paymentMethod === "ONLINE"
                  ? `Pay ${formatPrice(grandTotal)}`
                  : `Place order ${formatPrice(grandTotal)}`}
            </Text>
          )}
        </Pressable>
      </BottomDock>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.background,
  },
  addressCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#f5f3ff",
  },
  addressTitle: { fontWeight: "700", color: colors.foreground, marginBottom: 4 },
  addressText: { color: colors.muted, lineHeight: 18, fontSize: 12 },
  label: { color: colors.muted, fontSize: 12 },
  phone: { marginTop: 4, fontWeight: "800", fontSize: 16, color: colors.foreground },
  section: { fontWeight: "800", marginBottom: 12, color: colors.foreground },
  emptyText: { color: colors.muted, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.primary, fontWeight: "800" },
  paymentRow: { gap: 10 },
  methodCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#f5f3ff",
  },
  methodTitle: { fontWeight: "700", color: colors.foreground },
  methodTitleActive: { color: colors.primary },
  methodHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  orderLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  lineName: { flex: 1, color: colors.foreground, fontSize: 13 },
  linePrice: { fontWeight: "700", color: colors.foreground },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontWeight: "800", color: colors.foreground },
  totalValue: { fontWeight: "800", fontSize: 16, color: colors.primary },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});
