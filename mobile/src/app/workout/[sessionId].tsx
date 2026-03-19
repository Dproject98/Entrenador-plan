import { View, Text, SectionList, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/services/api";
import type { WorkoutSet } from "@/types/api.types";

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => sessionsApi.get(sessionId),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Sesión no encontrada</Text>
      </View>
    );
  }

  // Group sets by exercise
  const grouped = session.sets.reduce<Record<string, { title: string; data: WorkoutSet[] }>>(
    (acc, set) => {
      const key = set.exercise.id;
      if (!acc[key]) {
        acc[key] = { title: set.exercise.name, data: [] };
      }
      acc[key].data.push(set);
      return acc;
    },
    {}
  );

  const sections = Object.values(grouped);

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{session.name ?? "Sesión"}</Text>
          <Text style={styles.date}>
            {new Date(session.startedAt).toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          {session.notes ? <Text style={styles.notes}>{session.notes}</Text> : null}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.exerciseName}>{section.title}</Text>
      )}
      renderItem={({ item, index }) => <SetRow set={item} index={index} />}
    />
  );
}

function SetRow({ set, index }: { set: WorkoutSet; index: number }) {
  return (
    <View style={[styles.setRow, set.completed && styles.setCompleted]}>
      <Text style={styles.setNum}>Serie {set.setNumber}</Text>
      <Text style={styles.setDetail}>
        {set.reps != null ? `${set.reps} reps` : "—"}
        {set.weightKg != null ? `  ·  ${set.weightKg} kg` : ""}
        {set.rpe != null ? `  ·  RPE ${set.rpe}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, gap: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  header: { marginBottom: 16, gap: 4 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#6b7280", textTransform: "capitalize" },
  notes: { marginTop: 4, fontSize: 14, color: "#374151", fontStyle: "italic" },
  exerciseName: { fontSize: 14, fontWeight: "700", color: "#2563eb", marginTop: 16, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  setRow: { backgroundColor: "#fff", borderRadius: 8, padding: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  setCompleted: { backgroundColor: "#eff6ff" },
  setNum: { fontSize: 13, fontWeight: "600", color: "#374151" },
  setDetail: { fontSize: 13, color: "#6b7280" },
});
