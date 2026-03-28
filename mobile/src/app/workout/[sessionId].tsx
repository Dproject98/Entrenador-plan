import { useState } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSession, useUpdateSession, useDeleteSession, useUpdateSet, useDeleteSet } from "@/hooks/useWorkouts";
import { SessionDetailSkeleton } from "@/components/ui/Skeleton";
import { RestTimer } from "@/components/ui/RestTimer";
import { useTimerStore } from "@/store/timer.store";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { WorkoutSet } from "@/types/api.types";

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [showTimer, setShowTimer] = useState(false);

  const { data: session, isLoading } = useSession(sessionId);
  const updateSession = useUpdateSession(sessionId);
  const deleteSession = useDeleteSession();
  const updateSet = useUpdateSet(sessionId);
  const deleteSet = useDeleteSet(sessionId);
  const startTimer = useTimerStore((s) => s.start);

  if (isLoading) return <SessionDetailSkeleton />;

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
    // Auto-start rest timer when marking a set as completed
    if (!set.completed) {
      startTimer();
      setShowTimer(true);
    }
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
        <>
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
          {/* Rest timer toggle */}
          <TouchableOpacity
            style={styles.timerToggle}
            onPress={() => setShowTimer((v) => !v)}
          >
            <Text style={styles.timerToggleText}>
              ⏱ Temporizador de descanso {showTimer ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>
          {showTimer && (
            <View style={{ marginBottom: spacing[3] }}>
              <RestTimer />
            </View>
          )}
        </>
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
            activeOpacity={0.8}
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
          activeOpacity={0.7}
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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing[4], paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: typography.md },

  header: { marginBottom: spacing[2], gap: 4 },
  title: { fontSize: typography["2xl"], fontWeight: typography.bold, color: colors.textPrimary },
  date: { fontSize: typography.sm, color: colors.textSecondary, textTransform: "capitalize" },
  notes: { fontSize: typography.sm, color: colors.textSecondary, fontStyle: "italic", marginTop: 4 },

  headerActions: { flexDirection: "row", gap: spacing[2], marginTop: spacing[3], alignItems: "center" },
  finishBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2] + 1,
  },
  finishBtnText: { color: colors.textInverted, fontWeight: typography.semibold, fontSize: typography.sm },
  doneBadge: {
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 1,
    borderWidth: 1,
    borderColor: colors.success,
  },
  doneBadgeText: { color: colors.success, fontWeight: typography.semibold, fontSize: typography.sm },
  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 1,
  },
  deleteBtnText: { color: colors.danger, fontWeight: typography.semibold, fontSize: typography.sm },
  btnDisabled: { opacity: 0.55 },

  exerciseName: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.primary,
    marginTop: spacing[5],
    marginBottom: spacing[2],
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  setRow: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: spacing[3],
  },
  setCompleted: { backgroundColor: colors.successBg, borderColor: colors.success },
  setCheck: { width: 28, alignItems: "center" },
  checkDone: { fontSize: 18, color: colors.success, fontWeight: typography.bold },
  checkPending: { fontSize: 18, color: colors.gray4 },
  setBody: { flex: 1 },
  setNum: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary },
  setDetail: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 1 },
  deleteSetText: { color: colors.gray3, fontSize: 16, fontWeight: typography.bold },
  noSets: { textAlign: "center", color: colors.textMuted, marginTop: 24, fontSize: typography.sm },

  timerToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[2],
    marginBottom: spacing[2],
    borderRadius: radius.sm,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerToggleText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.semibold },
});
