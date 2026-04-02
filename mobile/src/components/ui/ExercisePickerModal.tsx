import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useExercises } from "@/hooks/useExercises";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { Exercise, MuscleGroup, WorkoutSet } from "@/types/api.types";

// ─── Label maps ──────────────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  CHEST: "Pecho",
  BACK: "Espalda",
  SHOULDERS: "Hombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  FOREARMS: "Antebrazos",
  CORE: "Core",
  GLUTES: "Glúteos",
  QUADS: "Cuádriceps",
  HAMSTRINGS: "Isquios",
  CALVES: "Gemelos",
  FULL_BODY: "Full Body",
  CARDIO: "Cardio",
};

const MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleGroup[];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddSetParams {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  rpe?: number;
  notes?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (params: AddSetParams) => Promise<void>;
  sessionSets: WorkoutSet[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExercisePickerModal({ visible, onClose, onAdd, sessionSets }: Props) {
  const [step, setStep] = useState<"pick" | "log">("pick");
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  const { data: allExercises = [], isLoading } = useExercises();

  const filtered = allExercises.filter((e) => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  const getSetNumber = (exerciseId: string) =>
    sessionSets.filter((s) => s.exercise.id === exerciseId).length + 1;

  const handlePickExercise = (ex: Exercise) => {
    setSelectedExercise(ex);
    setReps("");
    setWeight("");
    setRpe("");
    setNotes("");
    setAddedCount(0);
    setStep("log");
  };

  const handleAdd = async () => {
    if (!selectedExercise || adding) return;
    setAdding(true);
    try {
      await onAdd({
        exerciseId: selectedExercise.id,
        setNumber: getSetNumber(selectedExercise.id),
        reps: reps ? parseInt(reps, 10) : undefined,
        weightKg: weight ? parseFloat(weight) : undefined,
        rpe: rpe ? parseInt(rpe, 10) : undefined,
        notes: notes.trim() || undefined,
      });
      setReps("");
      setWeight("");
      setRpe("");
      setNotes("");
      setAddedCount((c) => c + 1);
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setStep("pick");
    setSearch("");
    setMuscleFilter(null);
    setSelectedExercise(null);
    setReps("");
    setWeight("");
    setRpe("");
    setNotes("");
    setAddedCount(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          {step === "log" ? (
            <TouchableOpacity onPress={() => setStep("pick")}>
              <Text style={styles.backBtn}>← Ejercicio</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.headerTitle}>Añadir ejercicio</Text>
          )}
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Step 1: Pick exercise ─── */}
        {step === "pick" && (
          <>
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
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
              style={styles.chipsScroll}
            >
              <TouchableOpacity
                style={[styles.chip, !muscleFilter && styles.chipActive]}
                onPress={() => setMuscleFilter(null)}
              >
                <Text style={[styles.chipText, !muscleFilter && styles.chipTextActive]}>
                  Todos
                </Text>
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
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const setCount = sessionSets.filter((s) => s.exercise.id === item.id).length;
                return (
                  <TouchableOpacity
                    style={styles.exerciseRow}
                    onPress={() => handlePickExercise(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{item.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {MUSCLE_LABELS[item.muscleGroup]}
                        {setCount > 0
                          ? ` · ${setCount} ${setCount === 1 ? "serie" : "series"} hoy`
                          : ""}
                      </Text>
                    </View>
                    <Text style={styles.exerciseArrow}>›</Text>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {isLoading ? "Cargando ejercicios..." : "Sin resultados"}
                </Text>
              }
            />
          </>
        )}

        {/* ─── Step 2: Log set ─── */}
        {step === "log" && (
          <ScrollView
            style={styles.logScroll}
            contentContainerStyle={styles.logContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.exerciseHeader}>
              <Text style={styles.logExName}>{selectedExercise?.name}</Text>
              <View style={styles.seriesBadge}>
                <Text style={styles.seriesBadgeText}>
                  Serie {selectedExercise ? getSetNumber(selectedExercise.id) : 1}
                </Text>
              </View>
            </View>

            {addedCount > 0 && (
              <View style={styles.addedBanner}>
                <Text style={styles.addedBannerText}>
                  ✓ {addedCount} {addedCount === 1 ? "serie añadida" : "series añadidas"}
                </Text>
              </View>
            )}

            <View style={styles.inputsRow}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.numInput}
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.numInput}
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>RPE</Text>
                <TextInput
                  style={styles.numInput}
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  value={rpe}
                  onChangeText={setRpe}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Notas (opcional)"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              maxLength={200}
            />

            <TouchableOpacity
              style={[styles.addBtn, adding && styles.btnDisabled]}
              onPress={handleAdd}
              disabled={adding}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>
                {adding ? "Añadiendo..." : "+ Añadir serie"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.doneBtnText}>Listo</Text>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  backBtn: {
    fontSize: typography.md,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  closeBtn: {
    fontSize: typography.lg,
    color: colors.textSecondary,
    fontWeight: typography.bold,
  },

  // Search
  searchWrap: { padding: spacing[4], paddingBottom: spacing[2] },
  searchInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
  },

  // Chips
  chipsScroll: { maxHeight: 44 },
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
  chipText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
  chipTextActive: { color: "#fff" },

  // Exercise list
  list: { flex: 1, marginTop: spacing[2] },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 1,
  },
  exerciseName: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  exerciseMeta: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 2 },
  exerciseArrow: { fontSize: 22, color: colors.textMuted },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 32,
    fontSize: typography.sm,
  },

  // Log step
  logScroll: { flex: 1 },
  logContent: { padding: spacing[4], gap: spacing[4] },
  exerciseHeader: { gap: spacing[1] },
  logExName: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  seriesBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 3,
  },
  seriesBadgeText: {
    fontSize: typography.xs,
    color: colors.primaryDark,
    fontWeight: typography.semibold,
  },

  addedBanner: {
    backgroundColor: colors.successBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.success,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  addedBannerText: {
    fontSize: typography.sm,
    color: colors.success,
    fontWeight: typography.semibold,
  },

  inputsRow: { flexDirection: "row", gap: spacing[3] },
  inputBlock: { flex: 1, gap: spacing[1] },
  inputLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  numInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.xl,
    fontWeight: typography.bold,
    textAlign: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },

  notesInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
  },

  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[3] + 2,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.55 },
  addBtnText: {
    color: "#fff",
    fontSize: typography.md,
    fontWeight: typography.bold,
  },

  doneBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[3],
    alignItems: "center",
  },
  doneBtnText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});
