import { Redirect } from "expo-router";

/** Old /orders links → bottom tab My Orders */
export default function OrdersRedirect() {
  return <Redirect href="/(tabs)/orders" />;
}
