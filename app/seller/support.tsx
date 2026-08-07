import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { colors } from "@/constants/theme";

const FAQS = [
  {
    q: "How do I pack and ship an order?",
    a: "Open Orders → Mark Packed → Download label → hand over to courier → Mark Shipped.",
  },
  {
    q: "When do I get paid?",
    a: "Payouts run every Wednesday for delivered orders (after ~10% commission).",
  },
  {
    q: "How do I update stock or price?",
    a: "Use Inventory for stock and Pricing for MRP/selling price. Changes reflect live.",
  },
];

export default function SellerSupportScreen() {
  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Support" subtitle="Help for sellers" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          style={styles.contact}
          onPress={() => Linking.openURL("mailto:support@worthkart.in")}
        >
          <Text style={styles.contactTitle}>Email support</Text>
          <Text style={styles.contactSub}>support@worthkart.in</Text>
        </Pressable>
        {FAQS.map((f) => (
          <View key={f.q} style={styles.card}>
            <Text style={styles.q}>{f.q}</Text>
            <Text style={styles.a}>{f.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 12, paddingBottom: 40 },
  contact: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  contactTitle: { color: "#fff", fontWeight: "800", fontSize: 15 },
  contactSub: { color: "#e9d5ff", marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  q: { fontWeight: "800", color: colors.foreground },
  a: { color: colors.muted, marginTop: 8, lineHeight: 18 },
});
