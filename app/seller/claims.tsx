import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { createSellerClaim, fetchSellerExtras, type SellerExtras } from "@/lib/seller-api";
import { colors } from "@/constants/theme";
import { notify } from "@/lib/notify";

export default function SellerClaimsScreen() {
  const { seller } = useSeller();
  const [claims, setClaims] = useState<SellerExtras["claims"]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!seller?.token) return;
    setLoading(true);
    try {
      const data = await fetchSellerExtras(seller.token);
      setClaims(data.claims || []);
    } catch (e) {
      notify.error("Claims", e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [seller?.token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const submit = async () => {
    if (!seller?.token || title.trim().length < 3 || description.trim().length < 10) {
      notify.error("Required", "Title + description (min 10 chars)");
      return;
    }
    setSaving(true);
    try {
      await createSellerClaim(seller.token, title.trim(), description.trim());
      notify.success("Claim filed");
      setOpen(false);
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      notify.error("Claim", e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <SellerScreenHeader title="Claims" subtitle="File & track claims" />
      <Pressable style={styles.newBtn} onPress={() => setOpen(true)}>
        <Text style={styles.newBtnText}>+ New claim</Text>
      </Pressable>
      {loading && claims.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={claims}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<Text style={styles.empty}>No claims yet</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.top}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.badge}>{item.status}</Text>
              </View>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
              </Text>
            </View>
          )}
        />
      )}

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New claim</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Describe the issue"
              placeholderTextColor={colors.muted}
            />
            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.save} onPress={submit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Submit</Text>}
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
  newBtn: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  newBtnText: { color: "#fff", fontWeight: "800" },
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
  top: { flexDirection: "row", gap: 8 },
  title: { flex: 1, fontWeight: "800", color: colors.foreground },
  badge: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  desc: { color: colors.muted, fontSize: 13, marginTop: 8 },
  date: { color: colors.muted, fontSize: 11, marginTop: 8 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
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
