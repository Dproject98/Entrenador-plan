import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSessions } from "@/hooks/useWorkouts";
import type { WorkoutSession } from "@/types/api.types";

export default function WorkoutsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useSessions({ limit: 50 });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error al cargar sesiones</Text>
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
        ListEmptyComponent={
          <Text style={styles.empty}>Sin sesiones. ¡Empieza tu primer entrenamiento!</Text>
        }
        renderItem={({ item }) => <SessionCard session={item} />}
        ListFooterComponent={<View style={{ height: 88 }} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/workout/log")}>
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
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle}>{session.name ?? "Sesión sin nombre"}</Text>
        <Text style={styles.cardDate}>
          {new Date(session.startedAt).toLocaleDateString("es", {
            weekday: "short",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.badge, ended ? styles.badgeDone : styles.badgeActive]}>
          <Text style={styles.badgeText}>{ended ? "Completada" : "En curso"}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardDate: { fontSize: 13, color: "#6b7280", textTransform: "capitalize" },
  cardRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeDone: { backgroundColor: "#dcfce7" },
  badgeActive: { backgroundColor: "#fef9c3" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#374151" },
  arrow: { fontSize: 22, color: "#9ca3af" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 60, fontSize: 14, paddingHorizontal: 32 },
  errorText: { fontSize: 15, color: "#374151" },
  retryBtn: { backgroundColor: "#eff6ff", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#2563eb", fontWeight: "600" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 32 },
});
