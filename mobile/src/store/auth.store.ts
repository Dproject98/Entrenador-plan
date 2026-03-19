import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User } from "@/types/api.types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setAccessToken: (token: string) => void;
  clearAuth: () => Promise<void>;
  loadTokens: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    set({ user, accessToken, isLoading: false });
  },

  setAccessToken: (token) => {
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ user: null, accessToken: null, isLoading: false });
  },

  loadTokens: async () => {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    set({ isLoading: false });
    return token;
  },
}));

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
