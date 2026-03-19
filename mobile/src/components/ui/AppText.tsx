import { Text, StyleSheet, type TextProps } from "react-native";
import { colors, typography } from "@/lib/theme";

type Variant = "title" | "heading" | "body" | "caption" | "label";
type Color = "default" | "muted" | "primary" | "danger";

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

export function AppText({ variant = "body", color = "default", style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[styles[`variant_${variant}`], styles[`color_${color}`], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  variant_title: {
    fontSize: typography["2xl"],
    fontWeight: typography.bold,
    lineHeight: typography["2xl"] * typography.lineHeightTight,
  },
  variant_heading: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    lineHeight: typography.lg * typography.lineHeightNormal,
  },
  variant_body: {
    fontSize: typography.md,
    fontWeight: typography.normal,
    lineHeight: typography.md * typography.lineHeightNormal,
  },
  variant_caption: {
    fontSize: typography.xs,
    fontWeight: typography.normal,
    lineHeight: typography.xs * typography.lineHeightNormal,
  },
  variant_label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    lineHeight: typography.sm * typography.lineHeightNormal,
  },

  color_default: { color: colors.textPrimary },
  color_muted: { color: colors.textSecondary },
  color_primary: { color: colors.primary },
  color_danger: { color: colors.danger },
});
