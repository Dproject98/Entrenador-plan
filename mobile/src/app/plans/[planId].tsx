import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  usePlan,
  useCreateWeek,
  useCreatePlanWorkout,
  useCreatePlannedExercise,
  useDeletePlannedExercise,
  useDeletePlanWorkout,
} from "@/hooks/usePlans";
import { useExercises } from "@/hooks/useExercises";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { Exercise, MuscleGroup, PlanWeek, PlanWorkout, PlannedExercise } from "@/types/api.types";

// ─── Label maps ──────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
  5: "Viernes", 6: "Sábado", 7: "Domingo",
};
const DAYS = [1, 2, 3, 4, 5, 6, 7];

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Pecho", BACK: "Espalda", SHOULDERS: "Hombros",
  BICEPS: "Bíceps", TRICEPS: "Tríceps", FOREARMS: "Antebrazos",
  CORE: "Core", GLUTES: "Glúteos", QUADS: "Cuádriceps",
  HAMSTRINGS: "Isquios", CALVES: "Gemelos", FULL_BODY: "Full Body", CARDIO: "Cardio",
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { data: plan, isLoading } = usePlan(planId);
  const createWeek = useCreateWeek(planId);

  // Modal state
  const [addWorkoutTarget, setAddWorkoutTarget] = useState<PlanWeek | null>(null);
  const [addExerciseTarget, setAddExerciseTarget] = useState<{
    week: PlanWeek;
    workout: PlanWorkout;
  } | null>(null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Plan no encontrado</Text>
      </View>
    );
  }

  const handleAddWeek = () => {
    const nextNumber = plan.weeks.length + 1;
    createWeek.mutate(nextNumber, {
      onError: () => Alert.alert("Error", "No se pudo añadir la semana"),
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Plan header */}
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <Text style={styles.planTitle}>{plan.name}</Text>
            {plan.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Activo</Text>
              </View>
            )}
          </View>
          {plan.description && (
            <Text style={styles.planDesc}>{plan.description}</Text>
          )}
          <Text style={styles.planMeta}>
            {plan.weeks.length} {plan.weeks.length === 1 ? "semana" : "semanas"}
          </Text>
        </View>

        {/* Weeks */}
        {plan.weeks.length === 0 ? (
          <View style={styles.emptyWeeks}>
            <Text style={styles.emptyTitle}>Sin semanas</Text>
            <Text style={styles.emptySub}>Añade una semana para empezar a planificar</Text>
          </View>
        ) : (
          plan.weeks
            .slice()
            .sort((a, b) => a.weekNumber - b.weekNumber)
            .map((week) => (
              <WeekSection
                key={week.id}
                week={week}
                planId={planId}
                onAddWorkout={() => setAddWorkoutTarget(week)}
                onAddExercise={(workout) =>
                  setAddExerciseTarget({ week, workout })
                }
              />
            ))
        )}

        {/* Add week button */}
        <TouchableOpacity
          style={[styles.addWeekBtn, createWeek.isPending && styles.btnDisabled]}
          onPress={handleAddWeek}
          disabled={createWeek.isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.addWeekBtnText}>
            {createWeek.isPending ? "Añadiendo..." : "+ Añadir semana"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add workout modal */}
      <AddWorkoutModal
        week={addWorkoutTarget}
        planId={planId}
        onClose={() => setAddWorkoutTarget(null)}
      />

      {/* Add exercise modal */}
      <AddPlanExerciseModal
        target={addExerciseTarget}
        planId={planId}
        onClose={() => setAddExerciseTarget(null)}
      />
    </>
  );
}

// ─── WeekSection ─────────────────────────────────────────────────────────────

