import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/services/api";
import type { WorkoutSession } from "@/types/api.types";

export default function WorkoutsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => sessionsApi.list({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Sin sesiones aún. ¡Empieza tu primer entrenamiento!</Text>
        }
        renderItem={({ item }) => <SessionCard session={item} />}
        ListFooterComponent={<View style={{ height: 80 }} />}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/workout/log")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function SessionCard({ session }: { session: WorkoutSession }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/workout/${session.id}`)}
    >
      <View>
        <Text style={styles.cardTitle}>{session.name ?? "Sesión sin nombre"}</Text>
        <Text style={styles.cardDate}>
          {new Date(session.startedAt).toLocaleDateString("es", {
            weekday: "short",
            day: "numeric",
            month: "long",
          })}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardDate: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  arrow: { fontSize: 22, color: "#9ca3af" },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 60, fontSize: 14, paddingHorizontal: 32 },
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
