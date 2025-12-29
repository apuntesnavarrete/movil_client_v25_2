import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from './src/navigation/types';
import { onlineLogin, offlineLogin } from './src/utils/authService';
import {
  preloadCoreData,
  preloadPlanteles,
} from './src/utils/PreloadService';
import { NetworkStatusMessage } from './src/components/NetworkStatusMessage';
import { syncPendingUpdates } from './src/utils/partidosService';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const data = await onlineLogin(username, password);

      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem(
        'offlineUser',
        JSON.stringify({ username })
      );
      
      await syncPendingUpdates();
      await preloadCoreData();
      await preloadPlanteles(data.role);

      setMessage('Login successful');
      navigation.navigate('TrabajoDiario');
    } catch {
      const success = await offlineLogin(username);

      if (success) {
        setMessage('Offline login successful');
        navigation.navigate('TrabajoDiario');
      } else {
        setMessage('Login failed');
      }
    }
  };

  return (
    <View style={styles.container}>
      <NetworkStatusMessage />

      <Text style={styles.title}>Login 5.6</Text>

      <Text>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
      />

      <Text>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    marginTop: 10,
  },
});

