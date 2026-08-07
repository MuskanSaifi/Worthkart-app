import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { colors } from "@/constants/theme";

const SERVICES = [
  {
    title: "Catalog tools",
    body: "Add / edit listings on website wizard. Mobile catalog shows QC status.",
  },
  {
    title: "Shipping labels",
    body: "Generate AWB + barcoded labels from Packaging or Orders.",
  },
  {
    title: "Payments",
    body: "Track earnings and weekly payouts. Keep bank details verified.",
  },
  {
    title: "Growth tips",
    body: "Keep stock updated, respond to returns fast, maintain 4★+ rating.",
  },
];

export default function SellerServicesScreen() {
  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Services" subtitle="Seller tools & tips" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {SERVICES.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  title: { fontWeight: "800", color: colors.foreground },
  body: { color: colors.muted, marginTop: 8, lineHeight: 18 },
});
