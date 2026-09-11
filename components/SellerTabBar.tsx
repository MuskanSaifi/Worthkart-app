import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";
import { TAB_BAR_BODY, useBottomInset } from "@/lib/safe-layout";

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
  const bottom = useBottomInset();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { paddingBottom: bottom, height: TAB_BAR_BODY + bottom }]}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const on = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={styles.item}
              onPress={() => {
                if (on) return;
                router.replace(tab.href as never);
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
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
    elevation: 12,
  },
  bar: { flex: 1, flexDirection: "row", paddingHorizontal: 4, alignItems: "center" },
  item: { flex: 1, alignItems: "center", gap: 3 },
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
