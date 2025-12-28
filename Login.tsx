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

const TORNEOS_BY_ROLE: Record<string, number[]> = {
  pro: [47, 39],
  ed: [19, 21],
};

const preloadPlanteles = async (role: string) => {
  try {
    const torneoIds = TORNEOS_BY_ROLE[role] || [];

    console.log('Preloading planteles for role:', role);
    console.log('Torneo IDs:', torneoIds);

    const requests = torneoIds.map(id =>
      fetch(`${API_URL}/planteles/${id}`).then(r => r.json())
    );

    const results = await Promise.all(requests);

    // Merge all planteles into one array
    const allPlanteles = results.flat();

    console.log('Planteles loaded:', allPlanteles.length);

    await AsyncStorage.setItem(
      'planteles_cache',
      JSON.stringify(allPlanteles)
    );

    console.log('Planteles cached ✅');
  } catch (err) {
    console.log('Error preloading planteles ❌', err);
  }
};

const preloadData = async () => {
  try {
    const [partidos, asistencias] = await Promise.all([
      fetch(`${API_URL}/asistencias`).then(r => r.json()),
      fetch(`${API_URL}/partidos`).then(r => r.json()),
    ]);


    await AsyncStorage.multiSet([
      ['partidos', JSON.stringify(partidos)],
      ['asistencias', JSON.stringify(asistencias)],
    ]);


    console.log('Preload completed and cached ✅');

  } catch (err) {
    console.log('Preload error:', err);
  }
};

  const login = async () => {

   
    if (!isOnline) {
  const storedUser = await AsyncStorage.getItem('offlineUser');

  if (!storedUser) {
    setMessage('Offline login not available. Connect to internet first.');
    return;
  }

  const parsedUser = JSON.parse(storedUser);

  if (parsedUser.username === username) {
    setMessage('Offline login successful');
    navigation.navigate('TrabajoDiario');
  } else {
    setMessage('Offline login failed');
  }

  return;
}


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
      
             await AsyncStorage.setItem(
               'offlineUser',
                   JSON.stringify({ username })
                        );
      
          // 🔹 preload all critical data
          await preloadData();
const role = data.role; // backend should return role
await preloadPlanteles(role);
console.log(role)
      
      
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

      <Text style={styles.title}>Login-4.9</Text>

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
