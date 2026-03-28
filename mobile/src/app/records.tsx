import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Modal,
  RefreshControl,
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/lib/theme";
import { usePersonalRecords, useExerciseProgression } from "@/hooks/useAnalytics";
import type { PersonalRecord } from "@/types/api.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: "Pecho", BACK: "Espalda", SHOULDERS: "Hombros",
  BICEPS: "Bíceps", TRICEPS: "Tríceps", FOREARMS: "Antebrazos",
  CORE: "Core", GLUTES: "Glúteos", QUADS: "Cuádriceps",
  HAMSTRINGS: "Isquios", CALVES: "Gemelos", FULL_BODY: "Cuerpo completo",
  CARDIO: "Cardio",
};

// ─── Progression Chart Modal ──────────────────────────────────────────────────

function ProgressionModal({
  exerciseId,
  exerciseName,
  onClose,
}: {
  exerciseId: string;
  exerciseName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useExerciseProgression(exerciseId);

  const entries = data?.progression ?? [];
  const maxORM = Math.max(...entries.map((e) => e.estimated1RM), 1);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={m.container}>
        <View style={m.header}>
          <Text style={m.title} numberOfLines={1}>{exerciseName}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={m.close}>✕</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : entries.length < 2 ? (
          <View style={m.empty}>
            <Text style={m.emptyText}>Necesitas al menos 2 sesiones para ver la progresión</Text>
          </View>
        ) : (
          <ScrollView style={m.body} contentContainerStyle={{ padding: 20, gap: 16 }}>
            {/* 1RM trend chart */}
            <View style={m.chartCard}>
              <Text style={m.chartTitle}>1RM estimado (Epley)</Text>
              <View style={m.chart}>
                {entries.map((entry, i) => {
                  const h = Math.max(4, (entry.estimated1RM / maxORM) * 80);
                  const isLast = i === entries.length - 1;
                  return (
                    <View key={entry.date} style={m.barCol}>
                      {isLast && (
                        <Text style={m.barTop}>{entry.estimated1RM}</Text>
                      )}
                      <View style={m.barWrap}>
                        <View
                          style={[
                            m.bar,
                            { height: h },
                            isLast && { backgroundColor: colors.primary },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={m.axisRow}>
                <Text style={m.axisLabel}>{new Date(entries[0].date).toLocaleDateString("es", { month: "short", day: "numeric" })}</Text>
                <Text style={m.axisLabel}>{new Date(entries[entries.length - 1].date).toLocaleDateString("es", { month: "short", day: "numeric" })}</Text>
              </View>
            </View>

            {/* History list */}
            <Text style={m.sectionTitle}>Historial de mejores series</Text>
            {[...entries].reverse().map((entry) => (
              <View key={entry.date} style={m.histRow}>
                <Text style={m.histDate}>
                  {new Date(entry.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
                <Text style={m.histSet}>{entry.weightKg} kg × {entry.reps} reps</Text>
                <Text style={m.hist1RM}>~{entry.estimated1RM} kg 1RM</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── PR Card ──────────────────────────────────────────────────────────────────

function PRCard({ item, onPress }: { item: PersonalRecord; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.exerciseName} numberOfLines={1}>{item.exercise.name}</Text>
          <Text style={s.muscleGroup}>{MUSCLE_LABELS[item.exercise.muscleGroup] ?? item.exercise.muscleGroup}</Text>
        </View>
        <View style={s.badge1RM}>
          <Text style={s.badge1RMText}>{item.estimated1RM} kg</Text>
          <Text style={s.badge1RMLabel}>1RM est.</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        <View style={s.stat}>
          <Text style={s.statVal}>{item.maxWeightKg} kg</Text>
          <Text style={s.statLbl}>Máx. peso</Text>
          <Text style={s.statSub}>× {item.maxWeightReps} reps</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statVal}>{item.maxReps}</Text>
          <Text style={s.statLbl}>Máx. reps</Text>
          <Text style={s.statSub}>@ {item.maxRepsWeight} kg</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statVal}>{item.totalSets}</Text>
          <Text style={s.statLbl}>Series totales</Text>
        </View>
      </View>
      <Text style={s.achieved}>
        PR: {new Date(item.achievedAt).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecordsScreen() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const { data, isLoading, refetch, isRefetching } = usePersonalRecords();

  const records = data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Records Personales", headerBackTitle: "Atrás" }} />
      <FlatList
        data={records}
        keyExtractor={(item) => item.exercise.id}
        contentContainerStyle={s.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏆</Text>
              <Text style={s.emptyTitle}>Sin records aún</Text>
              <Text style={s.emptySubtitle}>
                Completa series con peso para ver tus records personales
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <PRCard
            item={item}
            onPress={() => setSelected({ id: item.exercise.id, name: item.exercise.name })}
          />
        )}
        style={s.container}
      />

      {selected && (
        <ProgressionModal
          exerciseId={selected.id}
          exerciseName={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  exerciseName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  muscleGroup: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  badge1RM: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  badge1RMText: { fontSize: 16, fontWeight: "700", color: colors.primaryDark },
  badge1RMLabel: { fontSize: 10, color: colors.primaryDark, marginTop: 1 },

  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center", gap: 1 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statVal: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  statLbl: { fontSize: 10, color: colors.textMuted },
  statSub: { fontSize: 10, color: colors.textMuted },

  achieved: { fontSize: 11, color: colors.textMuted },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, flex: 1, marginRight: 12 },
  close: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  body: { flex: 1 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 22 },

  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  chartTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 96, gap: 2 },
  barCol: { flex: 1, alignItems: "center" },
  barTop: { fontSize: 9, color: colors.primary, marginBottom: 2 },
  barWrap: { flex: 1, justifyContent: "flex-end", width: "100%" },
  bar: { borderRadius: 2, backgroundColor: colors.gray4, width: "100%" },
  axisRow: { flexDirection: "row", justifyContent: "space-between" },
  axisLabel: { fontSize: 10, color: colors.textMuted },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  histDate: { flex: 1, fontSize: 12, color: colors.textSecondary },
  histSet: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
  hist1RM: { fontSize: 12, color: colors.primary, width: 72, textAlign: "right" },
});
