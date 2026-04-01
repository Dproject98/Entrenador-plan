import { useEffect } from "react";
import { View } from "react-native";
import { Stack, Redirect, SplashScreen } from "expo-router";
import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import NetInfo from "@react-native-community/netinfo";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/services/api";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { queryClient, asyncStoragePersister } from "@/lib/queryClient";

SplashScreen.preventAutoHideAsync();

// Let React Query know about connectivity so it pauses/resumes queries automatically
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? true);
  });
});

export default function RootLayout() {
  const { accessToken, isLoading, clearAuth, loadTokens } = useAuthStore();

  const isDemo = process.env.EXPO_PUBLIC_DEMO === "1";

  useEffect(() => {
    async function bootstrap() {
      if (isDemo) {
        useAuthStore.setState({
          user: { id: "demo", name: "Carlos Ruiz", email: "carlos@demo.com", createdAt: new Date().toISOString() },
          accessToken: "demo-token",
          isLoading: false,
        });
        SplashScreen.hideAsync();
        return;
      }
      const token = await loadTokens();
      if (token) {
        try {
          const user = await authApi.me();
          useAuthStore.setState({ user, accessToken: token, isLoading: false });
        } catch {
          await clearAuth();
        }
      }
      SplashScreen.hideAsync();
    }
    bootstrap();
  }, []);

  if (isLoading) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <ErrorBoundary>
        <View style={{ flex: 1 }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="workout/[sessionId]"
              options={{ headerShown: true, title: "Sesión" }}
            />
            <Stack.Screen
              name="workout/log"
              options={{ headerShown: true, title: "Nueva sesión" }}
            />
            <Stack.Screen
              name="plans/[planId]"
              options={{ headerShown: true, title: "Plan" }}
            />
          </Stack>
        </View>
        {!accessToken && <Redirect href="/(auth)/login" />}
      </ErrorBoundary>
    </PersistQueryClientProvider>
  );
}
