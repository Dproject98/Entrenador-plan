import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, type ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = radius.xs,
  style,
}: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as ViewStyle["width"], height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// ─── Composed skeletons ───────────────────────────────────────────────────────

export function SessionListSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardLeft}>
            <SkeletonBox width="55%" height={14} />
            <SkeletonBox width="38%" height={11} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={72} height={24} borderRadius={radius.full} />
        </View>
      ))}
    </View>
  );
}

export function NutritionSkeleton() {
  return (
    <View style={styles.list}>
      <View style={styles.card}>
        <SkeletonBox width="42%" height={14} />
        <View style={styles.macroRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.macroCell}>
              <SkeletonBox width={40} height={20} />
              <SkeletonBox width={32} height={10} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox width="32%" height={14} />
          <SkeletonBox width="52%" height={11} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

export function PlanListSkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="50%" height={14} />
            <SkeletonBox width="72%" height={11} />
          </View>
          <SkeletonBox width={60} height={30} borderRadius={radius.full} />
        </View>
      ))}
    </View>
  );
}

export function SessionDetailSkeleton() {
  return (
    <View style={styles.list}>
      <View style={{ gap: 8, marginBottom: spacing[4] }}>
        <SkeletonBox width="48%" height={22} />
        <SkeletonBox width="62%" height={12} />
      </View>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.setRow}>
          <SkeletonBox width={26} height={26} borderRadius={radius.full} />
          <View style={{ flex: 1, gap: 5 }}>
            <SkeletonBox width="28%" height={12} />
            <SkeletonBox width="52%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.gray3 },
  list: { padding: spacing[4], gap: 10 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  cardLeft: { flex: 1, gap: 6 },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing[2] },
  macroCell: { alignItems: "center", flex: 1, gap: 4 },
  setRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginBottom: 4,
  },
});
