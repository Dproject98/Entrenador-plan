import { View, Text, StyleSheet } from "react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { colors, typography, spacing } from "@/lib/theme";

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Sin conexión — mostrando datos en caché</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    alignItems: "center",
  },
  text: {
    color: colors.textInverted,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
  },
});
