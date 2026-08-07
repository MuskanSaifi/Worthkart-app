import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import {
  FilterModal,
  emptyFilterState,
  type FilterSection,
  type FilterState,
} from "@/components/FilterModal";
import { ListingToolbar } from "@/components/ListingToolbar";
import { ProductGridCard } from "@/components/ProductGridCard";
import { fetchCategories, fetchProductsFull } from "@/lib/api";
import type { Product } from "@/lib/types";
import { colors } from "@/constants/theme";

export default function SearchScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    category?: string;
    deal?: string;
    featured?: string;
  }>();
  const router = useRouter();
  const [query, setQuery] = useState(params.q || "");
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

  useEffect(() => {
    setQuery(params.q || "");
  }, [params.q]);

  useEffect(() => {
    fetchCategories(false)
      .then((list) =>
        setRootCategories(list.map((c) => ({ name: c.name, slug: c.slug })))
      )
      .catch(() => setRootCategories([]));
  }, []);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const openFilters = (section: FilterSection) => {
    setFilterSection(section);
    setFiltersOpen(true);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const parts: string[] = [`limit=48`, `sort=${sort}`];
    if (params.category && params.category !== "") parts.push(`category=${params.category}`);
    if (params.deal === "true") parts.push("deal=true");
    if (params.featured === "true") parts.push("featured=true");
    if (query.trim()) parts.push(`search=${encodeURIComponent(query.trim())}`);

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
    } catch (e) {
      setProducts([]);
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [params.category, params.deal, params.featured, query, sort, filtersKey]);

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

  const heading =
    params.deal === "true"
      ? "Offer Zone"
      : params.featured === "true"
        ? "Featured"
        : params.category
          ? params.category.replace(/-/g, " ")
          : "Search";

  return (
    <View style={styles.page}>
      <AppHeader
        showBack
        title={heading}
        searchValue={query}
        onSearchChange={setQuery}
        onSearchSubmit={(q) => {
          setQuery(q);
          router.setParams({ q });
        }}
      />

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

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <Text style={styles.count}>{total} products</Text>
          }
          ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
          renderItem={({ item }) => <ProductGridCard product={item} />}
        />
      )}

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
        activeCategory={params.category}
        initialSection={filterSection}
        onCategorySelect={(slug) => {
          setFilters(emptyFilterState());
          setFiltersOpen(false);
          router.setParams({ category: slug, q: undefined });
        }}
        onClearAll={() => {
          router.setParams({ category: "", deal: "", featured: "" });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  count: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.muted,
    fontSize: 12,
    backgroundColor: colors.background,
  },
  empty: { textAlign: "center", marginTop: 40, color: colors.muted },
  center: { padding: 24, alignItems: "center" },
  error: { color: colors.danger, fontWeight: "600", textAlign: "center" },
  retry: {
    marginTop: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: colors.white, fontWeight: "700" },
});
