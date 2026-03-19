import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMeals, useNutritionSummary, useCreateMeal } from "@/hooks/useNutrition";
import type { MealLog, MealType } from "@/types/api.types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

const MEAL_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

function toLocalDateString(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function NutritionScreen() {
  const [date] = useState(toLocalDateString());

  const { data: meals, isLoading } = useMeals(date);
  const { data: summary } = useNutritionSummary(date);
  const createMeal = useCreateMeal();

  const handleCreateMeal = (mealType: MealType) => {
    createMeal.mutate(
      { date, mealType },
      {
        onError: () => Alert.alert("Error", "No se pudo crear el registro de comida"),
      }
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  const mealMap = new Map(meals?.map((m) => [m.mealType, m]));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateLabel}>
        {new Date(date + "T12:00:00").toLocaleDateString("es", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </Text>

      {/* Daily totals */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Totales del día</Text>
        {summary ? (
          <View style={styles.macroRow}>
            <MacroCell value={`${Math.round(summary.totals.calories)}`} unit="kcal" label="Calorías" />
            <MacroCell value={summary.totals.protein.toFixed(1)} unit="g" label="Proteína" />
            <MacroCell value={summary.totals.carbs.toFixed(1)} unit="g" label="Carbos" />
            <MacroCell value={summary.totals.fat.toFixed(1)} unit="g" label="Grasa" />
          </View>
        ) : (
          <Text style={styles.empty}>Sin registros hoy</Text>
        )}
      </View>

      {/* Meal slots */}
      {MEAL_ORDER.map((mealType) => {
        const meal = mealMap.get(mealType);
        return (
          <MealSlot
            key={mealType}
            mealType={mealType}
            meal={meal}
            onAdd={() => handleCreateMeal(mealType)}
            adding={createMeal.isPending && createMeal.variables?.mealType === mealType}
          />
        );
      })}
    </ScrollView>
  );
}

function MealSlot({
  mealType,
  meal,
  onAdd,
  adding,
}: {
  mealType: MealType;
  meal?: MealLog;
  onAdd: () => void;
  adding: boolean;
}) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
        {!meal && (
          <TouchableOpacity
            style={[styles.addBtn, adding && styles.addBtnDisabled]}
            onPress={onAdd}
            disabled={adding}
          >
            <Text style={styles.addBtnText}>{adding ? "..." : "+ Agregar"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {meal ? (
        <Text style={styles.mealRegistered}>Registrado ✓</Text>
      ) : (
        <Text style={styles.mealEmpty}>Sin alimentos registrados</Text>
      )}
    </View>
  );
}

function MacroCell({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  dateLabel: { fontSize: 16, fontWeight: "600", color: "#374151", textTransform: "capitalize" },
  summaryCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  macroRow: { flexDirection: "row", justifyContent: "space-between" },
  macroCell: { alignItems: "center", flex: 1 },
  macroValue: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  macroUnit: { fontSize: 10, color: "#2563eb" },
  macroLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  empty: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingVertical: 4 },
  mealCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mealTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  addBtn: { backgroundColor: "#eff6ff", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  mealRegistered: { fontSize: 13, color: "#16a34a" },
  mealEmpty: { fontSize: 13, color: "#9ca3af" },
});
