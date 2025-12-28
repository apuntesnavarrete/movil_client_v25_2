import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { API_URL } from './src/config/config';
import { RootStackParamList } from './src/navigation/types';

// 🔹 Screen props type
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
const [isOnline, setIsOnline] = useState(true);


 useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsOnline(!!state.isConnected);
  });

  return () => unsubscribe();
}, []);

  const login = async () => {

   


    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
        setMessage('Login successful!');
        navigation.navigate('TrabajoDiario');
      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Error connecting to server.');
    }
  };

  return (
    <View style={styles.container}>

{isOnline ? (
  <Text style={{ color: 'green', textAlign: 'center', marginBottom: 10 }}>
    You are online.
  </Text>
) : (
  <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
    You are offline. Login will be limited.
  </Text>
)}

      <Text style={styles.title}>Login-4.8</Text>

      <Text>Usuario:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter username"
      />

      <Text>Contraseña:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry
      />

      <Button title="Ingresar" onPress={login} />
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
