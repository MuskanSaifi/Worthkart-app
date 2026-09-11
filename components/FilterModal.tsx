import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@/constants/theme";
import { useBottomInset } from "@/lib/safe-layout";

export type FilterState = {
  brands: string[];
  minPrice: string;
  maxPrice: string;
  minRating: string;
  discount: string;
  inStock: boolean;
  gender: string;
  color: string;
};

export type FilterSection =
  | "Category"
  | "Gender"
  | "Color"
  | "Brand"
  | "Price"
  | "Rating"
  | "Discount"
  | "Availability";

export const emptyFilterState = (): FilterState => ({
  brands: [],
  minPrice: "",
  maxPrice: "",
  minRating: "",
  discount: "",
  inStock: false,
  gender: "",
  color: "",
});

const SECTIONS: FilterSection[] = [
  "Category",
  "Gender",
  "Color",
  "Brand",
  "Price",
  "Rating",
  "Discount",
  "Availability",
];

const SHEET_H = Dimensions.get("window").height * 0.88;

type Props = {
  visible: boolean;
  onClose: () => void;
  value: FilterState;
  onApply: (next: FilterState) => void;
  brands: string[];
  subcategories: { name: string; slug: string }[];
  genders?: string[];
  colors?: string[];
  total?: number;
  activeCategory?: string;
  onCategorySelect?: (slug: string) => void;
  onClearAll?: () => void;
  initialSection?: FilterSection;
};

