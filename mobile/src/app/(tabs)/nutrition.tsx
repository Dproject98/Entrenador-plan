import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { mealsApi, nutritionApi } from "@/services/api";
import type { MealType } from "@/types/api.types";

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

function toLocalDateString(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function NutritionScreen() {
  const [date] = useState(toLocalDateString());

  const { data: meals, isLoading: mealsLoading } = useQuery({
    queryKey: ["meals", date],
    queryFn: () => mealsApi.list(date),
  });

  const { data: summary } = useQuery({
    queryKey: ["nutrition-summary", date],
    queryFn: () => nutritionApi.summary(date),
  });

  if (mealsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.dateLabel}>
        {new Date(date).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
      </Text>

      {/* Summary card */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Totales del día</Text>
          <View style={styles.macroRow}>
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <View key={key} style={styles.macroCell}>
                <Text style={styles.macroValue}>
                  {key === "calories"
                    ? `${Math.round(summary.totals[key])}`
                    : summary.totals[key].toFixed(1)}
                </Text>
                <Text style={styles.macroLabel}>
                  {key === "calories" ? "kcal" : key === "protein" ? "prot." : key === "carbs" ? "carbos" : "grasa"}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Meal slots */}
      {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as MealType[]).map((mealType) => {
        const meal = meals?.find((m) => m.mealType === mealType);
        return (
          <View key={mealType} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{MEAL_LABELS[mealType]}</Text>
              {meal ? (
                <Text style={styles.mealSub}>{meal.id}</Text>
              ) : (
                <Text style={styles.mealEmpty}>Sin registros</Text>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
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
  macroLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  mealCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mealTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  mealSub: { fontSize: 12, color: "#9ca3af" },
  mealEmpty: { fontSize: 13, color: "#9ca3af" },
});
