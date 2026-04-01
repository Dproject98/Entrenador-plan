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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMealDetail, useFoods, useAddEntry, useDeleteEntry } from "@/hooks/useNutrition";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { MealType, Food, MealEntry } from "@/types/api.types";

// ─── Label maps ──────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Snack",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  mealId: string;
  mealType: MealType;
  date: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MealDetailModal({ visible, mealId, mealType, date, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("");

  const { data: meal, isLoading } = useMealDetail(mealId);
  const { data: foodResults, isLoading: searchLoading } = useFoods(search);
  const addEntry = useAddEntry(mealId, date);
  const deleteEntry = useDeleteEntry(mealId, date);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity("100");
    setSearch("");
  };

  const handleAddEntry = () => {
    if (!selectedFood || !quantity) return;
    const quantityG = parseFloat(quantity);
    if (isNaN(quantityG) || quantityG <= 0) return;

    addEntry.mutate(
      { foodId: selectedFood.id, quantityG },
      {
        onSuccess: () => {
          setSelectedFood(null);
          setQuantity("");
        },
        onError: () => Alert.alert("Error", "No se pudo añadir el alimento"),
      }
    );
  };

  const handleDeleteEntry = (entry: MealEntry) => {
    Alert.alert("Eliminar", `¿Eliminar ${entry.food.name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteEntry.mutate(entry.id),
      },
    ]);
  };

  const macros = (food: Food, grams: number) => ({
    cal: Math.round((food.caloriesPer100g * grams) / 100),
    prot: ((food.proteinPer100g * grams) / 100).toFixed(1),
    carb: ((food.carbsPer100g * grams) / 100).toFixed(1),
    fat: ((food.fatPer100g * grams) / 100).toFixed(1),
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{MEAL_LABELS[mealType]}</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Macro summary ─── */}
        {meal && (
          <View style={styles.macroRow}>
            <MacroChip label="kcal" value={Math.round(meal.macros.calories).toString()} color={colors.primary} />
            <MacroChip label="prot" value={`${meal.macros.protein.toFixed(0)}g`} color="#3B82F6" />
            <MacroChip label="carb" value={`${meal.macros.carbs.toFixed(0)}g`} color="#F59E0B" />
            <MacroChip label="gras" value={`${meal.macros.fat.toFixed(0)}g`} color="#EF4444" />
          </View>
        )}

        {/* ─── Entries list ─── */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
        ) : meal?.entries && meal.entries.length > 0 ? (
          <FlatList
            data={meal.entries}
            keyExtractor={(item) => item.id}
            style={styles.entriesList}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const m = macros(item.food, item.quantityG);
              return (
                <View style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{item.food.name}</Text>
                    <Text style={styles.entryMeta}>
                      {item.quantityG}g · {m.cal} kcal · P:{m.prot}g C:{m.carb}g G:{m.fat}g
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteEntry(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteEntryBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          !isLoading && (
            <Text style={styles.emptyEntries}>Sin alimentos añadidos</Text>
          )
        )}

        {/* ─── Divider ─── */}
        <View style={styles.divider} />

        {/* ─── Add food section ─── */}
        <View style={styles.addSection}>
          <Text style={styles.addSectionTitle}>Añadir alimento</Text>

          {selectedFood ? (
            /* ── Selected food: quantity input ── */
            <View style={styles.selectedFoodBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                <Text style={styles.selectedFoodMeta}>
                  {selectedFood.caloriesPer100g} kcal / 100g
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFood(null)}>
                <Text style={styles.changeFoodBtn}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Food search ── */
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar alimento..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          )}

          {/* Search results */}
          {!selectedFood && search.length > 1 && (
            <View style={styles.searchResults}>
              {searchLoading ? (
                <ActivityIndicator color={colors.primary} size="small" style={{ padding: 12 }} />
              ) : (foodResults?.data ?? []).length === 0 ? (
                <Text style={styles.noResults}>Sin resultados</Text>
              ) : (
                (foodResults?.data ?? []).slice(0, 6).map((food) => (
                  <TouchableOpacity
                    key={food.id}
                    style={styles.foodResultRow}
                    onPress={() => handleSelectFood(food)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodResultName}>{food.name}</Text>
                      {food.brandName && (
                        <Text style={styles.foodResultBrand}>{food.brandName}</Text>
                      )}
                    </View>
                    <Text style={styles.foodResultCal}>{food.caloriesPer100g} kcal/100g</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Quantity + add button */}
          {selectedFood && (
            <View style={styles.quantityRow}>
              <View style={styles.quantityInputWrap}>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  selectTextOnFocus
                />
                <Text style={styles.quantityUnit}>g</Text>
              </View>
              <TouchableOpacity
                style={[styles.addBtn, addEntry.isPending && styles.btnDisabled]}
                onPress={handleAddEntry}
                disabled={addEntry.isPending}
                activeOpacity={0.85}
              >
                <Text style={styles.addBtnText}>
                  {addEntry.isPending ? "Añadiendo..." : "Añadir"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.macroChip}>
      <Text style={[styles.macroChipValue, { color }]}>{value}</Text>
      <Text style={styles.macroChipLabel}>{label}</Text>
    </View>
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
  closeBtn: {
    fontSize: typography.lg,
    color: colors.textSecondary,
    fontWeight: typography.bold,
  },

  macroRow: {
    flexDirection: "row",
    padding: spacing[4],
    gap: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  macroChip: { flex: 1, alignItems: "center" },
  macroChipValue: { fontSize: typography.md, fontWeight: typography.bold },
  macroChipLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 1,
  },

  entriesList: { maxHeight: 240 },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    gap: spacing[2],
  },
  entryName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  entryMeta: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },
  deleteEntryBtn: { fontSize: 14, color: colors.gray4, fontWeight: typography.bold },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing[4] },
  emptyEntries: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.sm,
    paddingVertical: spacing[4],
  },

  divider: { height: 6, backgroundColor: colors.bgInput, marginVertical: spacing[2] },

  addSection: { flex: 1, padding: spacing[4], gap: spacing[3] },
  addSectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

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

  searchResults: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  foodResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[2],
  },
  foodResultName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  foodResultBrand: { fontSize: typography.xs, color: colors.textMuted },
  foodResultCal: { fontSize: typography.xs, color: colors.textSecondary },
  noResults: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: typography.sm,
    padding: spacing[3],
  },

  selectedFoodBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing[3],
  },
  selectedFoodName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  selectedFoodMeta: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1 },
  changeFoodBtn: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.semibold,
  },

  quantityRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  quantityInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
    gap: spacing[1],
    flex: 1,
  },
  quantityInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  quantityUnit: {
    color: colors.textSecondary,
    fontSize: typography.md,
    fontWeight: typography.medium,
  },

  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2] + 4,
  },
  btnDisabled: { opacity: 0.55 },
  addBtnText: { color: "#fff", fontSize: typography.sm, fontWeight: typography.bold },
});
