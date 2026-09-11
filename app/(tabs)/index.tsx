import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { CategoryTiles } from "@/components/CategoryTiles";
import { HeroBanner } from "@/components/HeroBanner";
import { ProductSection } from "@/components/ProductSection";
import { PromoBanners } from "@/components/PromoBanners";
import { TrustBar } from "@/components/TrustBar";
import { colors } from "@/constants/theme";
import { API_BASE_URL, pingApi } from "@/lib/api";

export default function HomeScreen() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const checkApi = useCallback(async () => {
    const ok = await pingApi();
    setApiOk(ok);
    return ok;
  }, []);

  useEffect(() => {
    void checkApi();
  }, [checkApi]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkApi();
    setTick((n) => n + 1);
    setRefreshing(false);
  }, [checkApi]);

  return (
    <View style={styles.page}>
      <AppHeader />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {apiOk === false ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Products load nahi ho rahe</Text>
            <Text style={styles.errorText}>
              App website API se connect nahi ho pa rahi.{"\n"}Current API: {API_BASE_URL}
            </Text>
            <Pressable style={styles.retryBtn} onPress={onRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.bannerWrap}>
          <HeroBanner key={`hero-${tick}`} />
        </View>

        <TrustBar />

        <CategoryTiles />

        <View style={styles.sections}>
          <ProductSection
            key={`deals-${tick}`}
            title="Deals of the Day"
            fetchQuery="deal=true&limit=10&sort=best"
            viewAllHref="/search?deal=true"
            showTimer
          />
        </View>

        <PromoBanners />

        <View style={styles.sections}>
          <ProductSection
            key={`elec-${tick}`}
            title="Best of Electronics"
            fetchQuery="category=electronics&limit=10"
            viewAllHref="/search?category=electronics"
          />
          <ProductSection
            key={`picks-${tick}`}
            title="Top Picks for You"
            fetchQuery="featured=true&limit=10&sort=best"
            viewAllHref="/search?featured=true"
          />
          <ProductSection
            key={`fashion-${tick}`}
            title="Trending in Fashion"
            fetchQuery="category=fashion&limit=10"
            viewAllHref="/search?category=fashion"
          />
          <ProductSection
            key={`beauty-${tick}`}
            title="Beauty & Personal Care"
            fetchQuery="category=beauty&limit=10"
            viewAllHref="/search?category=beauty"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1 },
  content: { paddingBottom: 20 },
  bannerWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sections: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 4,
  },
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
  retryBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  retryText: { color: colors.white, fontWeight: "700" },
});
