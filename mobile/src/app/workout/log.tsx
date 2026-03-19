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
          placeholderTextColor="#9ca3af"
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
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, create.isPending && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={create.isPending}
      >
        <Text style={styles.buttonText}>
          {create.isPending ? "Creando..." : "Iniciar sesión"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, gap: 4 },
  heading: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  textArea: { height: 80 },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
