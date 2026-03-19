import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[`variant_${variant}`],
        styles[`size_${size}`],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {loading ? "Cargando..." : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 10, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.55 },

  variant_primary: { backgroundColor: "#2563eb" },
  variant_secondary: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#d1d5db" },
  variant_danger: { backgroundColor: "#ef4444" },

  size_sm: { paddingVertical: 8, paddingHorizontal: 14 },
  size_md: { paddingVertical: 13, paddingHorizontal: 20 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 24 },

  text: { fontWeight: "600" },
  text_primary: { color: "#fff" },
  text_secondary: { color: "#374151" },
  text_danger: { color: "#fff" },

  textSize_sm: { fontSize: 13 },
  textSize_md: { fontSize: 15 },
  textSize_lg: { fontSize: 16 },
});
