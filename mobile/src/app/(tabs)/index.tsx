import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useSessions } from "@/hooks/useWorkouts";
import { useNutritionSummary } from "@/hooks/useNutrition";
import { useLogout } from "@/hooks/useAuth";

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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name ?? "atleta"} 👋</Text>
        <TouchableOpacity onPress={() => logout.mutate()} disabled={logout.isPending}>
          <Text style={styles.logoutText}>{logout.isPending ? "..." : "Salir"}</Text>
        </TouchableOpacity>
      </View>

      {/* Nutrition summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nutrición hoy</Text>
        {summary ? (
          <View style={styles.macroRow}>
            <MacroCell label="Calorías" value={`${Math.round(summary.totals.calories)}`} unit="kcal" />
            <MacroCell label="Proteína" value={summary.totals.protein.toFixed(1)} unit="g" />
            <MacroCell label="Carbos" value={summary.totals.carbs.toFixed(1)} unit="g" />
            <MacroCell label="Grasa" value={summary.totals.fat.toFixed(1)} unit="g" />
          </View>
        ) : (
          <Text style={styles.empty}>Sin registros aún</Text>
        )}
      </View>

      {/* Recent sessions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimas sesiones</Text>
        {sessionsLoading ? (
          <ActivityIndicator color="#2563eb" style={{ marginVertical: 8 }} />
        ) : sessions?.data.length ? (
          sessions.data.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.row}
              onPress={() => router.push(`/workout/${s.id}`)}
            >
              <Text style={styles.rowTitle}>{s.name ?? "Sesión sin nombre"}</Text>
              <Text style={styles.rowDate}>
                {new Date(s.startedAt).toLocaleDateString("es", { day: "numeric", month: "short" })}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.empty}>Sin sesiones aún</Text>
        )}
      </View>

      <TouchableOpacity style={styles.cta} onPress={() => router.push("/workout/log")}>
        <Text style={styles.ctaText}>+ Nueva sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MacroCell({ label, value, unit }: { label: string; value: string; unit: string }) {
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#111827" },
  logoutText: { fontSize: 14, color: "#ef4444" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  macroRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  macroCell: { alignItems: "center", flex: 1 },
  macroValue: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  macroUnit: { fontSize: 10, color: "#2563eb" },
  macroLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  rowTitle: { fontSize: 14, fontWeight: "500", color: "#111827" },
  rowDate: { fontSize: 13, color: "#6b7280" },
  empty: { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingVertical: 8 },
  cta: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
