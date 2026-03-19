import { useEffect } from "react";
import { Stack, Redirect, SplashScreen } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/services/api";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  const { accessToken, isLoading, setAuth, clearAuth, loadTokens } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      const token = await loadTokens();
      if (token) {
        try {
          const user = await authApi.me();
          // me() uses the token via interceptor, but store already has it
          // Re-set to keep user object populated
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/[sessionId]" options={{ headerShown: true, title: "Sesión" }} />
        <Stack.Screen name="workout/log" options={{ headerShown: true, title: "Nueva sesión" }} />
      </Stack>
      {!accessToken && <Redirect href="/(auth)/login" />}
    </QueryClientProvider>
  );
}
