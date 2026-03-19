import { Text, StyleSheet, type TextProps } from "react-native";

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
  variant_title: { fontSize: 26, fontWeight: "700", lineHeight: 32 },
  variant_heading: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
  variant_body: { fontSize: 15, lineHeight: 22 },
  variant_caption: { fontSize: 12, lineHeight: 16 },
  variant_label: { fontSize: 14, fontWeight: "600", lineHeight: 20 },

  color_default: { color: "#111827" },
  color_muted: { color: "#6b7280" },
  color_primary: { color: "#2563eb" },
  color_danger: { color: "#ef4444" },
});
