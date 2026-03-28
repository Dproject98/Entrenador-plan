import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }} detachInactiveScreens={false}>
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="workouts" options={{ title: "Entrenar" }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrición" }} />
      <Tabs.Screen name="plans" options={{ title: "Planes" }} />
      <Tabs.Screen name="social" options={{ title: "Social" }} />
    </Tabs>
  );
}
