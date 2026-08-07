import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";
import { goHome, safeBack } from "@/lib/navigation";

type Props = {
  showSearch?: boolean;
  showBack?: boolean;
  title?: string;
  onSearchSubmit?: (q: string) => void;
  searchValue?: string;
  onSearchChange?: (q: string) => void;
};

export function AppHeader({
  showSearch = true,
  showBack = false,
  title,
  onSearchSubmit,
  searchValue,
  onSearchChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartCount, wishlist } = useShop();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.deliver}>Deliver to India</Text>
        <View style={styles.topLinks}>
          <Link href="/(tabs)/orders" asChild>
            <Pressable>
              <Text style={styles.topLink}>Track Order</Text>
            </Pressable>
          </Link>
          <Link href="/help" asChild>
            <Pressable>
              <Text style={styles.topLink}>Help</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.main}>
        {showBack ? (
          <Pressable onPress={() => safeBack(router)} style={styles.iconBtn} hitSlop={8}>
            <FontAwesome name="arrow-left" size={18} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable onPress={() => goHome(router)} style={styles.brandWrap}>
            <Text style={styles.brand}>WorthKart</Text>
          </Pressable>
        )}

        {title ? <Text style={styles.pageTitle}>{title}</Text> : <View style={{ flex: 1 }} />}

        <View style={styles.actions}>
          <Link href="/wishlist" asChild>
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <FontAwesome name="heart-o" size={18} color={colors.white} />
              {wishlist.length > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {wishlist.length > 9 ? "9+" : wishlist.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
          <Link href="/(tabs)/cart" asChild>
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <FontAwesome name="shopping-cart" size={20} color={colors.white} />
              {cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
        </View>
      </View>

      {showSearch ? (
        onSearchChange ? (
          <View style={styles.searchRow}>
            <FontAwesome name="search" size={14} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              value={searchValue}
              onChangeText={onSearchChange}
              placeholder="Search for products, brands and more"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus={false}
              blurOnSubmit
              onSubmitEditing={() => {
                const q = (searchValue || "").trim();
                if (onSearchSubmit) onSearchSubmit(q);
              }}
            />
          </View>
        ) : (
          <Pressable
            style={styles.searchRow}
            onPress={() => router.push("/search")}
          >
            <FontAwesome name="search" size={14} color={colors.muted} style={styles.searchIcon} />
            <Text style={styles.searchPlaceholder}>Search for products, brands and more</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
  },
  topBar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deliver: {
    color: "#e9d5ff",
    fontSize: 11,
    fontWeight: "500",
  },
  topLinks: {
    flexDirection: "row",
    gap: 14,
  },
  topLink: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
  },
  brandWrap: {
    paddingVertical: 2,
  },
  brand: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  pageTitle: {
    flex: 1,
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  actions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  searchRow: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.foreground,
  },
  searchPlaceholder: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.muted,
  },
});
