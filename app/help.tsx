import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { colors } from "@/constants/theme";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Open Account → Orders, or use Track Order from the top bar after logging in.",
  },
  {
    q: "What is the return policy?",
    a: "Most products support easy returns within 7 days. Check the product page for exact policy.",
  },
  {
    q: "How do I become a seller?",
    a: "Use Become a Seller from Account → More, or open the website seller registration flow.",
  },
  {
    q: "Payment issues?",
    a: "Payments run through Cashfree on the website checkout. For failed payments, retry or contact support.",
  },
];

export default function HelpScreen() {
  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Help & Support" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>24x7 Customer Care</Text>
          <Text style={styles.bannerSub}>We’re here for orders, returns, and account help.</Text>
          <Pressable
            style={styles.mailBtn}
            onPress={() => Linking.openURL("mailto:support@worthkart.in")}
          >
            <Text style={styles.mailText}>Email support@worthkart.in</Text>
          </Pressable>
        </View>

        {FAQS.map((item) => (
          <View key={item.q} style={styles.card}>
            <Text style={styles.q}>{item.q}</Text>
            <Text style={styles.a}>{item.a}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, paddingBottom: 32 },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  bannerTitle: { color: colors.white, fontSize: 20, fontWeight: "800" },
  bannerSub: { color: "#ddd6fe", marginTop: 6, lineHeight: 18 },
  mailBtn: {
    marginTop: 14,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  mailText: { color: colors.primary, fontWeight: "800", fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  q: { fontWeight: "800", color: colors.foreground, marginBottom: 6 },
  a: { color: colors.muted, lineHeight: 20, fontSize: 13 },
});
