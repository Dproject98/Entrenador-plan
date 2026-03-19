import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSession, useUpdateSession, useDeleteSession, useUpdateSet, useDeleteSet } from "@/hooks/useWorkouts";
import type { WorkoutSet } from "@/types/api.types";

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const { data: session, isLoading } = useSession(sessionId);
  const updateSession = useUpdateSession(sessionId);
  const deleteSession = useDeleteSession();
  const updateSet = useUpdateSet(sessionId);
  const deleteSet = useDeleteSet(sessionId);

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

  const handleFinish = () => {
    if (session.endedAt) return;
    updateSession.mutate({ endedAt: new Date().toISOString() });
  };

  const handleDelete = () => {
    Alert.alert("Eliminar sesión", "¿Eliminar esta sesión? No se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteSession.mutate(sessionId, { onSuccess: () => router.back() });
        },
      },
    ]);
  };

  const handleToggleSet = (set: WorkoutSet) => {
    updateSet.mutate({ setId: set.id, completed: !set.completed });
  };

  const handleDeleteSet = (setId: string) => {
    deleteSet.mutate(setId);
  };

  // Group sets by exercise
  const grouped = session.sets.reduce<Record<string, { title: string; data: WorkoutSet[] }>>(
    (acc, set) => {
      const key = set.exercise.id;
      if (!acc[key]) acc[key] = { title: set.exercise.name, data: [] };
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
        <SessionHeader
          name={session.name}
          startedAt={session.startedAt}
          endedAt={session.endedAt}
          notes={session.notes}
          onFinish={handleFinish}
          onDelete={handleDelete}
          finishing={updateSession.isPending}
          deleting={deleteSession.isPending}
        />
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.exerciseName}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <SetRow
          set={item}
          onToggle={() => handleToggleSet(item)}
          onDelete={() => handleDeleteSet(item.id)}
        />
      )}
      ListEmptyComponent={
        <Text style={styles.noSets}>Sin series registradas todavía.</Text>
      }
    />
  );
}

function SessionHeader({
  name,
  startedAt,
  endedAt,
  notes,
  onFinish,
  onDelete,
  finishing,
  deleting,
}: {
  name?: string | null;
  startedAt: string;
  endedAt?: string | null;
  notes?: string | null;
  onFinish: () => void;
  onDelete: () => void;
  finishing: boolean;
  deleting: boolean;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{name ?? "Sesión"}</Text>
      <Text style={styles.date}>
        {new Date(startedAt).toLocaleDateString("es", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </Text>
      {notes ? <Text style={styles.notes}>{notes}</Text> : null}

      <View style={styles.headerActions}>
        {!endedAt && (
          <TouchableOpacity
            style={[styles.finishBtn, finishing && styles.btnDisabled]}
            onPress={onFinish}
            disabled={finishing}
          >
            <Text style={styles.finishBtnText}>{finishing ? "Guardando..." : "Finalizar sesión"}</Text>
          </TouchableOpacity>
        )}
        {endedAt && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>✓ Completada</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={onDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteBtnText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SetRow({
  set,
  onToggle,
  onDelete,
}: {
  set: WorkoutSet;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.setRow, set.completed && styles.setCompleted]}>
      <TouchableOpacity onPress={onToggle} style={styles.setCheck}>
        <Text style={set.completed ? styles.checkDone : styles.checkPending}>
          {set.completed ? "✓" : "○"}
        </Text>
      </TouchableOpacity>
      <View style={styles.setBody}>
        <Text style={styles.setNum}>Serie {set.setNumber}</Text>
        <Text style={styles.setDetail}>
          {[
            set.reps != null && `${set.reps} reps`,
            set.weightKg != null && `${set.weightKg} kg`,
            set.rpe != null && `RPE ${set.rpe}`,
          ]
            .filter(Boolean)
            .join("  ·  ") || "—"}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteSetText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  header: { marginBottom: 8, gap: 4 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#6b7280", textTransform: "capitalize" },
  notes: { fontSize: 14, color: "#374151", fontStyle: "italic", marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 10, marginTop: 12, alignItems: "center" },
  finishBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  finishBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  doneBadge: { backgroundColor: "#dcfce7", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  doneBadgeText: { color: "#16a34a", fontWeight: "600", fontSize: 14 },
  deleteBtn: { backgroundColor: "#fff1f2", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  deleteBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
  btnDisabled: { opacity: 0.55 },
  exerciseName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 20,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  setRow: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 10,
  },
  setCompleted: { backgroundColor: "#f0fdf4" },
  setCheck: { width: 28, alignItems: "center" },
  checkDone: { fontSize: 18, color: "#16a34a", fontWeight: "700" },
  checkPending: { fontSize: 18, color: "#9ca3af" },
  setBody: { flex: 1 },
  setNum: { fontSize: 13, fontWeight: "600", color: "#374151" },
  setDetail: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  deleteSetText: { color: "#d1d5db", fontSize: 16, fontWeight: "700" },
  noSets: { textAlign: "center", color: "#9ca3af", marginTop: 24, fontSize: 14 },
});
