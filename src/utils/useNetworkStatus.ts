import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online =
        state.isConnected === true &&
        state.isInternetReachable === true;

      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return isOnline;
}
