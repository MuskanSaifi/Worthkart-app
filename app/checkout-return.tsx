import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useShop } from "@/context/ShopContext";
import { verifyAppPayment } from "@/lib/api";

export default function CheckoutReturnScreen() {
  const router = useRouter();
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();
  const { user } = useAuth();
  const { clearCart } = useShop();
  const [status, setStatus] = useState<"loading" | "PAID" | "PENDING" | "FAILED">("loading");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (!order_id || !user?.token) {
      setStatus("FAILED");
      return;
    }
    let cancelled = false;

    const verify = async (attempt = 0): Promise<void> => {
      try {
        const data = await verifyAppPayment(user.token, order_id);
        if (cancelled) return;
        setOrderNumber(data.orderNumber || order_id);
        if (data.status === "PAID") {
          clearCart();
          setStatus("PAID");
          return;
        }
        if (data.status === "EXPIRED" || data.status === "TERMINATED" || data.status === "FAILED") {
          setStatus("FAILED");
          return;
        }
        if (attempt < 5) {
          setStatus("PENDING");
          setTimeout(() => void verify(attempt + 1), 2000);
          return;
        }
        setStatus("PENDING");
      } catch {
        if (attempt < 3) {
          setTimeout(() => void verify(attempt + 1), 1500);
          return;
        }
        setStatus("FAILED");
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [clearCart, order_id, user?.token]);

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Payment Status" />
      <View style={styles.body}>
        {status === "loading" ? <ActivityIndicator color={colors.primary} size="large" /> : null}
        <Text style={styles.title}>
          {status === "PAID"
            ? "Payment Successful"
            : status === "PENDING"
              ? "Payment Pending"
              : status === "FAILED"
                ? "Payment Failed"
                : "Verifying Payment"}
        </Text>
        <Text style={styles.sub}>
          {status === "PAID"
            ? `Order ${orderNumber} confirmed successfully.`
            : status === "PENDING"
              ? "We are still waiting for payment confirmation. Please check My Orders in a moment."
              : "Your payment could not be completed. You can try again from checkout."}
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => router.replace(status === "FAILED" ? "/checkout" : "/(tabs)/orders")}
        >
          <Text style={styles.btnText}>
            {status === "FAILED" ? "Back to Checkout" : "View Orders"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { marginTop: 18, fontSize: 22, fontWeight: "800", color: colors.foreground },
  sub: {
    marginTop: 10,
    textAlign: "center",
    color: colors.muted,
    lineHeight: 20,
    maxWidth: 320,
  },
  btn: {
    marginTop: 22,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
  },
  btnText: { color: colors.white, fontWeight: "800" },
});
