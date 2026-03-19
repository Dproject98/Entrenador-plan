import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopColor: "#e5e7eb" },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarLabel: "Inicio",
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Entrenamientos",
          tabBarLabel: "Entrenar",
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrición",
          tabBarLabel: "Nutrición",
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: "Planes",
          tabBarLabel: "Planes",
        }}
      />
    </Tabs>
  );
}
