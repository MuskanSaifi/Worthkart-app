import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSeller } from "@/context/SellerContext";
import {
  fetchSellerInventory,
  updateSellerInventory,
  type SellerProduct,
} from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";
import { SellerTabBar } from "@/components/SellerTabBar";

export default function SellerInventoryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const { seller } = useSeller();
  const [filter, setFilter] = useState(params.filter || "");
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<SellerProduct | null>(null);
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      setProducts(await fetchSellerInventory(seller.token, filter || undefined));
    } catch (e) {
      notify.error("Inventory", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token, filter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const openEdit = (p: SellerProduct) => {
    setEdit(p);
    setStock(String(p.stock));
    setPrice(String(p.price));
    setMrp(String(p.mrp));
  };

  const save = async () => {
    if (!edit || !seller?.token) return;
    setSaving(true);
    try {
      await updateSellerInventory(seller.token, {
        productId: edit.id,
        stock: Number(stock),
        price: Number(price),
        mrp: Number(mrp),
      });
      notify.success("Updated", edit.name);
      setEdit(null);
      await load();
    } catch (e) {
      notify.error("Save failed", e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Price & Stock</Text>
        <Text style={styles.sub}>Tap a product to edit</Text>
      </View>

      <View style={styles.filters}>
        {[
          { key: "", label: "All" },
          { key: "low", label: "Low" },
          { key: "out", label: "Out" },
        ].map((f) => (
          <Pressable
            key={f.key || "all"}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipOn]}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextOn]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading && products.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
          renderItem={({ item }) => {
            const img = item.images?.[0]?.url;
            return (
              <Pressable style={styles.card} onPress={() => openEdit(item)}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.img} />
                ) : (
                  <View style={[styles.img, styles.imgPh]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta}>
                    {formatPrice(item.price)} · Stock {item.stock}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stockBadge,
                    item.stock === 0 && styles.stockOut,
                    item.stock > 0 && item.stock < 10 && styles.stockLow,
                  ]}
                >
                  {item.stock === 0 ? "OUT" : item.stock < 10 ? "LOW" : "OK"}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={!!edit} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              {edit?.name}
            </Text>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Selling price</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
            <Text style={styles.label}>MRP</Text>
            <TextInput
              style={styles.input}
              value={mrp}
              onChangeText={setMrp}
              keyboardType="decimal-pad"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancel} onPress={() => setEdit(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.save} onPress={save} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SellerTabBar active="inventory" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sub: { color: "#ddd6fe", fontSize: 12, marginTop: 2 },
  filters: { flexDirection: "row", gap: 8, padding: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  chipTextOn: { color: "#fff" },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  img: { width: 52, height: 52, borderRadius: 10, backgroundColor: "#f3e8ff" },
  imgPh: {},
  name: { fontWeight: "700", color: colors.foreground, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  stockBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockOut: { color: colors.danger, backgroundColor: "#fee2e2" },
  stockLow: { color: "#b45309", backgroundColor: "#fef3c7" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { fontWeight: "700", color: colors.foreground },
  save: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { fontWeight: "800", color: "#fff" },
});
