import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { CategoryTiles } from "@/components/CategoryTiles";
import {
  FilterModal,
  emptyFilterState,
  type FilterSection,
  type FilterState,
} from "@/components/FilterModal";
import { HeroBanner } from "@/components/HeroBanner";
import { ListingToolbar } from "@/components/ListingToolbar";
import { ProductGridCard } from "@/components/ProductGridCard";
import { TrustBar } from "@/components/TrustBar";
import { colors } from "@/constants/theme";
import { API_BASE_URL, fetchCategories, fetchProductsFull, pingApi } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function HomeScreen() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("best");
  const [filters, setFilters] = useState<FilterState>(emptyFilterState());
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [brands, setBrands] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<{ name: string; slug: string }[]>([]);
  const [rootCategories, setRootCategories] = useState<{ name: string; slug: string }[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [colorsList, setColorsList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSection, setFilterSection] = useState<FilterSection>("Category");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterStuck, setFilterStuck] = useState(false);

  const pinAfterY = useRef(0);
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const checkApi = useCallback(() => {
    setApiOk(null);
    pingApi().then(setApiOk);
  }, []);

  useEffect(() => {
    checkApi();
  }, [checkApi]);

  useEffect(() => {
    fetchCategories(false)
      .then((list) =>
        setRootCategories(list.map((c) => ({ name: c.name, slug: c.slug })))
      )
      .catch(() => setRootCategories([]));
  }, []);

  const openFilters = (section: FilterSection) => {
    setFilterSection(section);
    setFiltersOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const parts: string[] = [`limit=48`, `sort=${sort}`];

    if (category === "__deal__") parts.push("deal=true");
    else if (category) parts.push(`category=${category}`);

    const f = JSON.parse(filtersKey) as FilterState;
    if (f.brands.length) parts.push(`brands=${encodeURIComponent(f.brands.join(","))}`);
    if (f.minPrice) parts.push(`minPrice=${f.minPrice}`);
    if (f.maxPrice) parts.push(`maxPrice=${f.maxPrice}`);
    if (f.minRating) parts.push(`minRating=${f.minRating}`);
    if (f.discount) parts.push(`minDiscount=${f.discount}`);
    if (f.inStock) parts.push("inStock=true");
    if (f.gender) parts.push(`gender=${encodeURIComponent(f.gender)}`);
    if (f.color) parts.push(`color=${encodeURIComponent(f.color)}`);

    try {
      const data = await fetchProductsFull(parts.join("&"));
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setBrands((data.facets?.brands || []).map((b) => b.name));
      setSubcategories(data.facets?.subcategories || []);
      setGenders(data.facets?.genders || []);
      setColorsList(data.facets?.colors || []);
      setApiOk(true);
    } catch (e) {
      setProducts([]);
      setError(e instanceof Error ? e.message : "Failed to load products");
      setApiOk(false);
    } finally {
      setLoading(false);
    }
  }, [category, sort, filtersKey]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions =
    subcategories.length > 0 ? subcategories : rootCategories;

  const activeFilterCount =
    filters.brands.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.discount ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.color ? 1 : 0);

  const activeCategorySlug =
    category && category !== "__deal__" ? category : undefined;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const next = y >= pinAfterY.current;
    setFilterStuck((prev) => (prev === next ? prev : next));
  };

  const toolbar = (
    <ListingToolbar
      sort={sort}
      sortOpen={sortOpen}
      onSortOpen={() => setSortOpen(true)}
      onSortClose={() => setSortOpen(false)}
      onSortChange={setSort}
      onOpenCategory={() => openFilters("Category")}
      onOpenGender={() => openFilters("Gender")}
      onOpenFilters={() => openFilters("Category")}
      activeFilterCount={activeFilterCount}
    />
  );

  return (
    <View style={styles.page}>
      <AppHeader />

      <View style={styles.body}>
        {filterStuck ? (
          <View style={styles.pinnedToolbar} pointerEvents="box-none">
            {toolbar}
          </View>
        ) : null}

        {loading && products.length === 0 ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            numColumns={2}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.list}
            removeClippedSubviews
            ListHeaderComponent={
              <View style={styles.headerBlock}>
                {apiOk === false || error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>Products load nahi ho rahe</Text>
                    <Text style={styles.errorText}>
                      {error ||
                        `App website API se connect nahi ho pa rahi.\nCurrent API: ${API_BASE_URL}`}
                    </Text>
                    <Text style={styles.errorHint}>
                      1) website folder mein `npm run dev` chalu rakho{"\n"}
                      2) Phone + PC same Wi‑Fi pe hon{"\n"}
                      3) IP change ho to app/.env update karke Expo restart
                    </Text>
                    <Pressable style={styles.retryBtn} onPress={load}>
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View
                  onLayout={(e) => {
                    pinAfterY.current = e.nativeEvent.layout.height;
                  }}
                >
                  <CategoryTiles selectedSlug={category} onSelect={setCategory} />
                </View>

                {toolbar}

                <View style={styles.bannerWrap}>
                  <HeroBanner />
                </View>
                <Text style={styles.count}>{total} products</Text>
              </View>
            }
            ListEmptyComponent={
              !loading ? <Text style={styles.empty}>No products found</Text> : null
            }
            ListFooterComponent={
              <View style={styles.footer}>
                <TrustBar />
                <Text style={styles.apiHint}>API: {API_BASE_URL}</Text>
              </View>
            }
            renderItem={({ item }) => <ProductGridCard product={item} />}
            refreshing={loading}
            onRefresh={load}
          />
        )}
      </View>

      <FilterModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onApply={setFilters}
        brands={brands}
        subcategories={categoryOptions}
        genders={genders}
        colors={colorsList}
        total={total}
        activeCategory={activeCategorySlug}
        initialSection={filterSection}
        onCategorySelect={(slug) => {
          setFilters(emptyFilterState());
          setFiltersOpen(false);
          setCategory(slug);
        }}
        onClearAll={() => {
          setCategory(null);
          setFilters(emptyFilterState());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  body: { flex: 1, position: "relative" },
  pinnedToolbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 6,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  list: {
    paddingBottom: 28,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  headerBlock: {
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  bannerWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  count: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.muted,
    fontSize: 12,
    backgroundColor: colors.background,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  empty: { textAlign: "center", marginTop: 40, color: colors.muted },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 14,
    margin: 12,
  },
  errorTitle: {
    color: colors.danger,
    fontWeight: "800",
    fontSize: 15,
  },
  errorText: {
    marginTop: 8,
    color: colors.foreground,
    fontSize: 13,
    lineHeight: 19,
  },
  errorHint: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryText: { color: colors.white, fontWeight: "700" },
  apiHint: {
    marginTop: 8,
    marginBottom: 8,
    textAlign: "center",
    fontSize: 10,
    color: colors.muted,
  },
});
