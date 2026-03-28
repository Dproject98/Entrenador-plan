import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Stack, router } from "expo-router";
import { colors } from "@/lib/theme";
import { useTrainingLoad, useMuscleBalance } from "@/hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/types/api.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<string, string> = {
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
  FULL_BODY: "Cuerpo completo",
  CARDIO: "Cardio",
};

function fmtVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${v} kg`;
}

// ─── Period Selector ──────────────────────────────────────────────────────────

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
  { label: "7d", value: "week" },
  { label: "30d", value: "month" },
  { label: "90d", value: "3months" },
];

function PeriodSelector({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (p: AnalyticsPeriod) => void;
}) {
  return (
    <View style={s.periodRow}>
      {PERIODS.map((p) => (
        <TouchableOpacity
          key={p.value}
          style={[s.periodBtn, value === p.value && s.periodBtnActive]}
          onPress={() => onChange(p.value)}
        >
          <Text style={[s.periodText, value === p.value && s.periodTextActive]}>
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Volume Bar Chart ─────────────────────────────────────────────────────────

function VolumeChart({
  data,
}: {
  data: { muscleGroup: string; volume: number; sets: number }[];
}) {
  const top = data.slice(0, 8);
  const maxVol = Math.max(...top.map((d) => d.volume), 1);

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Volumen por grupo muscular</Text>
      {top.map((item) => {
        const pct = (item.volume / maxVol) * 100;
        return (
          <View key={item.muscleGroup} style={s.barRow}>
            <Text style={s.barLabel} numberOfLines={1}>
              {MUSCLE_LABELS[item.muscleGroup] ?? item.muscleGroup}
            </Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.barValue}>{fmtVolume(item.volume)}</Text>
          </View>
        );
      })}
      {top.length === 0 && (
        <Text style={s.empty}>Sin datos en este período</Text>
      )}
    </View>
  );
}

// ─── Weekly Trend ─────────────────────────────────────────────────────────────

function WeeklyTrend({
  data,
}: {
  data: { week: string; volume: number; sessions: number }[];
}) {
  if (data.length < 2) return null;
  const maxVol = Math.max(...data.map((d) => d.volume), 1);

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Tendencia semanal</Text>
      <View style={s.sparkRow}>
        {data.map((entry, i) => {
          const height = Math.max(4, (entry.volume / maxVol) * 60);
          const isLast = i === data.length - 1;
          const weekLabel = entry.week.split("-W")[1];
          return (
            <View key={entry.week} style={s.sparkCol}>
              <Text style={s.sparkSessions}>{entry.sessions > 0 ? entry.sessions : ""}</Text>
              <View style={s.sparkBarWrap}>
                <View
                  style={[
                    s.sparkBar,
                    { height },
                    isLast && { backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={s.sparkWeek}>W{weekLabel}</Text>
            </View>
          );
        })}
      </View>
      <View style={s.sparkAxis}>
        <Text style={s.axisLabel}>↑ volumen (kg·rep)</Text>
        <Text style={s.axisLabel}>núm. sesiones encima</Text>
      </View>
    </View>
  );
}

// ─── Muscle Balance ───────────────────────────────────────────────────────────

function MuscleBalance({
  data,
}: {
  data: { muscleGroup: string; sets: number; pct: number }[];
}) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>Distribución muscular (4 sem.)</Text>
      <View style={s.balanceList}>
        {data.slice(0, 6).map((item) => (
          <View key={item.muscleGroup} style={s.balanceRow}>
            <Text style={s.balanceLabel}>
              {MUSCLE_LABELS[item.muscleGroup] ?? item.muscleGroup}
            </Text>
            <View style={s.balanceTrack}>
              <View
                style={[
                  s.balanceFill,
                  { width: `${item.pct}%` },
                  item.pct < 10 && { backgroundColor: colors.warning },
                ]}
              />
            </View>
            <Text style={s.balancePct}>{item.pct}%</Text>
          </View>
        ))}
      </View>
      {data.length === 0 && (
        <Text style={s.empty}>Sin datos en las últimas 4 semanas</Text>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  const {
    data: load,
    isLoading: loadLoading,
    refetch: refetchLoad,
    isRefetching: loadRefetching,
  } = useTrainingLoad(period);

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } =
    useMuscleBalance();

  const isRefetching = loadRefetching;

  function onRefresh() {
    refetchLoad();
    refetchBalance();
  }

  return (
    <>
      <Stack.Screen options={{ title: "Análisis", headerBackTitle: "Atrás" }} />
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <PeriodSelector value={period} onChange={setPeriod} />

        {loadLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : load ? (
          <>
            {/* Summary stats */}
            <View style={s.statsRow}>
              <StatCard label="Volumen total" value={fmtVolume(load.totalVolume)} />
              <StatCard label="Series" value={String(load.totalSets)} />
              <StatCard label="Sesiones" value={String(load.sessionsCount)} />
            </View>

            {/* Weekly trend */}
            <WeeklyTrend data={load.weeklyTrend} />

            {/* Volume by muscle */}
            <VolumeChart data={load.byMuscleGroup} />
          </>
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyTitle}>Sin datos</Text>
            <Text style={s.emptySubtitle}>Completa entrenamientos para ver tu análisis</Text>
          </View>
        )}

        {/* Muscle balance — separate query */}
        {!balanceLoading && balance && balance.length > 0 && (
          <MuscleBalance data={balance} />
        )}

        {/* Records personales */}
        <TouchableOpacity style={s.recordsCard} onPress={() => router.push("/records")} activeOpacity={0.8}>
          <View>
            <Text style={s.recordsTitle}>Records Personales</Text>
            <Text style={s.recordsSubtitle}>1RM estimado y progresión por ejercicio</Text>
          </View>
          <Text style={s.recordsArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  periodRow: {
    flexDirection: "row",
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  periodTextActive: { color: "#fff" },

  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: "center" },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },

  // Volume bars
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 80, fontSize: 12, color: colors.textSecondary },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  barValue: { width: 44, fontSize: 11, color: colors.textMuted, textAlign: "right" },

  // Weekly trend sparkline
  sparkRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 80 },
  sparkCol: { flex: 1, alignItems: "center" },
  sparkSessions: { fontSize: 9, color: colors.textMuted, marginBottom: 2 },
  sparkBarWrap: { flex: 1, justifyContent: "flex-end", width: "100%" },
  sparkBar: { borderRadius: 3, backgroundColor: colors.gray4, width: "100%" },
  sparkWeek: { fontSize: 9, color: colors.textMuted, marginTop: 3 },
  sparkAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisLabel: { fontSize: 10, color: colors.textMuted },

  // Muscle balance
  balanceList: { gap: 8 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  balanceLabel: { width: 90, fontSize: 12, color: colors.textSecondary },
  balanceTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    overflow: "hidden",
  },
  balanceFill: { height: "100%", backgroundColor: colors.success, borderRadius: 4 },
  balancePct: { width: 32, fontSize: 11, color: colors.textMuted, textAlign: "right" },

  empty: { fontSize: 13, color: colors.textMuted, textAlign: "center", paddingVertical: 8 },

  recordsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordsTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  recordsSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  recordsArrow: { fontSize: 22, color: colors.gray4 },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
});
