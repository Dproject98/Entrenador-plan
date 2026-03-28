import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  RefreshControl,
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/lib/theme";
import {
  useMeasurements,
  useLatestMeasurement,
  useCreateMeasurement,
  useDeleteMeasurement,
} from "@/hooks/useMeasurements";
import type { BodyMeasurement, CreateMeasurementBody } from "@/types/api.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined, unit: string): string {
  if (val == null) return "—";
  return `${val % 1 === 0 ? val : val.toFixed(1)} ${unit}`;
}

function deltaStr(current: number | null | undefined, previous: number | null | undefined): string | null {
  if (current == null || previous == null) return null;
  const d = current - previous;
  if (Math.abs(d) < 0.05) return null;
  return `${d > 0 ? "+" : ""}${d.toFixed(1)}`;
}

// ─── Sparkline (simple bar chart for weight) ─────────────────────────────────

function WeightSparkline({ data }: { data: BodyMeasurement[] }) {
  const weights = data.filter((m) => m.weightKg != null).slice(0, 14).reverse();
  if (weights.length < 2) return null;

  const values = weights.map((m) => m.weightKg!);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <View style={spark.container}>
      <Text style={spark.label}>Últimas {weights.length} mediciones de peso</Text>
      <View style={spark.chart}>
        {values.map((v, i) => {
          const height = Math.max(4, ((v - min) / range) * 60);
          const isLast = i === values.length - 1;
          return (
            <View key={i} style={spark.barWrap}>
              <View
                style={[
                  spark.bar,
                  { height },
                  isLast && { backgroundColor: colors.primary },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={spark.axisRow}>
        <Text style={spark.axisLabel}>{min.toFixed(1)} kg</Text>
        <Text style={spark.axisLabel}>{max.toFixed(1)} kg</Text>
      </View>
    </View>
  );
}

const spark = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 64, gap: 3 },
  barWrap: { flex: 1, justifyContent: "flex-end" },
  bar: { borderRadius: 3, backgroundColor: colors.gray4 },
  axisRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  axisLabel: { fontSize: 11, color: colors.textMuted },
});

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  latest,
  previous,
}: {
  latest: BodyMeasurement | null;
  previous: BodyMeasurement | null;
}) {
  if (!latest) return null;

  const fields: Array<{ label: string; key: keyof BodyMeasurement; unit: string }> = [
    { label: "Peso", key: "weightKg", unit: "kg" },
    { label: "Grasa corporal", key: "bodyFatPct", unit: "%" },
    { label: "Masa muscular", key: "muscleMassPct", unit: "%" },
    { label: "Pecho", key: "chestCm", unit: "cm" },
    { label: "Cintura", key: "waistCm", unit: "cm" },
    { label: "Cadera", key: "hipsCm", unit: "cm" },
    { label: "Brazo", key: "armCm", unit: "cm" },
    { label: "Muslo", key: "thighCm", unit: "cm" },
  ];

  const filled = fields.filter((f) => latest[f.key] != null);
  if (filled.length === 0) return null;

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Última medición</Text>
      <Text style={s.cardDate}>{new Date(latest.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</Text>
      <View style={s.grid}>
        {filled.map((f) => {
          const delta = previous ? deltaStr(latest[f.key] as number, previous[f.key] as number) : null;
          const isPositive = delta && parseFloat(delta) > 0;
          return (
            <View key={f.key} style={s.gridItem}>
              <Text style={s.gridLabel}>{f.label}</Text>
              <Text style={s.gridValue}>{fmt(latest[f.key] as number, f.unit)}</Text>
              {delta && (
                <Text style={[s.gridDelta, { color: f.key === "weightKg" || f.key === "waistCm" || f.key === "bodyFatPct" ? (isPositive ? colors.danger : colors.success) : (isPositive ? colors.success : colors.danger) }]}>
                  {delta}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Add Measurement Modal ────────────────────────────────────────────────────

interface Field {
  label: string;
  key: keyof CreateMeasurementBody;
  unit: string;
  placeholder: string;
}

const FIELDS: Field[] = [
  { label: "Peso", key: "weightKg", unit: "kg", placeholder: "ej. 75.5" },
  { label: "Grasa corporal", key: "bodyFatPct", unit: "%", placeholder: "ej. 18.0" },
  { label: "Masa muscular", key: "muscleMassPct", unit: "%", placeholder: "ej. 42.0" },
  { label: "Pecho", key: "chestCm", unit: "cm", placeholder: "ej. 100" },
  { label: "Cintura", key: "waistCm", unit: "cm", placeholder: "ej. 82" },
  { label: "Cadera", key: "hipsCm", unit: "cm", placeholder: "ej. 96" },
  { label: "Brazo", key: "armCm", unit: "cm", placeholder: "ej. 35" },
  { label: "Muslo", key: "thighCm", unit: "cm", placeholder: "ej. 55" },
];

function AddModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createMutation = useCreateMeasurement();
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [values, setValues] = useState<Partial<Record<keyof CreateMeasurementBody, string>>>({});

  function handleSave() {
    const body: CreateMeasurementBody = { date };
    for (const f of FIELDS) {
      const v = values[f.key];
      if (v && v.trim() !== "") {
        (body as unknown as Record<string, unknown>)[f.key] = parseFloat(v.replace(",", "."));
      }
    }
    createMutation.mutate(body, {
      onSuccess: () => {
        onClose();
        setValues({});
        setDate(today);
      },
      onError: () => Alert.alert("Error", "No se pudo guardar la medición"),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Nueva medición</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.modalBody}>
          <Text style={s.inputLabel}>Fecha (YYYY-MM-DD)</Text>
          <TextInput
            style={s.input}
            value={date}
            onChangeText={setDate}
            placeholderTextColor={colors.textMuted}
          />
          {FIELDS.map((f) => (
            <View key={f.key}>
              <Text style={s.inputLabel}>{f.label} ({f.unit})</Text>
              <TextInput
                style={s.input}
                value={values[f.key] ?? ""}
                onChangeText={(t) => setValues((prev) => ({ ...prev, [f.key]: t }))}
                placeholder={f.placeholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
        <View style={s.modalFooter}>
          <TouchableOpacity
            style={s.saveBtn}
            onPress={handleSave}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Guardar medición</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ item, onDelete }: { item: BodyMeasurement; onDelete: () => void }) {
  return (
    <View style={s.historyRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.historyDate}>
          {new Date(item.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
        <View style={s.historyBadges}>
          {item.weightKg != null && <Text style={s.badge}>⚖️ {item.weightKg} kg</Text>}
          {item.bodyFatPct != null && <Text style={s.badge}>🔥 {item.bodyFatPct}%</Text>}
          {item.waistCm != null && <Text style={s.badge}>📏 {item.waistCm} cm</Text>}
        </View>
      </View>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Eliminar", "¿Eliminar esta medición?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: onDelete },
          ])
        }
        style={s.deleteBtn}
      >
        <Text style={s.deleteBtnText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, refetch, isRefetching } = useMeasurements({ limit: 50 });
  const { data: latest } = useLatestMeasurement();
  const deleteMutation = useDeleteMeasurement();

  const items = data?.data ?? [];
  const previous = items.length > 1 ? items[1] : null;

  return (
    <>
      <Stack.Screen options={{ title: "Mi Progreso", headerBackTitle: "Atrás" }} />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Sparkline */}
            {items.length >= 2 && <WeightSparkline data={items} />}

            {/* Latest summary */}
            <SummaryCard latest={latest ?? null} previous={previous} />

            {/* Add button */}
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
              <Text style={s.addBtnText}>+ Añadir medición</Text>
            </TouchableOpacity>

            {/* History */}
            {items.length > 0 ? (
              <>
                <Text style={s.sectionTitle}>Historial</Text>
                {items.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onDelete={() => deleteMutation.mutate(item.id)}
                  />
                ))}
              </>
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyIcon}>📏</Text>
                <Text style={s.emptyTitle}>Sin mediciones</Text>
                <Text style={s.emptySubtitle}>Registra tu peso y medidas para ver tu progreso</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  cardDate: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { width: "45%", backgroundColor: colors.bgInput, borderRadius: 8, padding: 10 },
  gridLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  gridValue: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  gridDelta: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyDate: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, marginBottom: 4 },
  historyBadges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.bgInput,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  modalClose: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  inputLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginTop: 14, marginBottom: 5 },
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Empty
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});
