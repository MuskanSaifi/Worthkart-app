import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

const badges: {
  title: string;
  sub: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}[] = [
  { title: "Free Delivery", sub: "On all orders", icon: "truck", color: "#2563eb" },
  { title: "Secure Payment", sub: "100% Safe", icon: "shield", color: "#16a34a" },
  { title: "Easy Returns", sub: "Hassle Free", icon: "cube", color: "#d97706" },
  { title: "24/7 Support", sub: "We're here", icon: "headphones", color: "#7c3aed" },
];

export function TrustBar() {
  return (
    <View style={styles.wrap}>
      {badges.map((b) => (
        <View key={b.title} style={styles.item}>
          <FontAwesome name={b.icon} size={16} color={b.color} />
          <Text style={styles.title} numberOfLines={1}>
            {b.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {b.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 12,
    marginTop: 10,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.foreground,
    textAlign: "center",
  },
  sub: {
    fontSize: 9,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "500",
  },
});