export function FilterModal({
  visible,
  onClose,
  value,
  onApply,
  brands,
  subcategories,
  genders = ["Women", "Men", "Boys", "Girls", "Unisex"],
  colors = [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Pink",
    "Yellow",
    "Purple",
    "Grey",
    "Brown",
    "Beige",
    "Orange",
  ],
  total,
  activeCategory,
  onCategorySelect,
  onClearAll,
  initialSection = "Category",
}: Props) {
  const bottom = useBottomInset();
  const [draft, setDraft] = useState(value);
  const [section, setSection] = useState<FilterSection>(initialSection);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!visible) return;
    setDraft(value);
    setSection(initialSection);
    setQ("");
  }, [visible, initialSection, value]);

  const filteredBrands = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter((b) => b.toLowerCase().includes(term));
  }, [brands, q]);

  const filteredCats = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return subcategories;
    return subcategories.filter((c) => c.name.toLowerCase().includes(term));
  }, [subcategories, q]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { height: SHEET_H, paddingBottom: Math.max(bottom, 12) }]}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>FILTERS</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <FontAwesome name="close" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <ScrollView style={styles.sidebar} showsVerticalScrollIndicator={false}>
              {SECTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setSection(s);
                    setQ("");
                  }}
                  style={[styles.sideItem, section === s && styles.sideItemActive]}
                >
                  {section === s ? <View style={styles.sideBar} /> : null}
                  <Text style={[styles.sideText, section === s && styles.sideTextActive]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.main}>
              <Text style={styles.mainTitle}>{section}</Text>

              {(section === "Category" || section === "Brand") && (
                <View style={styles.searchBox}>
                  <FontAwesome name="search" size={12} color={colors.muted} />
                  <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder="Search"
                    placeholderTextColor={colors.muted}
                    style={styles.searchInput}
                  />
                </View>
              )}

              <ScrollView showsVerticalScrollIndicator={false}>
                {section === "Category" && (
                  <>
                    {filteredCats.length === 0 ? (
                      <Text style={styles.empty}>No categories found</Text>
                    ) : (
                      filteredCats.map((c) => (
                        <Pressable
                          key={c.slug}
                          style={styles.option}
                          onPress={() => {
                            onCategorySelect?.(c.slug);
                            onClose();
                          }}
                        >
                          <View
                            style={[
                              styles.check,
                              activeCategory === c.slug && styles.checkOn,
                            ]}
                          />
                          <Text style={styles.optionText}>{c.name}</Text>
                        </Pressable>
                      ))
                    )}
                  </>
                )}

                {section === "Gender" &&
                  genders.map((g) => (
                    <Pressable
                      key={g}
                      style={styles.option}
                      onPress={() =>
                        setDraft((d) => ({ ...d, gender: d.gender === g ? "" : g }))
                      }
                    >
                      <View style={[styles.check, draft.gender === g && styles.checkOn]} />
                      <Text style={styles.optionText}>{g}</Text>
                    </Pressable>
                  ))}

                {section === "Color" &&
                  colors.map((c) => (
                    <Pressable
                      key={c}
                      style={styles.option}
                      onPress={() =>
                        setDraft((d) => ({ ...d, color: d.color === c ? "" : c }))
                      }
                    >
                      <View style={[styles.check, draft.color === c && styles.checkOn]} />
                      <Text style={styles.optionText}>{c}</Text>
                    </Pressable>
                  ))}

                {section === "Brand" &&
                  (filteredBrands.length === 0 ? (
                    <Text style={styles.empty}>No brands found</Text>
                  ) : (
                    filteredBrands.map((b) => {
                      const on = draft.brands.includes(b);
                      return (
                        <Pressable
                          key={b}
                          style={styles.option}
                          onPress={() =>
                            setDraft((d) => ({
                              ...d,
                              brands: on
                                ? d.brands.filter((x) => x !== b)
                                : [...d.brands, b],
                            }))
                          }
                        >
                          <View style={[styles.check, on && styles.checkOn]} />
                          <Text style={styles.optionText}>{b}</Text>
                        </Pressable>
                      );
                    })
                  ))}

                {section === "Price" &&
                  [
                    { label: "Under ₹500", min: "", max: "500" },
                    { label: "₹500–₹1000", min: "500", max: "1000" },
                    { label: "₹1000–₹5000", min: "1000", max: "5000" },
                    { label: "Above ₹5000", min: "5000", max: "" },
                  ].map((r) => {
                    const on = draft.minPrice === r.min && draft.maxPrice === r.max;
                    return (
                      <Pressable
                        key={r.label}
                        style={styles.option}
                        onPress={() =>
                          setDraft((d) => ({
                            ...d,
                            minPrice: r.min,
                            maxPrice: r.max,
                          }))
                        }
                      >
                        <View style={[styles.check, on && styles.checkOn]} />
                        <Text style={styles.optionText}>{r.label}</Text>
                      </Pressable>
                    );
                  })}

                {section === "Rating" &&
                  ["4", "3", "2"].map((v) => (
                    <Pressable
                      key={v}
                      style={styles.option}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          minRating: d.minRating === v ? "" : v,
                        }))
                      }
                    >
                      <View
                        style={[styles.check, draft.minRating === v && styles.checkOn]}
                      />
                      <Text style={styles.optionText}>{v}★ & above</Text>
                    </Pressable>
                  ))}

                {section === "Discount" &&
                  ["50", "40", "30", "20", "10"].map((v) => (
                    <Pressable
                      key={v}
                      style={styles.option}
                      onPress={() =>
                        setDraft((d) => ({
                          ...d,
                          discount: d.discount === v ? "" : v,
                        }))
                      }
                    >
                      <View
                        style={[styles.check, draft.discount === v && styles.checkOn]}
                      />
                      <Text style={styles.optionText}>{v}% or more</Text>
                    </Pressable>
                  ))}

                {section === "Availability" && (
                  <Pressable
                    style={styles.option}
                    onPress={() => setDraft((d) => ({ ...d, inStock: !d.inStock }))}
                  >
                    <View style={[styles.check, draft.inStock && styles.checkOn]} />
                    <Text style={styles.optionText}>In Stock Only</Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.count}>
              {total != null ? `${total}+ Products` : "Products"}
            </Text>
            <View style={styles.footerActions}>
              <Pressable
                onPress={() => {
                  const cleared = emptyFilterState();
                  setDraft(cleared);
                  onApply(cleared);
                  if (onClearAll) onClearAll();
                  onClose();
                }}
              >
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
              <Pressable
                style={styles.done}
                onPress={() => {
                  onApply(draft);
                  onClose();
                }}
              >
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 2,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d4d4d4",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: "800", letterSpacing: 0.6 },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: "34%",
    backgroundColor: "#f3f3f3",
  },
  sideItem: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    position: "relative",
  },
  sideItemActive: { backgroundColor: colors.white },
  sideBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.primary,
  },
  sideText: { fontSize: 13, color: "#6b6b6b", fontWeight: "600" },
  sideTextActive: { color: colors.primary, fontWeight: "800" },
  main: { flex: 1, paddingHorizontal: 14, paddingTop: 12 },
  mainTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
    color: colors.foreground,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.foreground,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: "#c4c4c4",
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: { fontSize: 14, color: colors.foreground, flex: 1 },
  empty: { color: colors.muted, fontSize: 13, marginTop: 12 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  footerActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  clear: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  done: {
    backgroundColor: colors.primary,
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 8,
  },
  doneText: { color: colors.white, fontWeight: "800", fontSize: 14 },
});
