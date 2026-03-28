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
  useCardioLogs,
  useCardioStats,
  useCreateCardioLog,
  useDeleteCardioLog,
} from "@/hooks/useCardio";
import type { CardioType, CardioLog } from "@/types/api.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CARDIO_TYPES: { value: CardioType; label: string; icon: string }[] = [
  { value: "RUNNING", label: "Carrera", icon: "🏃" },
  { value: "CYCLING", label: "Ciclismo", icon: "🚴" },
  { value: "SWIMMING", label: "Natación", icon: "🏊" },
  { value: "ROWING", label: "Remo", icon: "🚣" },
  { value: "ELLIPTICAL", label: "Elíptica", icon: "⚙️" },
  { value: "WALKING", label: "Caminata", icon: "🚶" },
  { value: "HIIT", label: "HIIT", icon: "⚡" },
  { value: "OTHER", label: "Otro", icon: "🏋️" },
];

function typeLabel(t: CardioType) {
  return CARDIO_TYPES.find((c) => c.value === t) ?? { label: t, icon: "🏃" };
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatsBanner() {
  const { data: stats } = useCardioStats();
  if (!stats || stats.totalSessions === 0) return null;

  return (
    <View style={s.statsRow}>
      <View style={s.statCard}>
        <Text style={s.statVal}>{stats.totalSessions}</Text>
        <Text style={s.statLbl}>Sesiones</Text>
        <Text style={s.statSub}>30 días</Text>
      </View>
      <View style={s.statCard}>
        <Text style={s.statVal}>{fmtDuration(stats.totalMinutes)}</Text>
        <Text style={s.statLbl}>Tiempo total</Text>
      </View>
      {stats.totalDistanceKm > 0 && (
        <View style={s.statCard}>
          <Text style={s.statVal}>{stats.totalDistanceKm.toFixed(1)} km</Text>
          <Text style={s.statLbl}>Distancia</Text>
        </View>
      )}
      {stats.totalCalories > 0 && (
        <View style={s.statCard}>
          <Text style={s.statVal}>{stats.totalCalories}</Text>
          <Text style={s.statLbl}>Calorías</Text>
        </View>
      )}
    </View>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ item, onDelete }: { item: CardioLog; onDelete: () => void }) {
  const t = typeLabel(item.type);
  return (
    <View style={s.row}>
      <Text style={s.rowIcon}>{t.icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={s.rowHeader}>
          <Text style={s.rowType}>{t.label}</Text>
          <Text style={s.rowDate}>
            {new Date(item.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
          </Text>
        </View>
        <View style={s.rowBadges}>
          <Text style={s.badge}>{fmtDuration(item.durationMin)}</Text>
          {item.distanceKm != null && <Text style={s.badge}>{item.distanceKm} km</Text>}
          {item.caloriesBurned != null && <Text style={s.badge}>{item.caloriesBurned} kcal</Text>}
          {item.avgHeartRate != null && <Text style={s.badge}>♥ {item.avgHeartRate} bpm</Text>}
        </View>
        {item.notes ? <Text style={s.rowNotes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Eliminar", "¿Eliminar esta sesión?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: onDelete },
          ])
        }
        style={s.deleteBtn}
      >
        <Text style={s.deleteTxt}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [type, setType] = useState<CardioType>("RUNNING");
  const [date, setDate] = useState(today);
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");
  const [hr, setHr] = useState("");
  const [notes, setNotes] = useState("");
  const createMutation = useCreateCardioLog();

  function reset() {
    setType("RUNNING");
    setDate(today);
    setDuration("");
    setDistance("");
    setCalories("");
    setHr("");
    setNotes("");
  }

  function handleSave() {
    const durationMin = parseInt(duration);
    if (isNaN(durationMin) || durationMin < 1) {
      Alert.alert("Error", "La duración debe ser un número de minutos mayor a 0");
      return;
    }
    createMutation.mutate(
      {
        date,
        type,
        durationMin,
        distanceKm: distance ? parseFloat(distance.replace(",", ".")) : undefined,
        caloriesBurned: calories ? parseInt(calories) : undefined,
        avgHeartRate: hr ? parseInt(hr) : undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => { onClose(); reset(); },
        onError: () => Alert.alert("Error", "No se pudo guardar la sesión"),
      }
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Nueva sesión cardio</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={s.modalBody} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Type picker */}
          <Text style={s.label}>Tipo de actividad</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll}>
            {CARDIO_TYPES.map((ct) => (
              <TouchableOpacity
                key={ct.value}
                style={[s.typeChip, type === ct.value && s.typeChipActive]}
                onPress={() => setType(ct.value)}
              >
                <Text style={s.typeChipIcon}>{ct.icon}</Text>
                <Text style={[s.typeChipLabel, type === ct.value && s.typeChipLabelActive]}>
                  {ct.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Fecha (YYYY-MM-DD)</Text>
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholderTextColor={colors.textMuted} />

          <Text style={s.label}>Duración (minutos) *</Text>
          <TextInput style={s.input} value={duration} onChangeText={setDuration} placeholder="ej. 45" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />

          <Text style={s.label}>Distancia (km)</Text>
          <TextInput style={s.input} value={distance} onChangeText={setDistance} placeholder="ej. 8.5" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />

          <Text style={s.label}>Calorías quemadas</Text>
          <TextInput style={s.input} value={calories} onChangeText={setCalories} placeholder="ej. 450" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />

          <Text style={s.label}>FC media (bpm)</Text>
          <TextInput style={s.input} value={hr} onChangeText={setHr} placeholder="ej. 155" placeholderTextColor={colors.textMuted} keyboardType="number-pad" />

          <Text style={s.label}>Notas</Text>
          <TextInput style={[s.input, { height: 72 }]} value={notes} onChangeText={setNotes} placeholder="Zona 2, series de velocidad..." placeholderTextColor={colors.textMuted} multiline />
        </ScrollView>
        <View style={s.modalFooter}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.saveBtnText}>Guardar sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CardioScreen() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, refetch, isRefetching } = useCardioLogs({ limit: 50 });
  const deleteMutation = useDeleteCardioLog();
  const items = data?.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Cardio", headerBackTitle: "Atrás" }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        style={s.container}
        contentContainerStyle={s.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={
          <>
            <StatsBanner />
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
              <Text style={s.addBtnText}>+ Nueva sesión cardio</Text>
            </TouchableOpacity>
            {items.length > 0 && <Text style={s.sectionTitle}>Historial</Text>}
            {isLoading && <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏃</Text>
              <Text style={s.emptyTitle}>Sin sesiones cardio</Text>
              <Text style={s.emptySub}>Registra tus entrenamientos de cardio</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <LogRow item={item} onDelete={() => deleteMutation.mutate(item.id)} />
        )}
      />
      <AddModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 40 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: "22%",
    backgroundColor: colors.bgCard, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, padding: 10, alignItems: "center",
  },
  statVal: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  statLbl: { fontSize: 10, color: colors.textMuted, textAlign: "center" },
  statSub: { fontSize: 9, color: colors.textMuted },

  addBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: "center", marginBottom: 20,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
  },

  row: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: colors.bgCard, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, padding: 12, marginBottom: 8,
  },
  rowIcon: { fontSize: 24, width: 30, textAlign: "center" },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  rowType: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  rowDate: { fontSize: 11, color: colors.textMuted },
  rowBadges: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  badge: {
    fontSize: 11, color: colors.textSecondary, backgroundColor: colors.bgInput,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5,
  },
  rowNotes: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  deleteBtn: { padding: 4 },
  deleteTxt: { fontSize: 16 },

  empty: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: colors.textSecondary },

  // Modal
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  modalClose: { fontSize: 20, color: colors.textSecondary, padding: 4 },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },

  typeScroll: { marginBottom: 4 },
  typeChip: {
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.bgInput, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, marginRight: 8, marginBottom: 4,
  },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeChipIcon: { fontSize: 20 },
  typeChipLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  typeChipLabelActive: { color: colors.primaryDark, fontWeight: "600" },

  label: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginTop: 14, marginBottom: 5 },
  input: {
    backgroundColor: colors.bgInput, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, color: colors.textPrimary,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
