import { View, Text, StyleSheet } from "react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

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
    backgroundColor: "#f59e0b",
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
