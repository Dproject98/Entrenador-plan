import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useSessions } from "@/hooks/useWorkouts";
import { useNutritionSummary } from "@/hooks/useNutrition";
import { useLogout } from "@/hooks/useAuth";
import { colors, typography, radius, spacing } from "@/lib/theme";

function toLocalDateString(d = new Date()) {
  return d.toISOString().split("T")[0];
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const today = toLocalDateString();

  const { data: sessions, isLoading: sessionsLoading } = useSessions({ limit: 3 });
  const { data: summary } = useNutritionSummary(today);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(" ")[0] ?? "atleta"}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <Text style={styles.logoutText}>{logout.isPending ? "..." : "Salir"}</Text>
        </TouchableOpacity>
      </View>

      {/* Macro summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrición hoy</Text>
        {summary ? (
          <View style={styles.macroRow}>
            <MacroCell label="Calorías" value={`${Math.round(summary.totals.calories)}`} unit="kcal" accent />
            <View style={styles.macroDivider} />
            <MacroCell label="Proteína" value={summary.totals.protein.toFixed(1)} unit="g" />
            <View style={styles.macroDivider} />
            <MacroCell label="Carbos" value={summary.totals.carbs.toFixed(1)} unit="g" />
            <View style={styles.macroDivider} />
            <MacroCell label="Grasa" value={summary.totals.fat.toFixed(1)} unit="g" />
          </View>
        ) : (
          <Text style={styles.emptyText}>Sin registros hoy</Text>
        )}
      </View>

      {/* Recent sessions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Últimas sesiones</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")}>
            <Text style={styles.seeAll}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        {sessionsLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing[3] }} />
        ) : sessions?.data.length ? (
          sessions.data.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.row, i === 0 && styles.rowFirst]}
              onPress={() => router.push(`/workout/${s.id}`)}
            >
              <View style={styles.rowDot} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{s.name ?? "Sesión sin nombre"}</Text>
                <Text style={styles.rowDate}>
                  {new Date(s.startedAt).toLocaleDateString("es", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </Text>
              </View>
              <Text style={styles.rowArrow}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Sin sesiones aún</Text>
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.cta} onPress={() => router.push("/workout/log")} activeOpacity={0.8}>
        <Text style={styles.ctaText}>+ Nuevo entrenamiento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MacroCell({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.macroCell}>
      <Text style={[styles.macroValue, accent && styles.macroValueAccent]}>{value}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing[4], gap: spacing[3] },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[1],
  },
  greeting: { fontSize: typography.xl, fontWeight: typography.bold, color: colors.textPrimary },
  date: { fontSize: typography.sm, color: colors.textSecondary, marginTop: 2, textTransform: "capitalize" },
  logoutBtn: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { fontSize: typography.sm, color: colors.textSecondary },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  seeAll: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.medium },

  macroRow: { flexDirection: "row", alignItems: "center" },
  macroCell: { flex: 1, alignItems: "center", gap: 2 },
  macroDivider: { width: 1, height: 36, backgroundColor: colors.border },
  macroValue: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary },
  macroValueAccent: { color: colors.primary },
  macroUnit: { fontSize: typography.xs, color: colors.textMuted },
  macroLabel: { fontSize: typography.xs, color: colors.textSecondary },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    gap: spacing[3],
  },
  rowFirst: { borderTopWidth: 0, paddingTop: 0 },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: typography.sm, fontWeight: typography.medium, color: colors.textPrimary },
  rowDate: { fontSize: typography.xs, color: colors.textSecondary, marginTop: 1, textTransform: "capitalize" },
  rowArrow: { fontSize: 20, color: colors.gray4 },

  emptyText: { fontSize: typography.sm, color: colors.textMuted, textAlign: "center", paddingVertical: spacing[2] },

  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[1],
  },
  ctaText: { color: colors.textInverted, fontSize: typography.md, fontWeight: typography.semibold },
});
