import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useCreateSession } from "@/hooks/useWorkouts";
import { colors, typography, radius, spacing } from "@/lib/theme";

export default function LogWorkoutScreen() {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const create = useCreateSession();

  const handleStart = () => {
    create.mutate(
      { name: name.trim() || undefined, notes: notes.trim() || undefined },
      {
        onSuccess: (session) => router.replace(`/workout/${session.id}`),
        onError: () => Alert.alert("Error", "No se pudo crear la sesión. Inténtalo de nuevo."),
      }
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Nueva sesión</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre (opcional)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Push day, Piernas..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Cómo te sientes hoy..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, create.isPending && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={create.isPending}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {create.isPending ? "Creando..." : "Iniciar sesión"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing[6], gap: 4 },
  heading: { fontSize: typography["2xl"], fontWeight: typography.bold, color: colors.textPrimary, marginBottom: spacing[4] },
  field: { marginBottom: spacing[4] },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    marginBottom: spacing[1],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.md,
    color: colors.textPrimary,
    backgroundColor: colors.bgCard,
  },
  textArea: { height: 88 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[2],
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverted, fontSize: typography.md, fontWeight: typography.semibold },
});
