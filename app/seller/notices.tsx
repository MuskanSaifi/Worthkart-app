import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { useSeller } from "@/context/SellerContext";
import { fetchSellerExtras, type SellerExtras } from "@/lib/seller-api";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerNoticesScreen() {
  const { seller } = useSeller();
  const [notices, setNotices] = useState<SellerExtras["notices"]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const data = await fetchSellerExtras(seller.token);
      setNotices(data.notices || []);
    } catch (e) {
      notify.error("Notices", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Notices" subtitle="Important updates" />
      {loading && notices.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No notices</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                {!item.isRead ? <View style={styles.dot} /> : null}
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <Text style={styles.msg}>{item.message}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12, paddingBottom: 40 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff4747" },
  title: { flex: 1, fontWeight: "800", color: colors.foreground },
  msg: { color: colors.muted, marginTop: 8, lineHeight: 18 },
  date: { color: colors.muted, fontSize: 11, marginTop: 10 },
});
