import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from "react-native";
import { colors, typography, radius, spacing } from "@/lib/theme";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
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
      activeOpacity={0.75}
      {...rest}
    >
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {loading ? "Cargando..." : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full, // pill — Bluesky signature
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },

  variant_primary: { backgroundColor: colors.primary },
  variant_secondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_danger: { backgroundColor: colors.danger },
  variant_ghost: { backgroundColor: "transparent" },

  size_sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4] },
  size_md: { paddingVertical: spacing[3], paddingHorizontal: spacing[5] },
  size_lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[6] },

  text: { fontWeight: typography.semibold },
  text_primary: { color: colors.textInverted },
  text_secondary: { color: colors.textPrimary },
  text_danger: { color: colors.textInverted },
  text_ghost: { color: colors.primary },

  textSize_sm: { fontSize: typography.sm },
  textSize_md: { fontSize: typography.md },
  textSize_lg: { fontSize: typography.md },
});
