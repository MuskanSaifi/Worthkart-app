import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatPrice } from "@/lib/format";
import { notify } from "@/lib/notify";
import type { Product } from "@/lib/types";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";

export function ProductCard({
  product,
  wide = false,
}: {
  product: Product;
  wide?: boolean;
}) {
  const imageUrl = product.images?.[0]?.url;
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const wish = isWishlisted(product.id);

  return (
    <View style={[styles.card, wide && styles.cardWide]}>
      <Link href={`/product/${product.slug}`} asChild>
        <Pressable>
          <View style={styles.imageWrap}>
            {product.discount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{product.discount}% OFF</Text>
              </View>
            ) : null}
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
            ) : (
              <View style={[styles.image, styles.placeholder]} />
            )}
          </View>
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
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>
                ★ {product.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            </View>
          ) : null}
        </Pressable>
      </Link>

      <View style={styles.actions}>
        <Pressable
          style={styles.wishBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={6}
        >
          <FontAwesome
            name={wish ? "heart" : "heart-o"}
            size={16}
            color={wish ? colors.danger : colors.muted}
          />
        </Pressable>
        <Pressable
          style={styles.cartBtn}
          onPress={() => {
            addToCart(product);
            notify.success("Added to cart", product.name);
          }}
        >
          <Text style={styles.cartBtnText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginRight: 10,
  },
  cardWide: {
    width: "100%",
    marginRight: 0,
    flex: 1,
  },
  imageWrap: {
    height: 140,
    marginBottom: 8,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  placeholder: {
    backgroundColor: "#eee",
  },
  badge: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 1,
    backgroundColor: "#ec4899",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  name: {
    fontSize: 13,
    color: colors.foreground,
    fontWeight: "600",
    minHeight: 34,
    lineHeight: 17,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  mrp: {
    fontSize: 12,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  ratingPill: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.white,
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: "700",
    overflow: "hidden",
  },
  reviewCount: {
    fontSize: 11,
    color: colors.muted,
  },
  actions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wishBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  cartBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
