import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppHeader } from "@/components/AppHeader";
import { fetchCategories } from "@/lib/api";
import type { Category } from "@/lib/types";
import { colors } from "@/constants/theme";

export default function CategoriesScreen() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories(true)
      .then(setCats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.page}>
      <AppHeader showSearch title="All Categories" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Link href="/search?deal=true" asChild>
              <Pressable style={styles.offerCard}>
                <FontAwesome name="tags" size={18} color="#ff4747" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerTitle}>Offer Zone</Text>
                  <Text style={styles.offerSub}>Deals, discounts & flash sales</Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color={colors.muted} />
              </Pressable>
            </Link>
          }
          renderItem={({ item }) => (
            <View style={styles.group}>
              {/* Group header with optional image */}
              <Link href={`/search?category=${item.slug}` as `/search`} asChild>
                <Pressable style={styles.groupHead}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.catImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.catImagePlaceholder}>
                      <FontAwesome name="folder-open" size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupTitle}>{item.name}</Text>
                    {item.children && item.children.length > 0 && (
                      <Text style={styles.subCount}>{item.children.length} subcategories</Text>
                    )}
                  </View>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </Link>

              {/* Subcategories */}
              {(item.children || []).slice(0, 8).map((child) => (
                <Link
                  key={child.id}
                  href={`/search?category=${child.slug}` as `/search`}
                  asChild
                >
                  <Pressable style={styles.childRow}>
                    {child.image ? (
                      <Image
                        source={{ uri: child.image }}
                        style={styles.childImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.childImagePlaceholder}>
                        <FontAwesome name="tag" size={10} color={colors.primary} />
                      </View>
                    )}
                    <Text style={styles.childName}>{child.name}</Text>
                    <FontAwesome name="chevron-right" size={11} color="#c4c4c4" />
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 24 },
  error: { color: colors.danger, textAlign: "center", marginTop: 40 },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  offerTitle: { fontWeight: "800", color: "#ff4747", fontSize: 15 },
  offerSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  group: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#faf5ff",
  },
  catImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
  },
  catImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  subCount: { color: colors.muted, fontSize: 11, marginTop: 1 },
  groupTitle: { fontWeight: "800", fontSize: 15, color: colors.foreground },
  viewAll: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  childImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3e8ff",
  },
  childImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  childName: { flex: 1, color: colors.foreground, fontSize: 14 },
});
