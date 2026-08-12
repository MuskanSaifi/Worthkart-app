import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { useShop } from "@/context/ShopContext";
import {
  fetchProductSuggestions,
  type SuggestResponse,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";
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
  const [localQuery, setLocalQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [suggest, setSuggest] = useState<SuggestResponse | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const query = onSearchChange ? searchValue || "" : localQuery;
  const setQuery = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setLocalQuery(value);
  };

  const showDropdown = focused && query.trim().length >= 2;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSuggest(null);
      setLoadingSuggest(false);
      return;
    }

    setLoadingSuggest(true);
    debounceRef.current = setTimeout(() => {
      fetchProductSuggestions(q)
        .then((data) => setSuggest(data))
        .catch(() => setSuggest({ products: [], categories: [], brands: [] }))
        .finally(() => setLoadingSuggest(false));
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const closeSuggest = () => {
    setFocused(false);
    inputRef.current?.blur();
  };

  const goFullSearch = (q?: string) => {
    const next = (q ?? query).trim();
    closeSuggest();
    if (onSearchSubmit) {
      onSearchSubmit(next);
      return;
    }
    if (!next) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(next)}`);
  };

  const hasResults =
    (suggest?.products.length || 0) > 0 ||
    (suggest?.categories.length || 0) > 0 ||
    (suggest?.brands.length || 0) > 0;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, zIndex: 50 }]}>
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
        <View style={styles.searchWrap}>
          <View style={styles.searchRow}>
            <FontAwesome name="search" size={14} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for products, brands and more"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              onFocus={() => setFocused(true)}
              onBlur={() => {
                // Delay so suggestion presses register
                setTimeout(() => setFocused(false), 180);
              }}
              onSubmitEditing={() => goFullSearch()}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setSuggest(null);
                }}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <FontAwesome name="times-circle" size={16} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          {showDropdown ? (
            <View style={styles.dropdown}>
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
                {loadingSuggest && !suggest ? (
                  <View style={styles.dropdownRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.dropdownMuted}>Searching…</Text>
                  </View>
                ) : null}

                {!loadingSuggest && suggest && !hasResults ? (
                  <Text style={styles.dropdownEmpty}>No matches for “{query.trim()}”</Text>
                ) : null}

                {(suggest?.categories.length || 0) > 0 ? (
                  <View>
                    <Text style={styles.sectionLabel}>Categories</Text>
                    {suggest!.categories.map((c) => (
                      <Pressable
                        key={c.slug}
                        style={styles.dropdownRow}
                        onPress={() => {
                          closeSuggest();
                          router.push(`/search?category=${encodeURIComponent(c.slug)}`);
                        }}
                      >
                        <FontAwesome name="tag" size={14} color={colors.muted} />
                        <Text style={styles.dropdownText}>{c.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {(suggest?.brands.length || 0) > 0 ? (
                  <View>
                    <Text style={styles.sectionLabel}>Brands</Text>
                    {suggest!.brands.map((b) => (
                      <Pressable
                        key={b.name}
                        style={styles.dropdownRow}
                        onPress={() => {
                          closeSuggest();
                          router.push(`/search?q=${encodeURIComponent(b.name)}`);
                        }}
                      >
                        <FontAwesome name="certificate" size={14} color={colors.muted} />
                        <Text style={styles.dropdownText}>{b.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {(suggest?.products.length || 0) > 0 ? (
                  <View>
                    <Text style={styles.sectionLabel}>Products</Text>
                    {suggest!.products.map((p) => (
                      <Pressable
                        key={p.id}
                        style={styles.productRow}
                        onPress={() => {
                          closeSuggest();
                          router.push(`/product/${p.slug}`);
                        }}
                      >
                        <View style={styles.thumb}>
                          {p.image ? (
                            <Image source={{ uri: p.image }} style={styles.thumbImg} contentFit="cover" />
                          ) : (
                            <FontAwesome name="image" size={14} color={colors.muted} />
                          )}
                        </View>
                        <View style={styles.productMeta}>
                          <Text numberOfLines={2} style={styles.dropdownText}>
                            {p.name}
                          </Text>
                          <Text style={styles.price}>{formatPrice(p.price)}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Pressable style={styles.seeAll} onPress={() => goFullSearch()}>
                  <Text style={styles.seeAllText}>
                    See all results for “{query.trim()}”
                  </Text>
                  <FontAwesome name="arrow-right" size={12} color={colors.primary} />
                </Pressable>
              </ScrollView>
            </View>
          ) : null}
        </View>
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
  searchWrap: {
    marginHorizontal: 12,
    marginBottom: 12,
    zIndex: 60,
  },
  searchRow: {
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
  clearBtn: {
    padding: 4,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 360,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownScroll: {
    maxHeight: 360,
  },
  sectionLabel: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
  },
  dropdownMuted: {
    color: colors.muted,
    fontSize: 13,
  },
  dropdownEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: colors.muted,
    fontSize: 13,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  productMeta: {
    flex: 1,
    gap: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#faf5ff",
  },
  seeAllText: {
    flex: 1,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
    marginRight: 8,
  },
});
