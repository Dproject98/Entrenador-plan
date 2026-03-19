import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    // Fetch once on mount
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isInternetReachable };
}
