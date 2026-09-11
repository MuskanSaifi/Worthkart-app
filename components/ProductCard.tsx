import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatPrice } from "@/lib/format";
import { notify } from "@/lib/notify";
import {
  pickProductImageUrl,
  PRODUCT_IMAGE_PLACEHOLDER,
} from "@/lib/product-images";
import { rememberProduct } from "@/lib/product-cache";
import type { Product } from "@/lib/types";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";
import { useEffect, useState } from "react";

export function ProductCard({
  product,
  wide = false,
}: {
  product: Product;
  wide?: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(() => pickProductImageUrl(product.images));
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const wish = isWishlisted(product.id);
  useEffect(() => {
    setImageUrl(pickProductImageUrl(product.images));
    rememberProduct(product);
  }, [product]);

  return (
    <View style={[styles.card, wide && styles.cardWide]}>
      <View style={styles.imageWrap}>
        <Link href={`/product/${product.slug}`} asChild>
          <Pressable>
            {product.discount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.discount}% OFF</Text>
              </View>
            ) : null}
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="contain"
              onError={() => setImageUrl(PRODUCT_IMAGE_PLACEHOLDER)}
            />
          </Pressable>
        </Link>
        <Pressable
          style={styles.wishBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={6}
          accessibilityLabel={wish ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FontAwesome
            name={wish ? "heart" : "heart-o"}
            size={13}
            color={wish ? colors.danger : "#9ca3af"}
          />
        </Pressable>
      </View>

      <Link href={`/product/${product.slug}`} asChild>
        <Pressable>
          <Text numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.mrp > product.price ? (
              <Text style={styles.mrp}>{formatPrice(product.mrp)}</Text>
            ) : null}
          </View>
          {product.rating > 0 ? (
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={10} color={colors.success} />
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              {product.reviewCount > 0 ? (
                <Text style={styles.reviewCount}>({product.reviewCount})</Text>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Link>

      <Pressable
        style={styles.cartBtn}
        onPress={() => {
          addToCart(product);
          notify.success("Added to cart", product.name);
        }}
      >
        <FontAwesome name="shopping-cart" size={12} color={colors.primary} />
        <Text style={styles.cartBtnText}>Add to Cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    marginRight: 10,
  },
  cardWide: {
    width: "100%",
    marginRight: 0,
    flex: 1,
  },
  imageWrap: {
    height: 118,
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: 118,
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 1,
    backgroundColor: "#ec4899",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  wishBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  name: {
    fontSize: 12,
    color: colors.foreground,
    fontWeight: "600",
    minHeight: 32,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.foreground,
  },
  mrp: {
    fontSize: 11,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.foreground,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 11,
    color: colors.muted,
  },
  cartBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  cartBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
});
