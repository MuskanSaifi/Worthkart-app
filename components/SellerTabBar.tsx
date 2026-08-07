import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

export type SellerTab = "home" | "orders" | "payments" | "inventory" | "more";

const TABS: {
  key: SellerTab;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  href: string;
}[] = [
  { key: "home", label: "Home", icon: "home", href: "/seller" },
  { key: "orders", label: "Orders", icon: "cube", href: "/seller/orders" },
  { key: "payments", label: "Pay", icon: "rupee", href: "/seller/payments" },
  { key: "inventory", label: "Stock", icon: "tags", href: "/seller/inventory" },
  { key: "more", label: "More", icon: "bars", href: "/seller/more" },
];

export function SellerTabBar({ active }: { active: SellerTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const on = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={styles.item}
              onPress={() => {
                if (on) return;
                router.replace(tab.href as any);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
                <FontAwesome
                  name={tab.icon}
                  size={16}
                  color={on ? "#fff" : colors.muted}
                />
              </View>
              <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  bar: { flexDirection: "row", paddingHorizontal: 4 },
  item: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 2 },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapOn: { backgroundColor: colors.primary },
  label: { fontSize: 10, color: colors.muted, fontWeight: "600" },
  labelOn: { color: colors.primary, fontWeight: "800" },
});
