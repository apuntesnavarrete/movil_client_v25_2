import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../utils/useNetworkStatus';

export function NetworkStatusMessage() {
  const isOnline = useNetworkStatus();

  return (
    <Text
      style={[
        styles.text,
        { color: isOnline ? 'green' : 'red' },
      ]}
    >
      {isOnline
        ? 'Connected to the internet.'
        : 'No internet connection. Some features may be unavailable.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    marginBottom: 10,
  },
});
