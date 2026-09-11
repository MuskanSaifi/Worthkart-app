import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fetchBanners } from "@/lib/api";
import type { Banner } from "@/lib/types";
import { colors } from "@/constants/theme";

function toAppHref(link?: string | null) {
  if (!link) return "/search";
  if (link.startsWith("/products")) return link.replace("/products", "/search");
  if (link.startsWith("/search") || link.startsWith("/product/")) return link;
  return "/search";
}

const FALLBACK: Banner[] = [
  {
    id: "fashion-carnival",
    title: "Fashion Carnival",
    subtitle: "50-80% Off",
    image: "",
    link: "/search?category=fashion",
    bgColor: "#db2777",
    ctaLabel: "Shop Now",
    placement: "PROMO",
  },
  {
    id: "electronics-fest",
    title: "Electronics Fest",
    subtitle: "Up to 75% Off",
    image: "",
    link: "/search?category=electronics",
    bgColor: "#2563eb",
    ctaLabel: "Shop Now",
    placement: "PROMO",
  },
];

export function PromoBanners() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    fetchBanners("PROMO")
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  const tiles =
    banners.length >= 2
      ? banners.slice(0, 2)
      : banners.length === 1
        ? [banners[0], FALLBACK[1]]
        : FALLBACK;

  return (
    <View style={styles.row}>
      {tiles.map((b, i) => {
        const img = b.appImage || b.image;
        const start = b.bgColor || (i === 0 ? "#ec4899" : "#3b82f6");
        const end = i === 0 ? "#be185d" : "#1d4ed8";
        return (
          <Pressable
            key={b.id}
            style={styles.card}
            onPress={() => router.push(toAppHref(b.link) as never)}
          >
            <LinearGradient
              colors={[start, end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.grad}
            >
              {img ? (
                <Image source={{ uri: img }} style={styles.image} contentFit="cover" />
              ) : null}
              <View style={styles.copy}>
                <Text style={styles.title} numberOfLines={2}>
                  {b.title}
                </Text>
                {b.subtitle ? (
                  <Text style={styles.sub} numberOfLines={2}>
                    {b.subtitle}
                  </Text>
                ) : null}
                <Text style={styles.cta}>{b.ctaLabel || "Shop Now"} →</Text>
              </View>
            </LinearGradient>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 10,
    paddingVertical: 4,
    paddingBottom: 8,
  },
  card: {
    flex: 1,
    height: 132,
    borderRadius: 14,
    overflow: "hidden",
  },
  grad: {
    flex: 1,
    justifyContent: "flex-end",
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  copy: {
    padding: 12,
  },
  title: { color: "#fff", fontSize: 14, fontWeight: "800", lineHeight: 18 },
  sub: { color: "rgba(255,255,255,0.95)", fontSize: 12, marginTop: 4, fontWeight: "600" },
  cta: { color: "#fff", fontSize: 11, fontWeight: "700", marginTop: 8 },
});
