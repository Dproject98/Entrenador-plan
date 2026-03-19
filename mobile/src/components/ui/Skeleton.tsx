import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, type ViewStyle } from "react-native";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
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
            <SkeletonBox width="60%" height={15} />
            <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={70} height={24} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

export function NutritionSkeleton() {
  return (
    <View style={styles.list}>
      <View style={styles.card}>
        <SkeletonBox width="45%" height={15} />
        <View style={styles.macroRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.macroCell}>
              <SkeletonBox width={44} height={22} />
              <SkeletonBox width={36} height={11} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox width="35%" height={15} />
          <SkeletonBox width="55%" height={12} style={{ marginTop: 6 }} />
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
            <SkeletonBox width="55%" height={15} />
            <SkeletonBox width="75%" height={12} />
          </View>
          <SkeletonBox width={64} height={32} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

export function SessionDetailSkeleton() {
  return (
    <View style={styles.list}>
      <View style={{ gap: 8, marginBottom: 16 }}>
        <SkeletonBox width="50%" height={24} />
        <SkeletonBox width="65%" height={13} />
      </View>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.setRow}>
          <SkeletonBox width={28} height={28} borderRadius={14} />
          <View style={{ flex: 1, gap: 5 }}>
            <SkeletonBox width="30%" height={13} />
            <SkeletonBox width="55%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: "#d1d5db" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLeft: { flex: 1, gap: 6 },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  macroCell: { alignItems: "center", flex: 1, gap: 4 },
  setRow: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
});
