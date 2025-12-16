import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

import { API_URL } from './src/config/config';


import AsyncStorage from '@react-native-async-storage/async-storage';
//import { router } from 'expo-router';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

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

        console.log("listo ok")

        await AsyncStorage.setItem('accessToken', data.accessToken);
        setMessage('Login successful!');
    //  router.push('/trabajoDiario');

      } else {
        setMessage(data.message || 'Login failed.');
      }
    } catch (error) {
      
      console.error('Error during login:', error); //esto se quita en produccion
      setMessage('Error connecting to server.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login-3</Text>

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