import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { colors, typography, radius, spacing } from "@/lib/theme";

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormValues = z.infer<typeof schema>;
type FieldName = keyof FormValues;

const FIELDS: Array<{
  name: FieldName;
  label: string;
  placeholder: string;
  keyboard: "default" | "email-address";
  capitalize: "none" | "words";
  secure: boolean;
}> = [
  { name: "name", label: "Nombre", placeholder: "Tu nombre", keyboard: "default", capitalize: "words", secure: false },
  { name: "email", label: "Email", placeholder: "tu@email.com", keyboard: "email-address", capitalize: "none", secure: false },
  { name: "password", label: "Contraseña", placeholder: "Mínimo 8 caracteres", keyboard: "default", capitalize: "none", secure: true },
];

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const data = await authApi.register(values);
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace("/(tabs)/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "No se pudo crear la cuenta";
      Alert.alert("Error al registrarse", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>E</Text>
          </View>
          <Text style={styles.appName}>Crea tu cuenta</Text>
        </View>

        <View style={styles.form}>
          {FIELDS.map((f) => (
            <Controller
              key={f.name}
              control={control}
              name={f.name}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={[styles.input, errors[f.name] && styles.inputError]}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    autoCapitalize={f.capitalize}
                    keyboardType={f.keyboard}
                    secureTextEntry={f.secure}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType={f.name === "password" ? "done" : "next"}
                    onSubmitEditing={f.name === "password" ? handleSubmit(onSubmit) : undefined}
                  />
                  {errors[f.name] && (
                    <Text style={styles.errorText}>{errors[f.name]?.message}</Text>
                  )}
                </View>
              )}
            />
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{loading ? "Cargando..." : "Crear cuenta"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}> Inicia sesión</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[10],
  },
  logoArea: { alignItems: "center", marginBottom: spacing[6], gap: spacing[3] },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    color: colors.textInverted,
  },
  appName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  form: { gap: spacing[4] },
  field: { gap: spacing[1] },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
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
  inputError: { borderColor: colors.danger },
  errorText: { fontSize: typography.xs, color: colors.danger },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: spacing[4],
    alignItems: "center",
    marginTop: spacing[2],
  },
  btnDisabled: { opacity: 0.55 },
  btnText: {
    color: colors.textInverted,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing[6],
  },
  footerText: { fontSize: typography.sm, color: colors.textSecondary },
  footerLink: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
});
