import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { fetchBanners } from "@/lib/api";
import type { Banner } from "@/lib/types";
import { colors } from "@/constants/theme";

/** App banner canvas — upload exactly this size in admin for a perfect fit */
export const APP_BANNER_WIDTH = 1080;
export const APP_BANNER_HEIGHT = 540;
export const APP_BANNER_ASPECT = APP_BANNER_WIDTH / APP_BANNER_HEIGHT; // 2:1

const SCREEN_W = Dimensions.get("window").width;
/** Parent home screen already pads 12px — use full remaining width */
const SLIDE_W = SCREEN_W - 24;
const SLIDE_H = Math.max(Math.round(SLIDE_W / APP_BANNER_ASPECT), 168);

export function HeroBanner() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchBanners("HERO")
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    setIndex(i);
  };

  if (banners.length === 0) {
    return (
      <Pressable onPress={() => router.push("/search?deal=true")}>
        <LinearGradient
          colors={["#7c3aed", "#6d28d9", "#5b21b6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.slide, styles.fallback]}
        >
          <View style={styles.offBadge}>
            <Text style={styles.offBadgeText}>UP TO</Text>
            <Text style={styles.offBadgePct}>70% OFF</Text>
          </View>
          <Text style={styles.fallbackTitle}>Upgrade{"\n"}Your Everyday</Text>
          <Text style={styles.fallbackSub}>Top Brands • Best Prices • Great Deals</Text>
          <View style={styles.shopNow}>
            <Text style={styles.shopNowText}>Shop Now →</Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        decelerationRate="fast"
        style={styles.scroller}
      >
        {banners.map((item) => {
          const imgUri = item.appImage || item.image;
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                const link = item.link || "/search?deal=true";
                const href = link.startsWith("/products")
                  ? link.replace("/products", "/search")
                  : link.startsWith("/search") || link.startsWith("/product/")
                    ? link
                    : "/search?deal=true";
                router.push(href as never);
              }}
            >
              <View
                style={[styles.slide, { backgroundColor: item.bgColor || colors.primaryDark }]}
              >
                {imgUri ? (
                  <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((b, i) => (
          <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
    overflow: "hidden",
  },
  scroller: {
    borderRadius: 16,
    overflow: "hidden",
  },
  slide: {
    width: SLIDE_W,
    height: SLIDE_H,
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: SLIDE_W,
    height: SLIDE_H,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#c4b5fd",
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  fallback: {
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  offBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  offBadgeText: {
    color: "#e9d5ff",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  offBadgePct: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  fallbackTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  fallbackSub: {
    color: "#e9d5ff",
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  shopNow: {
    marginTop: 14,
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shopNowText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
});
