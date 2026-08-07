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
import { useFocusEffect } from "expo-router";
import { SellerScreenHeader } from "@/components/SellerScreenHeader";
import { useSeller } from "@/context/SellerContext";
import {
  fetchSellerInventory,
  updateSellerInventory,
  type SellerProduct,
} from "@/lib/seller-api";
import { formatPrice } from "@/lib/format";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerPricingScreen() {
  const { seller } = useSeller();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<SellerProduct | null>(null);
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      setProducts(await fetchSellerInventory(seller.token));
    } catch (e) {
      notify.error("Pricing", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const open = (p: SellerProduct) => {
    setEdit(p);
    setPrice(String(p.price));
    setMrp(String(p.mrp));
  };

  const save = async () => {
    if (!edit || !seller?.token) return;
    setSaving(true);
    try {
      await updateSellerInventory(seller.token, {
        productId: edit.id,
        price: Number(price),
        mrp: Number(mrp),
      });
      notify.success("Saved", edit.name);
      setEdit(null);
      await load();
    } catch (e) {
      notify.error("Save", e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Pricing" subtitle="MRP & selling price" />
      {loading && products.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No products</Text>}
          renderItem={({ item }) => {
            const img = item.images?.[0]?.url;
            return (
              <Pressable style={styles.card} onPress={() => open(item)}>
                {img ? <Image source={{ uri: img }} style={styles.img} /> : <View style={styles.img} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta}>
                    {formatPrice(item.price)} · MRP {formatPrice(item.mrp)}
                  </Text>
                </View>
                <Text style={styles.edit}>Edit</Text>
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
            <Text style={styles.label}>MRP</Text>
            <TextInput style={styles.input} value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" />
            <Text style={styles.label}>Selling price</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={() => setEdit(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.save} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  list: { padding: 12, paddingBottom: 40 },
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
  name: { fontWeight: "700", color: colors.foreground, fontSize: 13 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  edit: { color: colors.primary, fontWeight: "800", fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 18 },
  cancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { fontWeight: "700" },
  save: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "800" },
});
