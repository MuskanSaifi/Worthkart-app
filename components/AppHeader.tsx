import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { BrandLogo } from "@/components/BrandLogo";
import { StatusBar } from "expo-status-bar";

const SEARCH_HINTS = [
  "Search for products, brands and more...",
  'Search "mobiles"',
  'Search "lipstick"',
  'Search "headphones"',
  'Search "sneakers"',
  'Search "skincare"',
];

function RotatingHint({ visible }: { visible: boolean }) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      setIndex(0);
      opacity.setValue(1);
      return;
    }
    const tick = () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((i) => (i + 1) % SEARCH_HINTS.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    };
    const id = setInterval(tick, 2600);
    return () => clearInterval(id);
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.hintWrap, { opacity }]}>
      <Text numberOfLines={1} style={styles.hintText}>
        {SEARCH_HINTS[index]}
      </Text>
    </Animated.View>
  );
}

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
    <View style={[styles.wrap, { zIndex: 50 }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#7c3aed", "#6d28d9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.chrome, { paddingTop: insets.top }]}
      >
        <View style={styles.main}>
          {showBack ? (
            <Pressable onPress={() => safeBack(router)} style={styles.iconBtn} hitSlop={8}>
              <FontAwesome name="arrow-left" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable onPress={() => goHome(router)} style={styles.logoWrap} accessibilityLabel="WorthKart Home">
              <BrandLogo height={26} />
            </Pressable>
          )}

          {!showBack && !title ? (
            <Pressable style={styles.location} onPress={() => router.push("/checkout")}>
              <FontAwesome name="map-marker" size={13} color="#fff" />
              <View>
                <Text style={styles.locLabel}>Deliver to</Text>
                <View style={styles.locValueRow}>
                  <Text style={styles.locValue}>India</Text>
                  <FontAwesome name="chevron-down" size={8} color="#fff" />
                </View>
              </View>
            </Pressable>
          ) : null}

          {title ? <Text style={styles.pageTitle}>{title}</Text> : <View style={{ flex: 1 }} />}

          <View style={styles.actions}>
            <Link href="/help" asChild>
              <Pressable style={styles.iconBtn} hitSlop={8}>
                <FontAwesome name="bell-o" size={18} color="#fff" />
              </Pressable>
            </Link>
            <Link href="/wishlist" asChild>
              <Pressable style={styles.iconBtn} hitSlop={8}>
                <FontAwesome name="heart-o" size={18} color="#fff" />
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
                <FontAwesome name="shopping-cart" size={20} color="#fff" />
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
            <View style={[styles.searchRow, focused && styles.searchRowFocused]}>
              <FontAwesome name="search" size={15} color={colors.muted} style={styles.searchLeftIcon} />
              <View style={styles.searchField}>
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={focused ? SEARCH_HINTS[0] : ""}
                  placeholderTextColor={colors.muted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  underlineColorAndroid="transparent"
                  autoCorrect={false}
                  autoCapitalize="none"
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setFocused(false), 180);
                  }}
                  onSubmitEditing={() => goFullSearch()}
                />
                <RotatingHint visible={!focused && query.length === 0} />
              </View>
              {query.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setQuery("");
                    setSuggest(null);
                    inputRef.current?.focus();
                  }}
                  hitSlop={8}
                  style={styles.clearBtn}
                  accessibilityLabel="Clear search"
                >
                  <FontAwesome name="times-circle" size={16} color="#9ca3af" />
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
                        <View style={styles.suggestIcon}>
                          <FontAwesome name="tag" size={12} color={colors.primary} />
                        </View>
                        <Text style={styles.dropdownText}>{c.name}</Text>
                        <FontAwesome name="chevron-right" size={10} color="#c4c4c4" />
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
                        <View style={styles.suggestIcon}>
                          <FontAwesome name="certificate" size={12} color={colors.primary} />
                        </View>
                        <Text style={styles.dropdownText}>{b.name}</Text>
                        <FontAwesome name="chevron-right" size={10} color="#c4c4c4" />
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
                          <Text numberOfLines={1} style={styles.productName}>
                            {p.name}
                          </Text>
                          {p.brand || p.category ? (
                            <Text numberOfLines={1} style={styles.productSub}>
                              {[p.brand, p.category].filter(Boolean).join(" · ")}
                            </Text>
                          ) : null}
                          <View style={styles.priceRow}>
                            <Text style={styles.price}>{formatPrice(p.price)}</Text>
                            {p.mrp > p.price ? (
                              <Text style={styles.mrp}>{formatPrice(p.mrp)}</Text>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Pressable style={styles.seeAll} onPress={() => goFullSearch()}>
                  <FontAwesome name="search" size={13} color={colors.primary} />
                  <Text style={styles.seeAllText}>
                    View all results for “{query.trim()}”
                  </Text>
                  <FontAwesome name="arrow-right" size={12} color={colors.primary} />
                </Pressable>
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#6d28d9",
  },
  chrome: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  main: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  logoWrap: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  location: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  locLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "500",
  },
  locValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  pageTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  actions: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
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
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
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
    zIndex: 60,
  },
  searchRow: {
    backgroundColor: colors.white,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    minHeight: 44,
  },
  searchRowFocused: {
    borderWidth: 1,
    borderColor: "#c4b5fd",
  },
  searchLeftIcon: {
    alignSelf: "center",
    marginLeft: 14,
  },
  searchField: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.foreground,
    includeFontPadding: false,
  },
  hintWrap: {
    position: "absolute",
    left: 10,
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  hintText: {
    fontSize: 13,
    color: colors.muted,
  },
  clearBtn: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    maxHeight: 380,
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#1f2937",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  dropdownScroll: {
    maxHeight: 380,
  },
  sectionLabel: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  suggestIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
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
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#f8f5ff",
    borderWidth: 1,
    borderColor: "#eee",
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
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },
  productSub: {
    fontSize: 11,
    color: colors.muted,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  mrp: {
    fontSize: 11,
    color: colors.muted,
    textDecorationLine: "line-through",
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: "#f0e9ff",
    backgroundColor: "#faf5ff",
  },
  seeAllText: {
    flex: 1,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
});
