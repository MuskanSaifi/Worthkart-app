import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
const SLIDE_H = Math.round(SLIDE_W / APP_BANNER_ASPECT);

export function HeroBanner() {
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
      <View style={[styles.slide, styles.fallback]}>
        <Text style={styles.fallbackEyebrow}>WorthKart</Text>
        <Text style={styles.fallbackTitle}>Deals worth every cart</Text>
        <Text style={styles.fallbackSub}>Electronics · Fashion · Home · More</Text>
      </View>
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
            <View
              key={item.id}
              style={[styles.slide, { backgroundColor: item.bgColor || colors.primaryDark }]}
            >
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.image} resizeMode="cover" />
              ) : null}
            </View>
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
    marginBottom: 8,
    overflow: "hidden",
  },
  scroller: {
    borderRadius: 14,
    overflow: "hidden",
  },
  slide: {
    width: SLIDE_W,
    height: SLIDE_H,
    borderRadius: 14,
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
    backgroundColor: colors.primary,
    justifyContent: "center",
    padding: 18,
  },
  fallbackEyebrow: {
    color: "#ddd6fe",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fallbackTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  fallbackSub: {
    color: "#e9d5ff",
    marginTop: 6,
    fontSize: 12,
  },
});
