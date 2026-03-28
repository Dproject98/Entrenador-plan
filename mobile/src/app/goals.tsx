import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import { colors } from "@/lib/theme";
import { useStreak, useGoal, useUpdateGoal } from "@/hooks/useGoals";

// ─── Streak Calendar ──────────────────────────────────────────────────────────

function StreakSection() {
  const { data: streak, isLoading } = useStreak();

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />;
  if (!streak) return null;

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Racha de entrenamiento</Text>
      <View style={s.streakRow}>
        <View style={s.streakStat}>
          <Text style={s.streakNum}>{streak.currentStreak}</Text>
          <Text style={s.streakLbl}>Racha actual</Text>
        </View>
        <View style={s.streakDivider} />
        <View style={s.streakStat}>
          <Text style={s.streakNum}>{streak.longestStreak}</Text>
          <Text style={s.streakLbl}>Récord personal</Text>
        </View>
        <View style={s.streakDivider} />
        <View style={s.streakStat}>
          <Text style={s.streakNum}>{streak.thisWeekSessions}</Text>
          <Text style={s.streakLbl}>Esta semana</Text>
        </View>
      </View>

      {/* Week dots */}
      <View style={s.weekRow}>
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((label, i) => {
          const now = new Date();
          const dow = now.getDay();
          const mondayOffset = dow === 0 ? -6 : 1 - dow;
          const d = new Date(now);
          d.setDate(now.getDate() + mondayOffset + i);
          const dateStr = d.toISOString().split("T")[0];
          const done = streak.thisWeekDays.includes(dateStr);
          const isToday = dateStr === new Date().toISOString().split("T")[0];
          return (
            <View key={label} style={s.weekDayCol}>
              <View style={[s.dot, done && s.dotDone, isToday && !done && s.dotToday]} />
              <Text style={[s.dotLabel, isToday && s.dotLabelToday]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {streak.lastSessionDate && (
        <Text style={s.lastSession}>
          Último entrenamiento: {new Date(streak.lastSessionDate).toLocaleDateString("es", { day: "numeric", month: "long" })}
        </Text>
      )}
    </View>
  );
}

// ─── Goals Form ───────────────────────────────────────────────────────────────

function GoalsForm() {
  const { data: goal, isLoading } = useGoal();
  const updateMutation = useUpdateGoal();

  const [sessions, setSessions] = useState("3");
  const [volume, setVolume] = useState("");

  useEffect(() => {
    if (goal) {
      setSessions(String(goal.weeklySessionsTarget));
      setVolume(goal.weeklyVolumeKgTarget != null ? String(goal.weeklyVolumeKgTarget) : "");
    }
  }, [goal]);

  function handleSave() {
    const weeklySessionsTarget = parseInt(sessions);
    if (isNaN(weeklySessionsTarget) || weeklySessionsTarget < 1 || weeklySessionsTarget > 14) {
      Alert.alert("Error", "Las sesiones semanales deben ser entre 1 y 14");
      return;
    }
    const weeklyVolumeKgTarget = volume.trim() !== "" ? parseFloat(volume.replace(",", ".")) : null;

    updateMutation.mutate(
      { weeklySessionsTarget, weeklyVolumeKgTarget },
      {
        onSuccess: () => Alert.alert("Guardado", "Objetivos actualizados"),
        onError: () => Alert.alert("Error", "No se pudieron guardar los objetivos"),
      }
    );
  }

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />;

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Mis objetivos semanales</Text>

      <View>
        <Text style={s.inputLabel}>Sesiones por semana</Text>
        <View style={s.stepRow}>
          <TouchableOpacity
            style={s.stepBtn}
            onPress={() => setSessions((v) => String(Math.max(1, parseInt(v) - 1)))}
          >
            <Text style={s.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.stepValue}>{sessions}</Text>
          <TouchableOpacity
            style={s.stepBtn}
            onPress={() => setSessions((v) => String(Math.min(14, parseInt(v) + 1)))}
          >
            <Text style={s.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <Text style={s.inputLabel}>Volumen semanal objetivo (kg, opcional)</Text>
        <TextInput
          style={s.input}
          value={volume}
          onChangeText={setVolume}
          placeholder="ej. 5000"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />
        <Text style={s.inputHint}>Suma de peso × reps de todas las series</Text>
      </View>

      <TouchableOpacity
        style={s.saveBtn}
        onPress={handleSave}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.saveBtnText}>Guardar objetivos</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GoalsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Racha y Objetivos", headerBackTitle: "Atrás" }} />
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <StreakSection />
        <GoalsForm />
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },

  streakRow: { flexDirection: "row", alignItems: "center" },
  streakStat: { flex: 1, alignItems: "center" },
  streakDivider: { width: 1, height: 36, backgroundColor: colors.border },
  streakNum: { fontSize: 28, fontWeight: "700", color: colors.primary },
  streakLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: "center" },

  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDayCol: { alignItems: "center", gap: 4 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotToday: { borderColor: colors.primary },
  dotLabel: { fontSize: 10, color: colors.textMuted },
  dotLabelToday: { color: colors.primary, fontWeight: "600" },
  lastSession: { fontSize: 12, color: colors.textMuted },

  inputLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: "center", alignItems: "center",
  },
  stepBtnText: { fontSize: 20, color: colors.textPrimary, lineHeight: 22 },
  stepValue: { fontSize: 32, fontWeight: "700", color: colors.textPrimary, minWidth: 48, textAlign: "center" },

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
  inputHint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
