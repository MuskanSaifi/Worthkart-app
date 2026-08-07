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

export function ProductSection({
  title,
  fetchQuery,
  viewAllHref = "/search",
  showTimer,
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState({ h: 8, m: 24, s: 17 });

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
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {showTimer ? (
            <Text style={styles.timer}>
              Ends in{" "}
              <Text style={styles.timerValue}>
                {String(timeLeft.h).padStart(2, "0")} : {String(timeLeft.m).padStart(2, "0")} :{" "}
                {String(timeLeft.s).padStart(2, "0")}
              </Text>
            </Text>
          ) : null}
        </View>
        <Link href={viewAllHref as `/search`} asChild>
          <Pressable>
            <Text style={styles.viewAll}>View All</Text>
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleWrap: { flex: 1, paddingRight: 8 },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
  },
  timer: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
  },
  timerValue: {
    color: colors.danger,
    fontWeight: "700",
  },
  viewAll: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 8,
  },
});
