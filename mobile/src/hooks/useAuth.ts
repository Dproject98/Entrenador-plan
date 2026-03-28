import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import type { LoginBody, RegisterBody } from "@/types/api.types";

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (body: LoginBody) => authApi.login(body),
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace("/(tabs)");
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (body: RegisterBody) => authApi.register(body),
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace("/(tabs)");
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: async () => {
      queryClient.clear();
      await clearAuth();
      router.replace("/(auth)/login");
    },
  });
}
