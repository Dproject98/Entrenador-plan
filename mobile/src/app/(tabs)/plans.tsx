import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { usePlans, useActivatePlan, useDeletePlan, useCreatePlan } from "@/hooks/usePlans";
import { PlanListSkeleton } from "@/components/ui/Skeleton";
import { colors, typography, radius, spacing } from "@/lib/theme";
import type { TrainingPlan } from "@/types/api.types";

export default function PlansScreen() {
  const [showCreate, setShowCreate] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");

  const { data: plans, isLoading, isError, refetch, isRefetching } = usePlans();
  const activate = useActivatePlan();
  const deletePlan = useDeletePlan();
  const createPlan = useCreatePlan();

  const handleCreate = () => {
    if (!newPlanName.trim()) return;
    createPlan.mutate(
      { name: newPlanName.trim(), description: newPlanDesc.trim() || undefined },
      {
        onSuccess: (plan) => {
          setShowCreate(false);
          setNewPlanName("");
          setNewPlanDesc("");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.push(`/plans/${plan.id}` as any);
        },
        onError: () => Alert.alert("Error", "No se pudo crear el plan"),
      }
    );
  };

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
    <>
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
            <TouchableOpacity style={styles.createFirstBtn} onPress={() => setShowCreate(true)}>
              <Text style={styles.createFirstBtnText}>+ Crear plan</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push(`/plans/${item.id}` as any)}
            onActivate={() => activate.mutate(item.id)}
            onDelete={() => handleDelete(item)}
            activating={activate.isPending && activate.variables === item.id}
            deleting={deletePlan.isPending && deletePlan.variables === item.id}
          />
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>

    {/* Create plan modal */}
    <Modal
      visible={showCreate}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowCreate(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nuevo plan</Text>
          <TouchableOpacity onPress={() => setShowCreate(false)}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>Nombre del plan *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Fuerza 4 días"
            placeholderTextColor={colors.textMuted}
            value={newPlanName}
            onChangeText={setNewPlanName}
            maxLength={100}
            autoFocus
          />
          <Text style={[styles.fieldLabel, { marginTop: spacing[3] }]}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Ej: Plan de hipertrofia de 12 semanas"
            placeholderTextColor={colors.textMuted}
            value={newPlanDesc}
            onChangeText={setNewPlanDesc}
            maxLength={500}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.confirmBtn, (!newPlanName.trim() || createPlan.isPending) && styles.btnDisabled]}
            onPress={handleCreate}
            disabled={!newPlanName.trim() || createPlan.isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>
              {createPlan.isPending ? "Creando..." : "Crear plan"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </>
  );
}

function PlanCard({
  plan,
  onPress,
  onActivate,
  onDelete,
  activating,
  deleting,
}: {
  plan: TrainingPlan;
  onPress: () => void;
  onActivate: () => void;
  onDelete: () => void;
  activating: boolean;
  deleting: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, plan.isActive && styles.cardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
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
            onPress={(e) => { e.stopPropagation?.(); onActivate(); }}
            disabled={activating}
          >
            <Text style={styles.activateBtnText}>{activating ? "..." : "Activar"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={(e) => { e.stopPropagation?.(); onDelete(); }}
          disabled={deleting}
        >
          <Text style={styles.deleteBtnText}>{deleting ? "..." : "✕"}</Text>
        </TouchableOpacity>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
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

  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: spacing[1] },

  emptyState: { alignItems: "center", marginTop: 80, gap: spacing[2] },
  emptyTitle: { fontSize: typography.md, fontWeight: typography.semibold, color: colors.textSecondary },
  emptySub: { fontSize: typography.sm, color: colors.textMuted },
  createFirstBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2] + 2,
    marginTop: spacing[2],
  },
  createFirstBtnText: { color: "#fff", fontSize: typography.sm, fontWeight: typography.bold },

  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "400" as const, lineHeight: 30 },

  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.textPrimary },
  modalClose: { fontSize: typography.lg, color: colors.textSecondary, fontWeight: typography.bold },
  modalBody: { padding: spacing[4], gap: spacing[2] },
  fieldLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontWeight: typography.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  textInput: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: typography.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2] + 2,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[3] + 2,
    alignItems: "center",
    marginTop: spacing[3],
  },
  confirmBtnText: { color: "#fff", fontSize: typography.md, fontWeight: typography.bold },

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
