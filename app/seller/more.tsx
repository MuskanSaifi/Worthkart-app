import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSeller } from "@/context/SellerContext";
import { useConfirm } from "@/context/ConfirmContext";
import { SellerTabBar } from "@/components/SellerTabBar";
import { SELLER_MORE_GROUPS } from "@/lib/seller-nav";
import { colors } from "@/constants/theme";

export default function SellerMoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { seller, logoutSeller } = useSeller();
  const confirm = useConfirm();

  const onLogout = async () => {
    const ok = await confirm("Logout from Seller Hub?", {
      title: "Seller logout",
      confirmLabel: "Logout",
      destructive: true,
    });
    if (!ok) return;
    await logoutSeller();
    router.replace("/seller/login");
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ALL TOOLS</Text>
        <Text style={styles.title}>{seller?.businessName || "Seller Hub"}</Text>
        <Text style={styles.sub}>Grouped like your website sidebar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {SELLER_MORE_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, idx) => (
                <Pressable
                  key={item.href}
                  style={[styles.row, idx > 0 && styles.rowBorder]}
                  onPress={() => router.push(item.href as any)}
                >
                  <View style={styles.icon}>
                    <FontAwesome name={item.icon} size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.rowSub}>{item.sub}</Text>
                  </View>
                  <FontAwesome name="chevron-right" size={11} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Pressable style={styles.logout} onPress={onLogout}>
          <FontAwesome name="sign-out" size={14} color={colors.danger} />
          <Text style={styles.logoutText}>Logout seller account</Text>
        </Pressable>
      </ScrollView>

      <SellerTabBar active="more" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyebrow: { color: "#c4b5fd", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 2 },
  sub: { color: "#ddd6fe", fontSize: 12, marginTop: 2 },
  list: { padding: 14, paddingBottom: 110 },
  group: { marginBottom: 14 },
  groupTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "800", color: colors.foreground, fontSize: 14 },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  logout: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: { color: colors.danger, fontWeight: "800", fontSize: 13 },
});
