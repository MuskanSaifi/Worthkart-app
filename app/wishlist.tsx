import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";

export default function WishlistScreen() {
  const { wishlist } = useShop();

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title={`Wishlist (${wishlist.length})`} />
      {wishlist.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No saved items</Text>
          <Text style={styles.emptySub}>Tap the heart on products to save them here.</Text>
          <Link href="/(tabs)" asChild>
            <Pressable style={styles.btn}>
              <Text style={styles.btnText}>Browse products</Text>
            </Pressable>
          </Link>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10, paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingVertical: 12, gap: 10, paddingBottom: 28 }}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} wide />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  emptySub: { marginTop: 8, color: colors.muted, textAlign: "center" },
  btn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
  },
  btnText: { color: colors.white, fontWeight: "700" },
});
