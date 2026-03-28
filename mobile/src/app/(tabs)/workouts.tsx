import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSessions } from "@/hooks/useWorkouts";
import { SessionListSkeleton } from "@/components/ui/Skeleton";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { WorkoutSession } from "@/types/api.types";

export default function WorkoutsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useSessions({ limit: 50 });

  if (isLoading) return <SessionListSkeleton />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No se pudieron cargar las sesiones</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <TouchableOpacity style={styles.analyticsCard} onPress={() => router.push("/analytics")} activeOpacity={0.8}>
            <View>
              <Text style={styles.analyticsTitle}>Análisis de entrenamiento</Text>
              <Text style={styles.analyticsSubtitle}>Volumen, grupos musculares y tendencias</Text>
            </View>
            <Text style={styles.analyticsArrow}>›</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin sesiones aún</Text>
            <Text style={styles.emptySubtitle}>Empieza tu primer entrenamiento</Text>
          </View>
        }
        renderItem={({ item }) => <SessionCard session={item} />}
        ListFooterComponent={<View style={{ height: 96 }} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/workout/log")} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  const ended = !!session.endedAt;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/workout/${session.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{session.name ?? "Sesión sin nombre"}</Text>
        <Text style={styles.cardDate}>
          {new Date(session.startedAt).toLocaleDateString("es", {
            weekday: "short", day: "numeric", month: "long",
          })}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.badge, ended ? styles.badgeDone : styles.badgeActive]}>
          <Text style={[styles.badgeText, ended ? styles.badgeTextDone : styles.badgeTextActive]}>
            {ended ? "Completada" : "En curso"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3] },
  list: { padding: spacing[4], gap: spacing[2] },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing[3],
  },
  cardLeft: { flex: 1, gap: 3 },
  cardTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  cardDate: { fontSize: typography.xs, color: colors.textSecondary, textTransform: "capitalize" },
  cardRight: { alignItems: "flex-end" },

  badge: { borderRadius: radius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
  badgeDone: { backgroundColor: colors.successBg },
  badgeActive: { backgroundColor: "#FEF3C7" },
  badgeText: { fontSize: typography.xs, fontWeight: typography.semibold },
  badgeTextDone: { color: colors.success },
  badgeTextActive: { color: "#92400E" },

  analyticsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[3],
  },
  analyticsTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  analyticsSubtitle: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  analyticsArrow: { fontSize: 22, color: colors.gray4 },

  emptyState: { alignItems: "center", marginTop: 80, gap: spacing[2] },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textSecondary },
  emptySubtitle: { fontSize: typography.sm, color: colors.textMuted },

  errorTitle: { fontSize: typography.md, color: colors.textSecondary },
  retryBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  retryText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.semibold },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: colors.textInverted, fontSize: 26, lineHeight: 30, fontWeight: typography.bold },
});
