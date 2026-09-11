import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { BottomDock } from "@/components/BottomDock";
import { ProductGridCard } from "@/components/ProductGridCard";
import { fetchProductBySlug } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { addRecentlyViewed, getRecentlyViewed } from "@/lib/recently-viewed";
import type { Product } from "@/lib/types";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";
import { useBottomInset } from "@/lib/safe-layout";
import Toast from "react-native-toast-message";
import { pickProductImageUrl, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/product-images";

function Rail({ title, products }: { title: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <View style={styles.rail}>
      <Text style={styles.railTitle}>{title}</Text>
      <FlatList
        horizontal
        data={products}
        keyExtractor={(p) => p.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <ProductGridCard product={item} width={150} />}
      />
    </View>
  );
}

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const bottom = useBottomInset();
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [recent, setRecent] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(PRODUCT_IMAGE_PLACEHOLDER);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setLoading(true);
    fetchProductBySlug(slug)
      .then(async (data) => {
        if (!alive) return;
        setProduct(data.product);
        setImageUrl(pickProductImageUrl(data.product.images));
        setRelated(data.relatedProducts || []);
        setSimilar(data.similarProducts || []);
        await addRecentlyViewed(data.product);
        const recentList = await getRecentlyViewed(data.product.id);
        if (alive) setRecent(recentList);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="Product" />
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.page}>
        <AppHeader showBack showSearch={false} title="Product" />
        <Text style={styles.error}>{error || "Product not found"}</Text>
      </View>
    );
  }

  const wish = isWishlisted(product.id);
  const savings =
    product.mrp > product.price ? product.mrp - product.price : 0;

  return (
    <View style={styles.page}>
      <AppHeader showBack showSearch={false} title="Product" />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + bottom }}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          onError={() => setImageUrl(PRODUCT_IMAGE_PLACEHOLDER)}
        />

        <View style={styles.body}>
          {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.mrp > product.price ? (
              <>
                <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
                <Text style={styles.off}>{product.discount}% off</Text>
              </>
            ) : null}
          </View>
          {savings > 0 ? (
            <Text style={styles.save}>You save {formatPrice(savings)}</Text>
          ) : null}

          {product.rating > 0 ? (
            <Text style={styles.rating}>
              ★ {product.rating.toFixed(1)} · {product.reviewCount} ratings & reviews
            </Text>
          ) : null}

          {product.category?.name ? (
            <Text style={styles.cat}>{product.category.name}</Text>
          ) : null}

          {product.seller?.businessName ? (
            <Text style={styles.seller}>Sold by {product.seller.businessName}</Text>
          ) : null}

          <View style={styles.perks}>
            <Text style={styles.perk}>
              {product.price > 499 ? "✓ FREE Delivery" : "✓ Delivery ₹40"}
            </Text>
            <Text style={styles.perk}>✓ 100% Original Guarantee</Text>
            <Text style={styles.perk}>✓ 7 Days Easy Return</Text>
            <Text style={styles.perk}>
              {product.stock === 0
                ? "✗ Out of stock"
                : product.stock && product.stock <= 5
                  ? `! Only ${product.stock} left`
                  : "✓ In stock"}
            </Text>
          </View>

          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Product Description</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}
        </View>

        <Rail title="Similar products" products={similar} />
        <Rail title="Related products" products={related} />
        <Rail title="Recently viewed" products={recent} />
      </ScrollView>

      <BottomDock style={styles.footerInner}>
        <Pressable style={styles.wishBtn} onPress={() => toggleWishlist(product)}>
          <FontAwesome
            name={wish ? "heart" : "heart-o"}
            size={20}
            color={wish ? colors.danger : colors.foreground}
          />
        </Pressable>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            addToCart(product);
            Toast.show({
              type: "success",
              text1: "Added to cart",
              text2: product.name,
              position: "top",
              onPress: () => {
                Toast.hide();
                router.push("/(tabs)/cart");
              },
            });
          }}
        >
          <Text style={styles.addText}>Add to Cart</Text>
        </Pressable>
        <Pressable
          style={styles.buyBtn}
          onPress={() => {
            addToCart(product);
            router.push("/(tabs)/cart");
          }}
        >
          <Text style={styles.buyText}>Buy Now</Text>
        </Pressable>
      </BottomDock>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  error: { color: colors.danger, textAlign: "center", marginTop: 40, fontWeight: "600" },
  image: { width: "100%", height: 340, backgroundColor: colors.card },
  placeholder: { backgroundColor: "#eee" },
  body: {
    marginTop: 0,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 14,
  },
  brand: { color: colors.primary, fontSize: 12, marginBottom: 4, fontWeight: "700" },
  name: { fontSize: 18, fontWeight: "800", color: colors.foreground, lineHeight: 26 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  price: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  mrp: { fontSize: 14, color: colors.muted, textDecorationLine: "line-through" },
  off: { color: colors.success, fontWeight: "800", fontSize: 13 },
  save: { marginTop: 4, color: colors.success, fontWeight: "600", fontSize: 12 },
  rating: { marginTop: 10, color: colors.success, fontWeight: "700" },
  cat: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    color: colors.muted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
    borderRadius: 4,
  },
  seller: { marginTop: 8, color: colors.muted, fontSize: 13 },
  perks: { marginTop: 14, gap: 6 },
  perk: { color: colors.foreground, fontSize: 13 },
  section: { marginTop: 18 },
  sectionTitle: { fontWeight: "800", marginBottom: 8, color: colors.foreground },
  desc: { color: colors.foreground, lineHeight: 22, fontSize: 14 },
  rail: {
    marginTop: 10,
    backgroundColor: colors.card,
    paddingTop: 12,
    borderTopWidth: 8,
    borderTopColor: colors.background,
  },
  railTitle: {
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 12,
    marginBottom: 8,
    color: colors.foreground,
  },
  footerInner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  wishBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flex: 1,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  addText: { color: "#b45309", fontWeight: "800" },
  buyBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  buyText: { color: colors.white, fontWeight: "800" },
});
