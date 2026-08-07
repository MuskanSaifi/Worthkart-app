import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { useShop } from "@/context/ShopContext";
import { colors } from "@/constants/theme";

const SCREEN_W = Dimensions.get("window").width;
const SIDE = 16;
const TILE_GAP = 10;
const TILE_W = (SCREEN_W - SIDE * 2 - TILE_GAP) / 2;

type Action = {
  label: string;
  href: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  badge?: number;
};

type Row = {
  label: string;
  href: string;
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  subtitle: string;
};

function maskPhone(phone?: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  return `+91 ${digits.slice(0, 2)}****${digits.slice(-4)}`;
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartCount, wishlist } = useShop();
  const { isLoggedIn, user, logout } = useAuth();
  const confirm = useConfirm();

  const quickActions: Action[] = [
    { label: "Orders", href: "/(tabs)/orders", icon: "cube" },
    { label: "Wishlist", href: "/wishlist", icon: "heart", badge: wishlist.length },
    { label: "Cart", href: "/(tabs)/cart", icon: "shopping-cart", badge: cartCount },
    { label: "Help", href: "/help", icon: "headphones" },
  ];

  const accountRows: Row[] = [
    {
      label: "My Profile",
      href: isLoggedIn ? "/profile" : "/login?returnTo=profile",
      icon: "user",
      subtitle: isLoggedIn ? "View personal details" : "Login to manage profile",
    },
    {
      label: "Saved Addresses",
      href: isLoggedIn ? "/checkout" : "/login?returnTo=checkout",
      icon: "map-marker",
      subtitle: "Delivery locations",
    },
    {
      label: "Track Order",
      href: "/(tabs)/orders",
      icon: "truck",
      subtitle: "Live status & returns",
    },
  ];

  const moreRows: Row[] = [
    {
      label: "Become a Seller",
      href: "/seller/register",
      icon: "shopping-bag",
      subtitle: "Separate seller register · same mobile OK",
    },
    {
      label: "Customer Care 24x7",
      href: "/help",
      icon: "life-ring",
      subtitle: "support@worthkart.in",
    },
    {
      label: "Help & FAQs",
      href: "/help",
      icon: "question-circle",
      subtitle: "Returns, payments & more",
    },
  ];

  const go = (href: string) => router.push(href as any);

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.heroEyebrow}>MY ACCOUNT</Text>
          <Text style={styles.heroTitle}>
            {isLoggedIn ? "Welcome back" : "Hello, Shopper"}
          </Text>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <FontAwesome name="user" size={22} color={colors.primary} />
            </View>
            <View style={styles.profileCopy}>
              <Text style={styles.profileName} numberOfLines={1}>
                {isLoggedIn ? maskPhone(user?.phone) : "Guest user"}
              </Text>
              <Text style={styles.profileSub} numberOfLines={1}>
                {isLoggedIn ? "Signed in · Ready for checkout" : "Login to save your session"}
              </Text>
            </View>
            {isLoggedIn ? (
              <Pressable
                style={styles.smallBtn}
                onPress={async () => {
                  const ok = await confirm("Next checkout will need OTP again.", {
                    title: "Logout?",
                    confirmLabel: "Logout",
                    destructive: true,
                  });
                  if (ok) logout();
                }}
              >
                <Text style={styles.smallBtnTextDanger}>Logout</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.smallBtnSolid} onPress={() => go("/login?returnTo=account")}>
                <Text style={styles.smallBtnText}>Login</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* 2x2 quick actions with fixed widths — no % / gap bugs */}
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.tileRow}>
            {quickActions.slice(0, 2).map((item) => (
              <Pressable
                key={item.label}
                style={[styles.tile, { width: TILE_W, marginRight: TILE_GAP }]}
                onPress={() => go(item.href)}
              >
                <View style={styles.tileIconWrap}>
                  <FontAwesome name={item.icon} size={18} color={colors.primary} />
                  {item.badge != null && item.badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.badge > 9 ? "9+" : String(item.badge)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.tileRow, { marginTop: TILE_GAP }]}>
            {quickActions.slice(2, 4).map((item, i) => (
              <Pressable
                key={item.label}
                style={[
                  styles.tile,
                  { width: TILE_W, marginRight: i === 0 ? TILE_GAP : 0 },
                ]}
                onPress={() => go(item.href)}
              >
                <View style={styles.tileIconWrap}>
                  <FontAwesome name={item.icon} size={18} color={colors.primary} />
                  {item.badge != null && item.badge > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {item.badge > 9 ? "9+" : String(item.badge)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Account</Text>
          <View style={styles.listCard}>
            {accountRows.map((item, index) => (
              <Pressable
                key={item.label}
                style={[styles.listRow, index > 0 && styles.listDivider]}
                onPress={() => go(item.href)}
              >
                <View style={styles.listIcon}>
                  <FontAwesome name={item.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{item.label}</Text>
                  <Text style={styles.listSub}>{item.subtitle}</Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#bdbdbd" />
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>More</Text>
          <View style={styles.listCard}>
            {moreRows.map((item, index) => (
              <Pressable
                key={item.label}
                style={[styles.listRow, index > 0 && styles.listDivider]}
                onPress={() => go(item.href)}
              >
                <View style={styles.listIcon}>
                  <FontAwesome name={item.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{item.label}</Text>
                  <Text style={styles.listSub}>{item.subtitle}</Text>
                </View>
                <FontAwesome name="chevron-right" size={12} color="#bdbdbd" />
              </Pressable>
            ))}
          </View>

          <Text style={styles.footerBrand}>WorthKart</Text>
          <Text style={styles.footerSub}>Worth every cart · App v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    paddingHorizontal: SIDE,
    paddingBottom: 22,
  },
  heroEyebrow: {
    color: "#ddd6fe",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 4,
    marginBottom: 14,
    color: colors.white,
    fontSize: 24,
    fontWeight: "800",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileCopy: {
    flex: 1,
    marginRight: 8,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
  },
  profileSub: {
    marginTop: 2,
    fontSize: 11,
    color: colors.muted,
  },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },
  smallBtnSolid: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  smallBtnText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 12,
  },
  smallBtnTextDanger: {
    color: colors.danger,
    fontWeight: "800",
    fontSize: 12,
  },
  body: {
    paddingHorizontal: SIDE,
    paddingTop: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  tileRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  tile: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 88,
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 64,
  },
  listDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listText: {
    flex: 1,
    marginRight: 10,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
  },
  listSub: {
    marginTop: 3,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  footerBrand: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
  footerSub: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
  },
});
