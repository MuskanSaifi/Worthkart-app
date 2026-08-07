import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

export const SORT_OPTIONS = [
  { key: "best", label: "Best Match" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
  { key: "discount", label: "Discount" },
  { key: "rating", label: "Top Rated" },
  { key: "newest", label: "Newest" },
];

type Props = {
  sort: string;
  sortOpen: boolean;
  onSortOpen: () => void;
  onSortClose: () => void;
  onSortChange: (key: string) => void;
  onOpenCategory: () => void;
  onOpenGender: () => void;
  onOpenFilters: () => void;
  activeFilterCount?: number;
};

export function ListingToolbar({
  sort,
  sortOpen,
  onSortOpen,
  onSortClose,
  onSortChange,
  onOpenCategory,
  onOpenGender,
  onOpenFilters,
  activeFilterCount = 0,
}: Props) {
  return (
    <>
      <View style={styles.toolbar}>
        <Pressable style={styles.toolBtn} onPress={onSortOpen}>
          <FontAwesome name="sort" size={12} color={colors.foreground} />
          <Text style={styles.toolText}>Sort</Text>
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={onOpenCategory}>
          <Text style={styles.toolText}>Category</Text>
          <FontAwesome name="chevron-down" size={10} color={colors.foreground} />
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={onOpenGender}>
          <Text style={styles.toolText}>Gender</Text>
          <FontAwesome name="chevron-down" size={10} color={colors.foreground} />
        </Pressable>
        <Pressable style={styles.toolBtn} onPress={onOpenFilters}>
          <FontAwesome name="sliders" size={12} color={colors.foreground} />
          <Text style={styles.toolText}>Filters</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <Modal
        visible={sortOpen}
        transparent
        animationType="slide"
        onRequestClose={onSortClose}
      >
        <View style={styles.sortOverlay}>
          <Pressable style={styles.sortBackdrop} onPress={onSortClose} />
          <View style={styles.sortSheet}>
            <View style={styles.sortHandle} />
            <Text style={styles.sortTitle}>Sort by</Text>
            {SORT_OPTIONS.map((s) => (
              <Pressable
                key={s.key}
                style={styles.sortRow}
                onPress={() => {
                  onSortChange(s.key);
                  onSortClose();
                }}
              >
                <Text style={[styles.sortText, sort === s.key && styles.sortActive]}>
                  {s.label}
                </Text>
                {sort === s.key ? (
                  <FontAwesome name="check" size={14} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  toolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  toolText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
    flexShrink: 1,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: "800" },
  sortOverlay: { flex: 1, justifyContent: "flex-end" },
  sortBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sortSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sortHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d4d4d4",
    marginBottom: 10,
  },
  sortTitle: { fontWeight: "800", fontSize: 16, marginBottom: 8 },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  sortText: { fontSize: 14, color: colors.foreground },
  sortActive: { color: colors.primary, fontWeight: "800" },
});