function WeekSection({
  week,
  planId,
  onAddWorkout,
  onAddExercise,
}: {
  week: PlanWeek;
  planId: string;
  onAddWorkout: () => void;
  onAddExercise: (workout: PlanWorkout) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const deleteWorkout = useDeletePlanWorkout(planId, week.id);

  const handleDeleteWorkout = (workout: PlanWorkout) => {
    Alert.alert(
      "Eliminar entrenamiento",
      `¿Eliminar el entrenamiento del ${DAY_LABELS[workout.dayOfWeek]}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteWorkout.mutate(workout.id),
        },
      ]
    );
  };

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity
        style={styles.weekHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.weekTitle}>Semana {week.weekNumber}</Text>
        <View style={styles.weekHeaderRight}>
          <Text style={styles.weekMeta}>
            {week.workouts.length} entreno{week.workouts.length !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.weekChevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.weekBody}>
          {week.workouts.length === 0 ? (
            <Text style={styles.noWorkouts}>Sin entrenamientos</Text>
          ) : (
            week.workouts
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
              .map((workout) => (
                <WorkoutItem
                  key={workout.id}
                  workout={workout}
                  planId={planId}
                  weekId={week.id}
                  onAddExercise={() => onAddExercise(workout)}
                  onDelete={() => handleDeleteWorkout(workout)}
                />
              ))
          )}

          <TouchableOpacity
            style={styles.addWorkoutBtn}
            onPress={onAddWorkout}
            activeOpacity={0.8}
          >
            <Text style={styles.addWorkoutBtnText}>+ Añadir día</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── WorkoutItem ─────────────────────────────────────────────────────────────

function WorkoutItem({
  workout,
  planId,
  weekId,
  onAddExercise,
  onDelete,
}: {
  workout: PlanWorkout;
  planId: string;
  weekId: string;
  onAddExercise: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.workoutItem}>
      <View style={styles.workoutHeader}>
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{DAY_LABELS[workout.dayOfWeek]}</Text>
        </View>
        {workout.name && (
          <Text style={styles.workoutName}>{workout.name}</Text>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteWorkoutBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {workout.plannedExercises.length > 0 ? (
        workout.plannedExercises
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((ex) => (
            <ExerciseItem
              key={ex.id}
              exercise={ex}
              planId={planId}
              weekId={weekId}
              workoutId={workout.id}
            />
          ))
      ) : (
        <Text style={styles.noExercises}>Sin ejercicios</Text>
      )}

      <TouchableOpacity
        style={styles.addExBtn}
        onPress={onAddExercise}
        activeOpacity={0.8}
      >
        <Text style={styles.addExBtnText}>+ Ejercicio</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── ExerciseItem ─────────────────────────────────────────────────────────────

function ExerciseItem({
  exercise,
  planId,
  weekId,
  workoutId,
}: {
  exercise: PlannedExercise;
  planId: string;
  weekId: string;
  workoutId: string;
}) {
  const deleteEx = useDeletePlannedExercise(planId, weekId, workoutId);

  const handleDelete = () => {
    Alert.alert("Eliminar ejercicio", `¿Eliminar ${exercise.exercise.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteEx.mutate(exercise.id),
      },
    ]);
  };

  return (
    <View style={styles.exRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.exName}>{exercise.exercise.name}</Text>
        <Text style={styles.exMeta}>
          {exercise.sets} × {exercise.reps}
          {exercise.restSeconds ? ` · ${exercise.restSeconds}s descanso` : ""}
        </Text>
      </View>
      <Text style={styles.exMuscle}>
        {MUSCLE_LABELS[exercise.exercise.muscleGroup]}
      </Text>
      <TouchableOpacity
        onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={deleteEx.isPending}
      >
        <Text style={styles.deleteExBtn}>{deleteEx.isPending ? "..." : "✕"}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── AddWorkoutModal ──────────────────────────────────────────────────────────

function AddWorkoutModal({
  week,
  planId,
  onClose,
}: {
  week: PlanWeek | null;
  planId: string;
  onClose: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [name, setName] = useState("");
  const createWorkout = useCreatePlanWorkout(planId, week?.id ?? "");

  const handleAdd = () => {
    if (!week) return;
    createWorkout.mutate(
      { dayOfWeek: selectedDay, name: name.trim() || undefined },
      {
        onSuccess: () => {
          setSelectedDay(1);
          setName("");
          onClose();
        },
        onError: () => Alert.alert("Error", "No se pudo añadir el entrenamiento"),
      }
    );
  };

  return (
    <Modal
      visible={!!week}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Añadir entrenamiento</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>Día de la semana</Text>
          <View style={styles.dayGrid}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, selectedDay === d && styles.dayChipActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text style={[styles.dayChipText, selectedDay === d && styles.dayChipTextActive]}>
                  {DAY_LABELS[d].slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: spacing[4] }]}>Nombre (opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Pecho y tríceps"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />

          <TouchableOpacity
            style={[styles.confirmBtn, createWorkout.isPending && styles.btnDisabled]}
            onPress={handleAdd}
            disabled={createWorkout.isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {createWorkout.isPending ? "Añadiendo..." : "Añadir entrenamiento"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── AddPlanExerciseModal ─────────────────────────────────────────────────────

function AddPlanExerciseModal({
  target,
  planId,
  onClose,
}: {
  target: { week: PlanWeek; workout: PlanWorkout } | null;
  planId: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"pick" | "params">("pick");
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8-12");
  const [rest, setRest] = useState("90");

  const { data: allExercises = [], isLoading } = useExercises();
  const createExercise = useCreatePlannedExercise(
    planId,
    target?.week.id ?? "",
    target?.workout.id ?? ""
  );

  const filtered = allExercises.filter((e) => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  const handlePickExercise = (ex: Exercise) => {
    setSelectedExercise(ex);
    setStep("params");
  };

  const handleAdd = () => {
    if (!selectedExercise || !target) return;
    const orderIndex = target.workout.plannedExercises.length;

    createExercise.mutate(
      {
        exerciseId: selectedExercise.id,
        sets: parseInt(sets, 10) || 3,
        reps: reps.trim() || "8-12",
        restSeconds: rest ? parseInt(rest, 10) : undefined,
        orderIndex,
      },
      {
        onSuccess: () => {
          setStep("pick");
          setSearch("");
          setMuscleFilter(null);
          setSelectedExercise(null);
          setSets("3");
          setReps("8-12");
          setRest("90");
          onClose();
        },
        onError: () => Alert.alert("Error", "No se pudo añadir el ejercicio"),
      }
    );
  };

  const handleClose = () => {
    setStep("pick");
    setSearch("");
    setMuscleFilter(null);
    setSelectedExercise(null);
    setSets("3");
    setReps("8-12");
    setRest("90");
    onClose();
  };

  const MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

  return (
    <Modal
      visible={!!target}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalHeader}>
          {step === "params" ? (
            <TouchableOpacity onPress={() => setStep("pick")}>
              <Text style={styles.backBtn}>← Ejercicio</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.modalTitle}>Añadir ejercicio al plan</Text>
          )}
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        {step === "pick" ? (
          <>
            <View style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
              <TextInput
                style={styles.textInput}
                placeholder="Buscar ejercicio..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={{ maxHeight: 44 }}
            >
              <TouchableOpacity
                style={[styles.chip, !muscleFilter && styles.chipActive]}
                onPress={() => setMuscleFilter(null)}
              >
                <Text style={[styles.chipText, !muscleFilter && styles.chipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {MUSCLES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, muscleFilter === m && styles.chipActive]}
                  onPress={() => setMuscleFilter(muscleFilter === m ? null : m)}
                >
                  <Text style={[styles.chipText, muscleFilter === m && styles.chipTextActive]}>
                    {MUSCLE_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={{ flex: 1, marginTop: spacing[2] }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exPickRow}
                  onPress={() => handlePickExercise(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exPickName}>{item.name}</Text>
                    <Text style={styles.exPickMeta}>{MUSCLE_LABELS[item.muscleGroup]}</Text>
                  </View>
                  <Text style={{ fontSize: 20, color: colors.textMuted }}>›</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: spacing[4] }} />
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", color: colors.textMuted, marginTop: 32, fontSize: typography.sm }}>
                  {isLoading ? "Cargando..." : "Sin resultados"}
                </Text>
              }
            />
          </>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalSubtitle}>{selectedExercise?.name}</Text>

            <View style={styles.paramsGrid}>
              <View style={styles.paramBlock}>
                <Text style={styles.fieldLabel}>Series</Text>
                <TextInput
                  style={styles.paramInput}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.paramBlock}>
                <Text style={styles.fieldLabel}>Reps</Text>
                <TextInput
                  style={styles.paramInput}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="8-12"
                  placeholderTextColor={colors.textMuted}
                  maxLength={10}
                />
              </View>
              <View style={styles.paramBlock}>
                <Text style={styles.fieldLabel}>Descanso (s)</Text>
                <TextInput
                  style={styles.paramInput}
                  value={rest}
                  onChangeText={setRest}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <Text style={styles.repsHint}>
              El campo Reps acepta formatos como: 8, 8-12, AMRAP, 5×5
            </Text>

            <TouchableOpacity
              style={[styles.confirmBtn, createExercise.isPending && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={createExercise.isPending}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>
                {createExercise.isPending ? "Añadiendo..." : "Añadir al plan"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing[4], gap: spacing[3], paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: typography.md },

  planHeader: { marginBottom: spacing[2], gap: 4 },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], flexWrap: "wrap" },
  planTitle: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success,
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: typography.xs,
    color: colors.success,
    fontWeight: typography.semibold,
  },
  planDesc: { fontSize: typography.sm, color: colors.textSecondary },
  planMeta: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },

  emptyWeeks: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[6],
    alignItems: "center",
    gap: spacing[2],
  },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  emptySub: { fontSize: typography.sm, color: colors.textMuted, textAlign: "center" },

  // Week
  weekCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
  },
  weekTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  weekHeaderRight: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  weekMeta: { fontSize: typography.xs, color: colors.textMuted },
  weekChevron: { fontSize: typography.sm, color: colors.textMuted },
  weekBody: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing[3], gap: spacing[3] },
  noWorkouts: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.sm,
    paddingVertical: spacing[2],
  },

  addWorkoutBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.sm,
    paddingVertical: spacing[2] + 2,
    alignItems: "center",
  },
  addWorkoutBtnText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
  },

  // Workout item
  workoutItem: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  workoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  dayBadgeText: {
    fontSize: typography.xs,
    color: colors.primaryDark,
    fontWeight: typography.bold,
  },
  workoutName: { fontSize: typography.sm, color: colors.textSecondary },
  noExercises: {
    fontSize: typography.xs,
    color: colors.textMuted,
    padding: spacing[3],
    fontStyle: "italic",
  },

  deleteWorkoutBtn: {
    fontSize: 14,
    color: colors.gray4,
    fontWeight: typography.bold,
  },

  addExBtn: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing[2] + 2,
    alignItems: "center",
  },
  addExBtnText: {
    fontSize: typography.xs,
    color: colors.primary,
    fontWeight: typography.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Exercise item
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[2],
  },
  exName: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary },
  exMeta: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },
  exMuscle: { fontSize: typography.xs, color: colors.textMuted },
  deleteExBtn: { fontSize: 13, color: colors.gray4, fontWeight: typography.bold },

  addWeekBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing[3] + 2,
    alignItems: "center",
    marginTop: spacing[2],
  },
  addWeekBtnText: {
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  btnDisabled: { opacity: 0.55 },

  // Modal shared
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary },
  modalSubtitle: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  modalClose: { fontSize: typography.lg, color: colors.textSecondary, fontWeight: typography.bold },
  backBtn: { fontSize: typography.md, color: colors.primary, fontWeight: typography.semibold },
  modalBody: { padding: spacing[4], gap: spacing[3] },

  fieldLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
  },

  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  dayChip: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bgCard,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: typography.sm, color: colors.textSecondary, fontWeight: typography.medium },
  dayChipTextActive: { color: "#fff", fontWeight: typography.semibold },

  paramsGrid: { flexDirection: "row", gap: spacing[3] },
  paramBlock: { flex: 1, gap: spacing[1] },
  paramInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.bold,
    textAlign: "center",
    paddingVertical: spacing[3],
  },
  repsHint: {
    fontSize: typography.xs,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[3] + 2,
    alignItems: "center",
    marginTop: spacing[2],
  },
  confirmBtnText: { color: "#fff", fontSize: typography.md, fontWeight: typography.bold },

  // Exercise picker (inside AddPlanExerciseModal)
  chips: { paddingHorizontal: spacing[4], gap: spacing[2], alignItems: "center" },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    backgroundColor: colors.bgCard,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.xs, color: colors.textSecondary, fontWeight: typography.medium },
  chipTextActive: { color: "#fff" },

  exPickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  exPickName: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  exPickMeta: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
});
