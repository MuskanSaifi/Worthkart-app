import { useEffect, useMemo, useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/lib/types";
import { colors } from "@/constants/theme";

const TILE_COLORS = [
  "#fce7f3",
  "#e0e7ff",
  "#dcfce7",
  "#ffedd5",
  "#f3e8ff",
  "#e0f2fe",
  "#fef9c3",
  "#fee2e2",
];

const FALLBACK = [
  { id: "electronics", name: "Electronics", slug: "electronics", image: null },
  { id: "fashion", name: "Fashion", slug: "fashion", image: null },
  { id: "beauty", name: "Beauty", slug: "beauty", image: null },
  { id: "home", name: "Home", slug: "home-furniture", image: null },
  { id: "sports", name: "Sports", slug: "sports", image: null },
  { id: "kids", name: "Kids", slug: "kids", image: null },
];

type Props = {
  selectedSlug?: string;
  onSelect?: (slug: string | null) => void;
};

export function CategoryTiles({ selectedSlug, onSelect }: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories(false)
      .then((list) => setCats(list.slice(0, 14)))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []);

  const items = useMemo(() => {
    const list = cats.length > 0 ? cats : (FALLBACK as Category[]);
    return [
      { id: "all", name: "All", slug: "__all__", image: null } as Category,
      { id: "deal", name: "Offers", slug: "__deal__", image: null } as Category,
      ...list,
    ];
  }, [cats]);

  const handlePress = (slug: string) => {
    if (!onSelect) return;
    if (slug === "__all__") onSelect(null);
    else if (slug === "__deal__") onSelect("__deal__");
    else onSelect(slug);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop by Category</Text>
        <Link href="/(tabs)/categories" asChild>
          <Pressable>
            <Text style={styles.viewAll}>View all</Text>
          </Pressable>
        </Link>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {items.map((cat, i) => {
            const active =
              (cat.slug === "__all__" && !selectedSlug) ||
              selectedSlug === cat.slug;
            const bg = TILE_COLORS[i % TILE_COLORS.length];
            return (
              <Pressable
                key={cat.id}
                style={[styles.tile, active && styles.tileActive]}
                onPress={() => handlePress(cat.slug)}
              >
                <View style={[styles.icon, { backgroundColor: bg }]}>
                  {cat.image ? (
                    <Image source={{ uri: cat.image }} style={styles.image} />
                  ) : (
                    <Text style={styles.initial}>
                      {cat.slug === "__deal__"
                        ? "%"
                        : cat.slug === "__all__"
                          ? "★"
                          : cat.name.charAt(0)}
                    </Text>
                  )}
                </View>
                <Text
                  numberOfLines={1}
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  row: {
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tile: {
    width: 72,
    alignItems: "center",
    marginHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tileActive: {
    backgroundColor: "#f5f3ff",
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  image: { width: "100%", height: "100%" },
  initial: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    color: colors.foreground,
    fontWeight: "600",
    lineHeight: 13,
    paddingHorizontal: 2,
    width: "100%",
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  offerLabel: {
    color: "#ff4747",
  },
});
