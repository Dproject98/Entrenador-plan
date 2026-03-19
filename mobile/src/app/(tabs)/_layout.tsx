import { Tabs } from "expo-router";
import { colors, typography } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: typography.xs,
          fontWeight: typography.semibold,
        },
        headerStyle: {
          backgroundColor: colors.bgCard,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        } as object,
        headerTitleStyle: {
          fontSize: typography.md,
          fontWeight: typography.semibold,
          color: colors.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarLabel: "Inicio" }} />
      <Tabs.Screen name="workouts" options={{ title: "Entrenamientos", tabBarLabel: "Entrenar" }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrición", tabBarLabel: "Nutrición" }} />
      <Tabs.Screen name="plans" options={{ title: "Planes", tabBarLabel: "Planes" }} />
    </Tabs>
  );
}
