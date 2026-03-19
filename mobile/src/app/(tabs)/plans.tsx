import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { usePlans, useActivatePlan, useDeletePlan } from "@/hooks/usePlans";
import { PlanListSkeleton } from "@/components/ui/Skeleton";
import type { TrainingPlan } from "@/types/api.types";

export default function PlansScreen() {
  const { data: plans, isLoading, isError, refetch, isRefetching } = usePlans();
  const activate = useActivatePlan();
  const deletePlan = useDeletePlan();

  if (isLoading) return <PlanListSkeleton />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error al cargar planes</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = (plan: TrainingPlan) => {
    Alert.alert(
      "Eliminar plan",
      `¿Eliminar "${plan.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deletePlan.mutate(plan.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={plans ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <Text style={styles.empty}>No tienes planes de entrenamiento aún.</Text>
        }
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            onActivate={() => activate.mutate(item.id)}
            onDelete={() => handleDelete(item)}
            activating={activate.isPending && activate.variables === item.id}
            deleting={deletePlan.isPending && deletePlan.variables === item.id}
          />
        )}
      />
    </View>
  );
}

function PlanCard({
  plan,
  onActivate,
  onDelete,
  activating,
  deleting,
}: {
  plan: TrainingPlan;
  onActivate: () => void;
  onDelete: () => void;
  activating: boolean;
  deleting: boolean;
}) {
  return (
    <View style={[styles.card, plan.isActive && styles.cardActive]}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{plan.name}</Text>
        {plan.description ? <Text style={styles.cardDesc}>{plan.description}</Text> : null}
        {plan.isActive && <Text style={styles.activeBadge}>● Plan activo</Text>}
      </View>
      <View style={styles.actions}>
        {!plan.isActive && (
          <TouchableOpacity
            style={[styles.activateBtn, activating && styles.btnDisabled]}
            onPress={onActivate}
            disabled={activating}
          >
            <Text style={styles.activateBtnText}>{activating ? "..." : "Activar"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={onDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteBtnText}>{deleting ? "..." : "✕"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardActive: { borderColor: "#2563eb" },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#6b7280" },
  activeBadge: { fontSize: 12, color: "#2563eb", fontWeight: "600", marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginLeft: 12, alignItems: "center" },
  activateBtn: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  deleteBtn: {
    backgroundColor: "#fff1f2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnDisabled: { opacity: 0.5 },
  activateBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 60, fontSize: 14 },
  errorText: { fontSize: 15, color: "#374151" },
  retryBtn: { backgroundColor: "#eff6ff", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#2563eb", fontWeight: "600" },
});
