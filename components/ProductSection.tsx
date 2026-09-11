import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { colors } from "@/constants/theme";

type Props = {
  title: string;
  fetchQuery: string;
  viewAllHref?: string;
  showTimer?: boolean;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ProductSection({
  title,
  fetchQuery,
  viewAllHref = "/search",
  showTimer,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState({ h: 8, m: 17, s: 39 });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchProducts(fetchQuery)
      .then((list) => {
        if (alive) setProducts(list);
      })
      .catch((e) => {
        if (alive) {
          setProducts([]);
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fetchQuery]);

  useEffect(() => {
    if (!showTimer) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        let { h, m, s } = t;
        s -= 1;
        if (s < 0) {
          s = 59;
          m -= 1;
        }
        if (m < 0) {
          m = 59;
          h -= 1;
        }
        if (h < 0) {
          h = 23;
          m = 59;
          s = 59;
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showTimer]);

  if (!loading && !error && products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {showTimer ? (
          <View style={styles.timer}>
            <FontAwesome name="clock-o" size={12} color="#db2777" />
            <Text style={styles.timerValue}>
              {pad(timeLeft.h)} : {pad(timeLeft.m)} : {pad(timeLeft.s)} left
            </Text>
          </View>
        ) : null}
        <Link href={viewAllHref as `/search`} asChild>
          <Pressable style={styles.viewAllBtn} hitSlop={8}>
            <Text style={styles.viewAll}>View All</Text>
            <FontAwesome name="arrow-right" size={10} color={colors.primary} />
          </Pressable>
        </Link>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
          showsHorizontalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.foreground,
    flexShrink: 0,
  },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fce7f3",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 1,
  },
  timerValue: {
    color: "#db2777",
    fontWeight: "800",
    fontSize: 11,
  },
  viewAllBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  viewAll: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 8,
  },
});
