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
import { colors, typography, radius, spacing } from "@/lib/theme";
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin planes aún</Text>
            <Text style={styles.emptySub}>Crea tu primer plan de entrenamiento</Text>
          </View>
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
        {plan.isActive && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Activo</Text>
          </View>
        )}
        <Text style={styles.cardTitle}>{plan.name}</Text>
        {plan.description ? <Text style={styles.cardDesc}>{plan.description}</Text> : null}
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
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3] },
  list: { padding: spacing[4], gap: spacing[2] },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    flexDirection: "row",
    alignItems: "center",
  },
  cardActive: { borderColor: colors.primary },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary },
  cardDesc: { fontSize: typography.sm, color: colors.textSecondary },

  activePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
    marginBottom: 2,
  },
  activePillText: { fontSize: typography.xs, fontWeight: typography.semibold, color: colors.primary },

  actions: { flexDirection: "row", gap: spacing[2], marginLeft: spacing[3], alignItems: "center" },
  activateBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  btnDisabled: { opacity: 0.5 },
  activateBtnText: { color: colors.primary, fontWeight: typography.semibold, fontSize: typography.sm },
  deleteBtnText: { color: colors.danger, fontWeight: typography.bold, fontSize: typography.sm },

  emptyState: { alignItems: "center", marginTop: 80, gap: spacing[2] },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textSecondary },
  emptySub: { fontSize: typography.sm, color: colors.textMuted },

  errorText: { fontSize: typography.md, color: colors.textSecondary },
  retryBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
  },
  retryText: { fontSize: typography.sm, color: colors.primary, fontWeight: typography.semibold },
});
