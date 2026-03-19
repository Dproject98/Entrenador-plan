import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansApi } from "@/services/api";
import type { TrainingPlan } from "@/types/api.types";

export default function PlansScreen() {
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => plansApi.list(),
  });

  const activate = useMutation({
    mutationFn: (id: string) => plansApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No tienes planes de entrenamiento aún.</Text>
        }
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            onActivate={() => activate.mutate(item.id)}
            activating={activate.isPending && activate.variables === item.id}
          />
        )}
      />
    </View>
  );
}

function PlanCard({
  plan,
  onActivate,
  activating,
}: {
  plan: TrainingPlan;
  onActivate: () => void;
  activating: boolean;
}) {
  return (
    <View style={[styles.card, plan.isActive && styles.cardActive]}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{plan.name}</Text>
        {plan.description ? <Text style={styles.cardDesc}>{plan.description}</Text> : null}
        {plan.isActive && <Text style={styles.activeBadge}>● Activo</Text>}
      </View>
      {!plan.isActive && (
        <TouchableOpacity
          style={[styles.activateBtn, activating && styles.btnDisabled]}
          onPress={onActivate}
          disabled={activating}
        >
          <Text style={styles.activateBtnText}>{activating ? "..." : "Activar"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardActive: { borderColor: "#2563eb" },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#6b7280" },
  activeBadge: { fontSize: 12, color: "#2563eb", fontWeight: "600", marginTop: 4 },
  activateBtn: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 12,
  },
  btnDisabled: { opacity: 0.5 },
  activateBtnText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 60, fontSize: 14 },
});
