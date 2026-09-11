import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

const TILES: {
  name: string;
  slug: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  bg: string;
  fg: string;
}[] = [
  { name: "Top Offers", slug: "__deal__", icon: "tags", bg: "#ffe4e6", fg: "#e11d48" },
  { name: "Electronics", slug: "electronics", icon: "laptop", bg: "#dbeafe", fg: "#2563eb" },
  { name: "TVs & Appliances", slug: "tvs-appliances", icon: "desktop", bg: "#e0e7ff", fg: "#4f46e5" },
  { name: "Fashion", slug: "fashion", icon: "female", bg: "#fce7f3", fg: "#db2777" },
  { name: "Beauty", slug: "beauty", icon: "magic", bg: "#fce7f3", fg: "#c026d3" },
  { name: "Home & Furniture", slug: "home-furniture", icon: "home", bg: "#ffedd5", fg: "#ea580c" },
  { name: "Grocery", slug: "grocery", icon: "shopping-basket", bg: "#dcfce7", fg: "#16a34a" },
  { name: "Baby & Kids", slug: "baby-kids", icon: "child", bg: "#dbeafe", fg: "#0284c7" },
  { name: "Sports & Fitness", slug: "sports-fitness", icon: "futbol-o", bg: "#fef3c7", fg: "#d97706" },
  { name: "Books & Stationery", slug: "books-stationery", icon: "book", bg: "#ede9fe", fg: "#7c3aed" },
  { name: "Automotive", slug: "automotive", icon: "car", bg: "#dcfce7", fg: "#15803d" },
  { name: "Pet Supplies", slug: "pet-supplies", icon: "paw", bg: "#fce7f3", fg: "#be185d" },
];

type Props = {
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
};

export function CategoryTiles({ selectedSlug, onSelect }: Props) {
  const router = useRouter();

  const handlePress = (slug: string) => {
    if (onSelect) {
      onSelect(slug === "__deal__" ? "__deal__" : slug);
      return;
    }
    if (slug === "__deal__") router.push("/search?deal=true");
    else router.push(`/search?category=${encodeURIComponent(slug)}`);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop by Category</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/categories")}
          style={styles.viewAllBtn}
          hitSlop={8}
        >
          <Text style={styles.viewAll}>View All</Text>
          <FontAwesome name="arrow-right" size={10} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {TILES.map((cat) => {
          const active = selectedSlug === cat.slug;
          return (
            <Pressable
              key={cat.slug}
              style={[styles.tile, active && styles.tileActive]}
              onPress={() => handlePress(cat.slug)}
            >
              <View style={[styles.icon, { backgroundColor: cat.bg }]}>
                <FontAwesome name={cat.icon} size={18} color={cat.fg} />
              </View>
              <Text
                numberOfLines={2}
                style={[
                  styles.label,
                  cat.slug === "__deal__" && styles.offerLabel,
                  active && styles.labelActive,
                ]}
              >
                {cat.name}
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
    backgroundColor: colors.white,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tile: {
    width: "16.666%",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 12,
  },
  tileActive: {
    backgroundColor: "#f5f3ff",
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    textAlign: "center",
    color: colors.foreground,
    fontWeight: "600",
    lineHeight: 12,
    width: "100%",
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  offerLabel: {
    color: "#e11d48",
  },
});
