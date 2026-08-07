import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

const badges = [
  { title: "Easy Returns", desc: "7 days" },
  { title: "Original", desc: "100% authentic" },
  { title: "Free Delivery", desc: "Above ₹499" },
  { title: "Secure Pay", desc: "Safe checkout" },
];

export function TrustBar() {
  return (
    <View style={styles.wrap}>
      {badges.map((b) => (
        <View key={b.title} style={styles.item}>
          <Text style={styles.title}>{b.title}</Text>
          <Text style={styles.desc}>{b.desc}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  item: {
    width: "50%",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  desc: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
