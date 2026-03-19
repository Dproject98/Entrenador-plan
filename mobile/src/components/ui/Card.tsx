import { View, StyleSheet, type ViewProps } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

interface CardProps extends ViewProps {
  padding?: number;
}

export function Card({ style, padding = spacing[4], children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border, // Bluesky: border, no shadow
  },
});
