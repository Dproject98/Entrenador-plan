import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useMeals, useNutritionSummary, useCreateMeal } from "@/hooks/useNutrition";
import { NutritionSkeleton } from "@/components/ui/Skeleton";
import { MealDetailModal } from "@/components/ui/MealDetailModal";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { MealLog, MealType } from "@/types/api.types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: "☀️",
  LUNCH: "🕛",
  DINNER: "🌙",
  SNACK: "🍎",
};

const MEAL_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

function toLocalDateString(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function NutritionScreen() {
  const [date] = useState(toLocalDateString());
  const [openMeal, setOpenMeal] = useState<MealLog | null>(null);

  const { data: meals, isLoading } = useMeals(date);
  const { data: summary } = useNutritionSummary(date);
  const createMeal = useCreateMeal();

  if (isLoading) return <NutritionSkeleton />;

  const mealMap = new Map(meals?.map((m) => [m.mealType, m]));

  const handleCreate = (mealType: MealType) => {
    createMeal.mutate(
      { date, mealType },
      {
        onSuccess: (newMeal) => setOpenMeal(newMeal),
        onError: () => Alert.alert("Error", "No se pudo crear el registro"),
      }
    );
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateLabel}>
        {new Date(date + "T12:00:00").toLocaleDateString("es", {
          weekday: "long", day: "numeric", month: "long",
        })}
      </Text>

      {/* Daily totals */}
      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>
              {Math.round(summary.totals.calories)}
            </Text>
            <Text style={styles.calorieUnit}>kcal</Text>
          </View>
          <View style={styles.macroBar}>
            <View style={styles.macroBarItem}>
              <View style={[styles.macroBarDot, { backgroundColor: "#3B82F6" }]} />
              <Text style={styles.macroBarLabel}>Prot</Text>
              <Text style={styles.macroBarValue}>{summary.totals.protein.toFixed(0)}g</Text>
            </View>
            <View style={styles.macroBarItem}>
              <View style={[styles.macroBarDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.macroBarLabel}>Carb</Text>
              <Text style={styles.macroBarValue}>{summary.totals.carbs.toFixed(0)}g</Text>
            </View>
            <View style={styles.macroBarItem}>
              <View style={[styles.macroBarDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.macroBarLabel}>Gras</Text>
              <Text style={styles.macroBarValue}>{summary.totals.fat.toFixed(0)}g</Text>
            </View>
          </View>
        </View>
      )}

      {/* Meal slots */}
      <View style={styles.mealsSection}>
        {MEAL_ORDER.map((mealType) => {
          const meal = mealMap.get(mealType);
          const adding = createMeal.isPending && createMeal.variables?.mealType === mealType;
          return (
            <MealSlot
              key={mealType}
              mealType={mealType}
              meal={meal}
              onAdd={() => handleCreate(mealType)}
              onOpen={() => meal && setOpenMeal(meal)}
              adding={adding}
            />
          );
        })}
      </View>
    </ScrollView>

    {openMeal && (
      <MealDetailModal
        visible={!!openMeal}
        mealId={openMeal.id}
        mealType={openMeal.mealType}
        date={date}
        onClose={() => setOpenMeal(null)}
      />
    )}
    </>
  );
}

function MealSlot({
  mealType,
  meal,
  onAdd,
  onOpen,
  adding,
}: {
  mealType: MealType;
  meal?: MealLog;
  onAdd: () => void;
  onOpen: () => void;
  adding: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={meal ? onOpen : undefined}
      activeOpacity={meal ? 0.75 : 1}
    >
      <View style={styles.mealLeft}>
        <Text style={styles.mealIcon}>{MEAL_ICONS[mealType]}</Text>
        <View>
          <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
          {meal ? (
            <Text style={styles.mealRegistered}>Toca para ver y añadir</Text>
          ) : (
            <Text style={styles.mealEmpty}>Sin alimentos</Text>
          )}
        </View>
      </View>
      {!meal && (
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={onAdd}
          disabled={adding}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>{adding ? "..." : "+ Agregar"}</Text>
        </TouchableOpacity>
      )}
      {meal && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing[4], gap: spacing[3] },

  dateLabel: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: "capitalize",
    marginBottom: spacing[1],
  },

  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    alignItems: "center",
    gap: spacing[3],
  },
  calorieRow: { flexDirection: "row", alignItems: "baseline", gap: spacing[1] },
  calorieValue: { fontSize: 40, fontWeight: typography.bold, color: colors.textPrimary, lineHeight: 48 },
  calorieUnit: { fontSize: typography.lg, color: colors.textSecondary, fontWeight: typography.medium },
  macroBar: {
    flexDirection: "row",
    gap: spacing[5],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    width: "100%",
    justifyContent: "center",
  },
  macroBarItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  macroBarDot: { width: 8, height: 8, borderRadius: radius.full },
  macroBarLabel: { fontSize: typography.sm, color: colors.textSecondary },
  macroBarValue: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.textPrimary },

  mealsSection: { gap: spacing[2] },
  mealCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mealLeft: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  mealIcon: { fontSize: 22 },
  mealTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  mealRegistered: { fontSize: typography.xs, color: colors.success, marginTop: 2 },
  mealEmpty: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.semibold },
  chevron: { fontSize: 22, color: colors.textMuted },
});
