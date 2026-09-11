import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { AuthProvider } from "@/context/AuthContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import { ShopProvider } from "@/context/ShopContext";
import { ToastHost } from "@/components/ToastHost";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ConfirmProvider>
          <ShopProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="search" />
              <Stack.Screen name="product/[slug]" />
              <Stack.Screen name="wishlist" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="help" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="checkout-return" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="seller" />
              <Stack.Screen name="login" options={{ presentation: "modal" }} />
            </Stack>
            <ToastHost />
          </ShopProvider>
        </ConfirmProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
