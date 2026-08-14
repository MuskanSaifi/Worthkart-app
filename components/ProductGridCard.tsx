import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { formatPrice } from "@/lib/format";
import { pickProductImageUrl, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/product-images";
import { rememberProduct } from "@/lib/product-cache";
import type { Product } from "@/lib/types";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";
import { useEffect, useState } from "react";

const COL_W = Dimensions.get("window").width / 2;

export function ProductGridCard({
  product,
  width,
}: {
  product: Product;
  width?: number;
}) {
  const cardW = width ?? COL_W;
  const [imageUrl, setImageUrl] = useState(() => pickProductImageUrl(product.images));
  const { toggleWishlist, isWishlisted } = useShop();
  const wish = isWishlisted(product.id);
  useEffect(() => {
    setImageUrl(pickProductImageUrl(product.images));
    rememberProduct(product);
  }, [product]);

  return (
    <View style={[styles.card, { width: cardW }]}>
      <Link href={`/product/${product.slug}`} asChild>
        <Pressable>
          <View style={[styles.imageWrap, { height: cardW * 1.15 }]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              onError={() => setImageUrl(PRODUCT_IMAGE_PLACEHOLDER)}
            />
            {product.discount > 0 ? (
              <View style={styles.offBadge}>
                <Text style={styles.offText}>{product.discount}% off</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.body}>
            <Text numberOfLines={2} style={styles.name}>
              {product.name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.price} numberOfLines={1}>
                {formatPrice(product.price)}
              </Text>
              {product.mrp > product.price ? (
                <Text style={styles.mrp} numberOfLines={1}>
                  {formatPrice(product.mrp)}
                </Text>
              ) : null}
            </View>
            {product.rating > 0 ? (
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>
                  {product.rating.toFixed(1)} ★
                </Text>
                <Text style={styles.reviews}>({product.reviewCount})</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      </Link>
      <Pressable style={styles.heart} onPress={() => toggleWishlist(product)} hitSlop={8}>
        <FontAwesome
          name={wish ? "heart" : "heart-o"}
          size={14}
          color={wish ? colors.danger : colors.muted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: "relative",
  },
  imageWrap: {
    width: "100%",
    backgroundColor: "#fafafa",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: { backgroundColor: "#eee" },
  offBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "#16a34a",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offText: { color: colors.white, fontSize: 10, fontWeight: "800" },
  body: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  name: {
    fontSize: 12,
    color: colors.foreground,
    lineHeight: 16,
    minHeight: 32,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.foreground,
    flexShrink: 0,
  },
  mrp: {
    fontSize: 11,
    color: colors.muted,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  rating: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
    backgroundColor: colors.success,
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  reviews: { fontSize: 10, color: colors.muted },
  heart: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
});
