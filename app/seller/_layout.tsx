import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SellerProvider, useSeller } from "@/context/SellerContext";
import { colors } from "@/constants/theme";

function SellerGate({ children }: { children: React.ReactNode }) {
  const { ready, isSellerLoggedIn } = useSeller();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const path = segments.join("/");
    const publicAuth = path.includes("login") || path.includes("register");
    if (!isSellerLoggedIn && !publicAuth) {
      router.replace("/seller/login");
    } else if (isSellerLoggedIn && publicAuth) {
      router.replace("/seller");
    }
  }, [ready, isSellerLoggedIn, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

function SellerLayoutInner() {
  return (
    <SellerGate>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="products" />
        <Stack.Screen name="more" />
        <Stack.Screen name="returns" />
        <Stack.Screen name="pricing" />
        <Stack.Screen name="packaging" />
        <Stack.Screen name="claims" />
        <Stack.Screen name="quality" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="warehouse" />
        <Stack.Screen name="services" />
        <Stack.Screen name="notices" />
        <Stack.Screen name="support" />
        <Stack.Screen name="login" options={{ presentation: "modal" }} />
        <Stack.Screen name="register" options={{ presentation: "modal" }} />
      </Stack>
    </SellerGate>
  );
}

export default function SellerLayout() {
  return (
    <SellerProvider>
      <SellerLayoutInner />
    </SellerProvider>
  );
}
