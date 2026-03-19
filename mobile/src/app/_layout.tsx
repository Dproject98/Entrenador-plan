import { useEffect } from "react";
import { View } from "react-native";
import { Stack, Redirect, SplashScreen } from "expo-router";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/services/api";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

SplashScreen.preventAutoHideAsync();

// Let React Query know about connectivity so it pauses/resumes queries automatically
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? true);
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function RootLayout() {
  const { accessToken, isLoading, clearAuth, loadTokens } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
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
    <QueryClientProvider client={queryClient}>
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
          </Stack>
        </View>
        {!accessToken && <Redirect href="/(auth)/login" />}
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
