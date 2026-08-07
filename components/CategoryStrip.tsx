import { useEffect, useState } from "react";
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

const FALLBACK = [
  { id: "deals", name: "Offers", slug: "deal", image: null },
  { id: "electronics", name: "Electronics", slug: "electronics", image: null },
  { id: "fashion", name: "Fashion", slug: "fashion", image: null },
  { id: "beauty", name: "Beauty", slug: "beauty", image: null },
  { id: "home", name: "Home", slug: "home-furniture", image: null },
];

export function CategoryStrip() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories(false)
      .then((list) => setCats(list.slice(0, 12)))
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []);

  const items: Category[] =
    cats.length > 0
      ? [{ id: "offer", name: "Offer Zone", slug: "__deal__", image: null }, ...cats]
      : (FALLBACK as Category[]);

  return (
    <View style={styles.wrap}>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {items.map((cat) => {
            const href =
              cat.slug === "__deal__" || cat.slug === "deal"
                ? "/search?deal=true"
                : `/search?category=${cat.slug}`;
            return (
              <Link key={cat.id} href={href as `/search`} asChild>
                <Pressable style={styles.item}>
                  <View style={[styles.icon, cat.slug === "__deal__" && styles.offerIcon]}>
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} style={styles.image} />
                    ) : (
                      <Text style={styles.initial}>
                        {cat.slug === "__deal__" ? "%" : cat.name.charAt(0)}
                      </Text>
                    )}
                  </View>
                  <Text
                    numberOfLines={2}
                    style={[styles.label, cat.slug === "__deal__" && styles.offerLabel]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  row: {
    paddingHorizontal: 10,
  },
  item: {
    width: 72,
    alignItems: "center",
    marginHorizontal: 4,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  offerIcon: {
    backgroundColor: "#fee2e2",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initial: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  label: {
    fontSize: 11,
    textAlign: "center",
    color: colors.foreground,
    fontWeight: "600",
    lineHeight: 14,
  },
  offerLabel: {
    color: "#ff4747",
  },
});
